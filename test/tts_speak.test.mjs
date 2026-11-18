/**
 * Exercises the real tts_speak tool end to end with a fake context, a fake
 * fetch and a throwaway settings file: the daily quota must not be crossed by
 * two concurrent requests.
 */
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

const home = await mkdtemp(path.join(tmpdir(), 'breeze-tts-test-'))
process.env.USERPROFILE = home
process.env.HOME = home
await mkdir(path.join(home, '.dsh'), { recursive: true })
await writeFile(path.join(home, '.dsh', 'breeze.json'), JSON.stringify({
  apiKey: 'test-key',
  voiceId: 'voc_test',
  modelId: 'breeze-tts-2',
  languageCode: 'zh',
  languageMode: 'auto',
  dailyChars: 10,
  moodId: 'normal',
  emotionMode: 'fixed',
  autoSpeak: false,
  tones: [
    { id: 'normal', name: 'Natural', instructions: 'calm', builtin: true },
    { id: 'warm', name: 'Warm', instructions: 'warm words', builtin: true },
  ],
}, null, 2))

function makeWav(samples = 240) {
  const header = Buffer.alloc(44)
  const data = Buffer.alloc(samples * 2)
  const byteRate = 24000 * 2
  header.write('RIFF', 0, 'ascii')
  header.writeUInt32LE(36 + data.length, 4)
  header.write('WAVE', 8, 'ascii')
  header.write('fmt ', 12, 'ascii')
  header.writeUInt32LE(16, 16)
  header.writeUInt16LE(1, 20)
  header.writeUInt16LE(1, 22)
  header.writeUInt32LE(24000, 24)
  header.writeUInt32LE(byteRate, 28)
  header.writeUInt16LE(2, 32)
  header.writeUInt16LE(16, 34)
  header.write('data', 36, 'ascii')
  header.writeUInt32LE(data.length, 40)
  return Buffer.concat([header, data])
}

const calls = []
globalThis.fetch = async (url, init = {}) => {
  const target = String(url)
  calls.push({ url: target, body: init.body ? JSON.parse(init.body) : null })
  return {
    ok: true,
    status: 200,
    async text() { return '' },
    async json() { return {} },
    async arrayBuffer() {
      const audio = makeWav()
      return audio.buffer.slice(audio.byteOffset, audio.byteOffset + audio.byteLength)
    },
  }
}

const { apply } = await import('../index.js')

const tools = new Map()
let handleRoute
let emotionPrompt
const fakeCtx = {
  get(name) {
    if (name === 'webServer') return { register(route) {
      handleRoute = route.handler
      return () => {}
    } }
    if (name === 'systemPrompt') return { section(section) {
      emotionPrompt = section.text
      return () => {}
    } }
    return undefined
  },
  effect(fn) {
    fn()
    return () => {}
  },
  tools: {
    register(tool) {
      tools.set(tool.name, tool)
      return () => {}
    },
  },
}
apply(fakeCtx, {})

async function getUsage() {
  let payload
  const res = {
    setHeader(name, value) { assert.equal(name, 'cache-control'); assert.equal(value, 'no-store') },
    writeHead(status) { assert.equal(status, 200) },
    end(body) { payload = JSON.parse(body) },
  }
  await handleRoute({ method: 'GET', url: '/breeze-tts/usage' }, res)
  return payload
}

const speak = tools.get('tts_speak')
assert.ok(speak, 'tts_speak was not registered')

let passed = 0
async function check(name, fn) {
  try {
    await fn()
    passed += 1
    console.log('ok   ' + name)
  } catch (error) {
    console.log('FAIL ' + name)
    console.log('     ' + (error && error.message ? error.message : String(error)))
    process.exitCode = 1
  }
}

await check('two concurrent 8-character requests cannot both spend a 10-character budget', async () => {
  calls.length = 0
  assert.deepEqual(await getUsage(), { chars: 0, limit: 10, hasKey: true, autoSpeak: false })
  const results = await Promise.allSettled([
    speak.execute({ text: '一二三四五六七八', play: false }),
    speak.execute({ text: 'abcdefgh', play: false }),
  ])
  const ok = results.filter((r) => r.status === 'fulfilled')
  const failed = results.filter((r) => r.status === 'rejected')
  assert.equal(ok.length, 1, 'exactly one request may succeed')
  assert.equal(failed.length, 1, 'the other must be refused')
  assert.match(String(failed[0].reason && failed[0].reason.message), /daily limit/)
  const tts = calls.filter((c) => c.url.includes('/text-to-speech/'))
  assert.equal(tts.length, 1, 'only one synthesis call may reach the API, got ' + tts.length)
})

await check('the stored usage matches what was actually sent', async () => {
  const store = JSON.parse(await readFile(path.join(home, '.dsh', 'breeze.json'), 'utf8'))
  assert.equal(store.usageChars, 8)
})

await check('the quota route reflects tool usage without calling Breeze', async () => {
  calls.length = 0
  assert.deepEqual(await getUsage(), { chars: 8, limit: 10, hasKey: true, autoSpeak: false })
  assert.equal(calls.length, 0)
})

await check('a request over the remaining budget is refused before the API call', async () => {
  calls.length = 0
  await assert.rejects(
    () => speak.execute({ text: '一二三四五', play: false }),
    /daily limit/,
  )
  assert.equal(calls.length, 0)
})

await check('the language a fixed mode asks for is the one sent', async () => {
  await writeFile(path.join(home, '.dsh', 'breeze.json'), JSON.stringify({
    apiKey: 'test-key',
    voiceId: 'voc_test',
    modelId: 'breeze-tts-2',
    languageCode: 'zh',
    languageMode: 'en',
    dailyChars: 500,
    moodId: 'normal',
    emotionMode: 'fixed',
    tones: [{ id: 'normal', name: 'Natural', instructions: 'calm', builtin: true }],
  }, null, 2))
  calls.length = 0
  await speak.execute({ text: '一二三', play: false })
  const tts = calls.filter((c) => c.url.includes('/text-to-speech/'))
  assert.equal(tts.length, 1)
  assert.equal(tts[0].body.language_code, 'en', 'languageMode en must win over languageCode zh')
})

await check('auto mode uses the detected language', async () => {
  await writeFile(path.join(home, '.dsh', 'breeze.json'), JSON.stringify({
    apiKey: 'test-key',
    voiceId: 'voc_test',
    modelId: 'breeze-tts-2',
    languageCode: 'zh',
    languageMode: 'auto',
    dailyChars: 500,
    moodId: 'normal',
    emotionMode: 'fixed',
    tones: [{ id: 'normal', name: 'Natural', instructions: 'calm', builtin: true }],
  }, null, 2))
  calls.length = 0
  await speak.execute({ text: 'hello there', play: false })
  const tts = calls.filter((c) => c.url.includes('/text-to-speech/'))
  assert.equal(tts[0].body.language_code, 'en')
})

await check('a custom tone reaches the API as its own instructions', async () => {
  await writeFile(path.join(home, '.dsh', 'breeze.json'), JSON.stringify({
    apiKey: 'test-key',
    voiceId: 'voc_test',
    modelId: 'breeze-tts-2',
    languageCode: 'zh',
    languageMode: 'auto',
    dailyChars: 500,
    moodId: 'normal',
    emotionMode: 'fixed',
    tones: [
      { id: 'normal', name: 'Natural', instructions: 'calm', builtin: true },
      { id: 'my-warm', name: 'My warm', instructions: 'warm words', builtin: false },
    ],
  }, null, 2))
  calls.length = 0
  const out = await speak.execute({ text: '你好', mood: 'my-warm', play: false })
  const tts = calls.filter((c) => c.url.includes('/text-to-speech/'))
  assert.equal(tts[0].body.instructions, 'warm words')
  assert.equal(out.mood, 'my-warm')
})

await check('the builtin warm tone is used when asked for', async () => {
  await writeFile(path.join(home, '.dsh', 'breeze.json'), JSON.stringify({
    apiKey: 'test-key',
    voiceId: 'voc_test',
    modelId: 'breeze-tts-2',
    languageCode: 'zh',
    languageMode: 'auto',
    dailyChars: 500,
    moodId: 'normal',
    emotionMode: 'fixed',
    tones: [],
  }, null, 2))
  calls.length = 0
  const out = await speak.execute({ text: '你好', mood: 'warm', play: false })
  const tts = calls.filter((c) => c.url.includes('/text-to-speech/'))
  assert.ok(tts[0].body.instructions && tts[0].body.instructions.length > 4)
  assert.equal(out.mood, 'warm')
})

await check('model tagging emits emoji markers and synthesis uses the same cache and quota as legacy tags', async () => {
  assert.equal(emotionPrompt(), '')
  const res = {
    writeHead(status) { assert.equal(status, 200) },
    end() {},
  }
  await handleRoute({
    method: 'POST',
    url: '/breeze-tts/settings',
    async *[Symbol.asyncIterator]() {
      yield Buffer.from(JSON.stringify({ emotionMode: 'marker' }))
    },
  }, res)
  const prompt = emotionPrompt()
  assert.equal((prompt.match(/breeze-mood:/g) || []).length, 12)
  assert.ok(prompt.includes('[😄](breeze-mood:happy)'))
  assert.ok(prompt.includes('[🤫](breeze-mood:whisper)'))
  assert.equal(prompt.includes('<!--mood:'), false)

  calls.length = 0
  const before = await getUsage()
  const reply = await speak.execute({
    text: '[😄](breeze-mood:happy) Hello there. [🤫](breeze-mood:whisper) 小声说一句。',
    play: false,
  })
  const sent = calls.filter((call) => call.url.includes('/text-to-speech/')).map((call) => call.body)
  assert.deepEqual(sent.map((body) => [body.text, body.language_code]), [
    ['Hello there.', 'en'],
    ['小声说一句。', 'zh'],
  ])
  assert.match(sent[0].instructions, /愉快/)
  assert.match(sent[1].instructions, /耳语/)
  assert.equal(reply.chars, 18)
  assert.equal((await getUsage()).chars, before.chars + 18)

  const legacy = await speak.execute({
    text: '<!--mood:happy-->Hello there. <!--mood:whisper-->小声说一句。',
    play: false,
  })
  assert.equal(legacy.chars, 0)
  assert.equal(calls.length, 2, 'the legacy spelling should hit the same cache')
  assert.equal((await getUsage()).chars, before.chars + 18)
})

console.log('\n' + passed + ' checks passed')
