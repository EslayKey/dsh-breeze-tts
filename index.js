import { spawn } from 'node:child_process'
import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import path from 'node:path'
import { createHash, randomUUID } from 'node:crypto'

const API_BASE = 'https://api.breeze.blue/v1'
const ROUTE_PREFIX = '/breeze-tts'
const SETTINGS_PATH = path.join(homedir(), '.dsh', 'breeze.json')
const CACHE_DIR = path.join(homedir(), '.dsh', 'breeze-tts')

const VOICE_PRESETS = [
  { voiceId: 'voc_rc894j8q2auu', name: '知绘小姐', tag: '女 · 年轻 · 明亮干脆', gender: 'female' },
  { voiceId: 'voc_reys5un5t4ed', name: '深思先生', tag: '男 · 成年 · 标准普通话', gender: 'male' },
  { voiceId: 'voc_u3nxkd5578wc', name: '大肥鱼（机灵版）', tag: '女 · 少女 · 活泼', gender: 'female' },
  { voiceId: 'voc_8yud7hz7c9q2', name: '大肥鱼（迷糊版）', tag: '女 · 少女 · 慵懒', gender: 'female' },
]

const DEFAULT_TONES = [
  { id: 'normal', name: '自然', instructions: '像平时聊天一样自然地说话，语速适中，不要播音腔。', builtin: true },
  { id: 'warm', name: '温和', instructions: '语气温和亲切，语速稍慢，句尾柔和，像在耐心安慰对方。', builtin: true },
  { id: 'formal', name: '正式', instructions: '语气正式清晰，吐字清楚，节奏平稳，像在做正式说明。', builtin: true },
  { id: 'lively', name: '活泼', instructions: '语气轻快有活力，语速稍快，句尾上扬，带一点兴奋。', builtin: true },
]

const DEFAULTS = {
  voiceId: 'voc_rc894j8q2auu',
  savedVoices: [],
  modelId: 'breeze-tts-2',
  languageCode: 'zh',
  languageMode: 'auto',
  dailyChars: 1500,
  previewText: '你好，这是一段语音试听。',
  moodId: 'normal',
  customMood: '',
  emotionMode: 'fixed',
  autoSpeak: false,
  autoSpeakMaxChars: 120,
  backgroundPlay: false,
  tones: DEFAULT_TONES,
}

export const inject = ['tools', 'webServer']

function parseJson(text) {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

async function readStore() {
  try {
    const raw = await readFile(SETTINGS_PATH, 'utf8')
    const trimmed = raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw
    return parseJson(trimmed) ?? {}
  } catch {
    return {}
  }
}

async function writeStore(patch) {
  const current = await readStore()
  const next = { ...current, ...patch }
  await mkdir(path.dirname(SETTINGS_PATH), { recursive: true })
  await writeFile(SETTINGS_PATH, JSON.stringify(next, null, 2), 'utf8')
  return next
}

function usageKey() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

function creditsOf(chars) {
  return Math.round(chars * 0.19 * 10) / 10
}

const CJK = /[\u3400-\u4DBF\u4E00-\u9FFF\u3040-\u30FF\uAC00-\uD7AF]/g
const LATIN = /[A-Za-z]/g

const SENTENCE_MARKS = [0x3002, 0xFF01, 0xFF1F, 0x2026, 0xFF1B, 0x21, 0x3F, 0x3B, 0x0A].map((code) => String.fromCharCode(code)).join('')

function countMatches(text, pattern) {
  const found = String(text).match(pattern)
  return found ? found.length : 0
}

function stripEmoji(text) {
  let out = ''
  for (const ch of String(text ?? '')) {
    const cp = ch.codePointAt(0)
    if (cp >= 0x1f000 && cp <= 0x1faff) continue
    if (cp >= 0x2600 && cp <= 0x27bf) continue
    if (cp === 0xfe0f || cp === 0x200d || cp === 0x2b50) continue
    out += ch
  }
  return out
}

function cleanSpeech(text, keepTags) {
  let value = String(text ?? '')
  if (!keepTags) value = value.replace(/<!--[\s\S]*?-->/g, ' ')
  value = value.replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
  value = value.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
  value = value.replace(/https?:\/\/[^\s)]+/g, ' ')
  value = value.replace(/`{1,3}[^`]*`{1,3}/g, ' ')
  value = value.replace(/[*_~#>|]+/g, ' ')
  value = stripEmoji(value)
  value = value.replace(/\s+([：，。！？；、）】」》])/g, '$1')
  value = value.replace(/([（【「《])\s+/g, '$1')
  value = value.replace(/\s+/g, ' ')
  return value.trim()
}

function detectLanguage(text) {
  const cjk = countMatches(text, CJK)
  const latin = countMatches(text, LATIN)
  if (cjk === 0) return latin > 0 ? "en" : ""
  return cjk * 2 >= latin ? "zh" : "en"
}

function splitSentences(text) {
  const value = String(text ?? '').trim()
  if (!value) return []
  const parts = []
  let buffer = ''
  for (let index = 0; index < value.length; index += 1) {
    const ch = value[index]
    buffer += ch
    const next = value[index + 1]
    const asciiStop = ch === '.' && (next === undefined || next === ' ' || next === String.fromCharCode(10) || next === String.fromCharCode(9) || next === '"' || next === "'" || next === ')' || next === ']')
    if (SENTENCE_MARKS.includes(ch) || asciiStop) {
      parts.push(buffer)
      buffer = ''
    }
  }
  if (buffer.trim()) parts.push(buffer)
  return parts.map((part) => part.trim()).filter(Boolean)
}

const EMOTIONS = {
  curious: 'TONE_CURIOUS',
  excited: 'TONE_EXCITED',
  sad: 'TONE_SAD',
  gentle: 'TONE_GENTLE',
}

function emotionInstruction(emotion) {
  if (emotion === 'curious') return '语气带着好奇和疑问，句尾略微上扬。'
  if (emotion === 'excited') return '语气兴奋，语速稍快，音调偏高。'
  if (emotion === 'happy') return '语气愉快，带着笑意，句尾轻轻上扬。'
  if (emotion === 'angry') return '语气生气，音量略高，语速偏快，带着一点压迫感。'
  if (emotion === 'down') return '语气沮丧，声音发闷，语速放慢。'
  if (emotion === 'sad') return '语气低落，语速放慢，尾音下沉。'
  if (emotion === 'whisper') return '压低声音像耳语，气息多，音量小。'
  if (emotion === 'surprised') return '语气惊讶，语调突然抬高，语速略快。'
  if (emotion === 'afraid') return '语气带着紧张和不安，声音发抖，语速不稳。'
  if (emotion === 'serious') return '语气严肃克制，吐字清楚，节奏稳定。'
  if (emotion === 'tired') return '语气疲惫，声音有气无力，语速偏慢。'
  if (emotion === 'gentle') return '语气轻柔，像在轻声安慰对方。'
  return ''
}

function guessEmotion(sentence) {
  const value = String(sentence).trim()
  if (!value) return ''
  if (/[?？]\s*$/.test(value)) return 'curious'
  if (/[!！]\s*$/.test(value)) return 'excited'
  if (/(…|\.\.\.)\s*$/.test(value)) return 'sad'
  return ''
}

function splitByMarker(text) {
  const parts = []
  const pattern = /<!--\s*mood:\s*([a-z-]+)\s*-->/gi
  let lastIndex = 0
  let current = ''
  let match = pattern.exec(text)
  while (match) {
    const before = text.slice(lastIndex, match.index)
    if (before.trim()) parts.push({ text: before, emotion: current })
    current = String(match[1] || '').toLowerCase()
    lastIndex = match.index + match[0].length
    match = pattern.exec(text)
  }
  const tail = text.slice(lastIndex)
  if (tail.trim()) parts.push({ text: tail, emotion: current })
  return parts
}

function planSegments(text, mode, baseInstructions) {
  const sentences = splitSentences(text)
  const segments = []
  let pendingEmotion = ''

  let carry = ''
  for (const sentence of sentences) {
    let emotion = mode === 'infer' ? guessEmotion(sentence) : ''
    if (!emotion && carry && sentence.length <= 40) emotion = carry
    if (emotion) carry = emotion
    const instructions = emotion ? emotionInstruction(emotion) : baseInstructions
    const last = segments[segments.length - 1]
    if (last && last.instructions === instructions && last.text.length + sentence.length <= 900) {
      last.text += sentence
      continue
    }
    segments.push({ text: sentence, instructions, emotion: emotion || pendingEmotion })
  }
  if (mode === 'marker') {
    const parts = splitByMarker(text)
    if (parts.length > 1) {
      const merged = []
      for (const part of parts) {
        const piece = cleanSpeech(part.text)
        if (!piece) continue
        const instructions = part.emotion ? (emotionInstruction(part.emotion) || baseInstructions) : baseInstructions
        const last = merged[merged.length - 1]
        if (last && last.instructions === instructions && last.text.length + piece.length <= 900) {
          last.text += piece
          continue
        }
        merged.push({ text: piece, instructions, emotion: part.emotion })
      }
      return merged
    }
  }
  return segments
}

function chunkByLanguage(text, limit = 900) {
  const chunks = []
  for (const part of splitSentences(text)) {
    const lang = detectLanguage(part)
    const last = chunks[chunks.length - 1]
    if (last && last.lang === lang && last.text.length + part.length <= limit) {
      last.text += part
      continue
    }
    chunks.push({ text: part, lang })
  }
  return chunks
}

function concatWav(buffers) {
  let fmt = null
  const frames = []
  for (const buffer of buffers) {
    if (buffer.toString('ascii', 0, 4) !== 'RIFF') throw new Error('not a wav payload')
    let pos = 12
    let localFmt = null
    while (pos + 8 <= buffer.length) {
      const tag = buffer.toString('ascii', pos, pos + 4)
      const size = buffer.readUInt32LE(pos + 4)
      const body = buffer.subarray(pos + 8, pos + 8 + size)
      if (tag === 'fmt ') localFmt = body
      else if (tag === 'data') frames.push(body)
      pos += 8 + size + (size % 2)
    }
    if (!localFmt) throw new Error('wav without fmt chunk')
    if (!fmt) fmt = localFmt
    else if (!fmt.equals(localFmt)) throw new Error('wav format mismatch')
  }
  const body = Buffer.concat(frames)
  const header = Buffer.alloc(12)
  header.write('RIFF', 0, 'ascii')
  header.writeUInt32LE(4 + (8 + fmt.length) + (8 + body.length), 4)
  header.write('WAVE', 8, 'ascii')
  const fmtChunk = Buffer.alloc(8)
  fmtChunk.write('fmt ', 0, 'ascii')
  fmtChunk.writeUInt32LE(fmt.length, 4)
  const dataChunk = Buffer.alloc(8)
  dataChunk.write('data', 0, 'ascii')
  dataChunk.writeUInt32LE(body.length, 4)
  return Buffer.concat([header, fmtChunk, fmt, dataChunk, body])
}

async function callApi(pathname, options = {}) {
  const { method = 'GET', body, query, apiKey, binary = false } = options
  const url = new URL(API_BASE + pathname)
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value))
  }
  const headers = { accept: 'application/json', 'user-agent': 'dsh-breeze-tts/1.0' }
  if (apiKey) headers['xi-api-key'] = apiKey
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData
  if (body !== undefined && !isForm) headers['content-type'] = 'application/json'
  let response
  for (let attempt = 0; attempt < 2; attempt += 1) {
    response = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    })
    if (response.ok || ![502, 503, 504].includes(response.status)) break
    if (attempt === 0) await new Promise((resolve) => setTimeout(resolve, 1500))
  }
  if (!response.ok) {
    const text = await response.text()
    const parsed = parseJson(text) ?? {}
    const failure = new Error(parsed.detail || parsed.error || `HTTP ${response.status}`)
    failure.code = parsed.code || ''
    failure.status = response.status
    throw failure
  }
  if (binary) return Buffer.from(await response.arrayBuffer())
  return response.json()
}

const PLAY_LOG = path.join(CACHE_DIR, 'last-play.log')
const POWERSHELL = path.join(process.env.SystemRoot || 'C:\Windows',
  'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe')

function logPlay(line) {
  appendFile(PLAY_LOG, `${new Date().toISOString()} ${line}
`).catch(() => {})
}

function playerScript(file) {
  const escaped = String(file).replace(/'/g, "''")
  const member = '[DllImport("winmm.dll", CharSet=CharSet.Unicode)] public static extern bool PlaySound(string ps, IntPtr h, uint f);'
  return [
    `Add-Type -MemberDefinition '${member}' -Name W -Namespace BreezeTts;`,
    `$ok=[BreezeTts.W]::PlaySound('${escaped}',[IntPtr]::Zero,0x20000);`,
    'exit([int](-not $ok))',
  ].join('')
}

function warmPlayer(spawner) {
  const args = ['-NoProfile', '-NonInteractive', '-Command', 'exit 0']
  try {
    if (spawner && typeof spawner.spawn === 'function') {
      const handle = spawner.spawn({
        argv: [POWERSHELL, ...args],
        cwd: CACHE_DIR,
        stdio: { stdin: 'ignore', stdout: 'ignore', stderr: 'ignore' },
        graceMs: 2000,
      })
      handle.done.catch(() => {})
      return
    }
    const child = spawn(POWERSHELL, args, { stdio: 'ignore', windowsHide: true })
    child.on('error', () => {})
  } catch {
    /* warm-up is best effort */
  }
}

function playFile(file, spawner) {
  const script = playerScript(file)
  const args = ['-NoProfile', '-NonInteractive', '-Command', script]
  logPlay(`start ${path.basename(file)} via=${spawner ? 'subprocess' : 'node'}`)

  if (spawner && typeof spawner.spawn === 'function') {
    try {
      const handle = spawner.spawn({
        argv: [POWERSHELL, ...args],
        cwd: CACHE_DIR,
        stdio: { stdin: 'ignore', stdout: 'ignore', stderr: 'ignore' },
        graceMs: 2000,
      })
      handle.done
        .then((outcome) => {
        logPlay(`done exit=${outcome.exitCode} signal=${outcome.signal}`)
        warmPlayer(spawner)
      })
        .catch((error) => logPlay(`failed ${error instanceof Error ? error.message : String(error)}`))
      return
    } catch (error) {
      logPlay(`subprocess-threw ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  try {
    const child = spawn(POWERSHELL, args, { stdio: 'ignore', windowsHide: true })
    child.on('error', (error) => logPlay(`spawn-error ${error.message}`))
    child.on('exit', (code) => logPlay(`exit ${code}`))
  } catch (error) {
    logPlay(`spawn-threw ${error instanceof Error ? error.message : String(error)}`)
  }
}

function clip(text, limit = 90) {
  const value = String(text ?? '').replace(/\s+/g, ' ').trim()
  return value.length > limit ? `${value.slice(0, limit)}…` : value
}

export function apply(ctx, config) {
  const cfg = { ...DEFAULTS, ...(config ?? {}) }
  let fleet = { busy: 0 }
  let emotionModeCache = 'fixed'
  readStore()
    .then((store) => {
      if (typeof store.emotionMode === 'string') emotionModeCache = store.emotionMode
    })
    .catch(() => {})
  let lastAudio = ''

  async function settings() {
    const store = await readStore()
    const custom = Array.isArray(store.tones) ? store.tones.filter((tone) => tone && !tone.builtin) : []
    const tones = [...DEFAULT_TONES, ...custom]
    return {
      ...cfg,
      ...store,
      tones,
      apiKey: store.apiKey ?? store.api_key ?? process.env.BREEZE_API_KEY ?? '',
    }
  }

  async function usage() {
    const store = await readStore()
    const today = usageKey()
    if (store.usageDate !== today) return { chars: 0, calls: 0 }
    return { chars: Number(store.usageChars ?? 0), calls: Number(store.usageCalls ?? 0) }
  }

  async function accountUsage(chars) {
    const current = await usage()
    await writeStore({
      usageDate: usageKey(),
      usageChars: current.chars + chars,
      usageCalls: current.calls + 1,
    })
    return { chars: current.chars + chars, calls: current.calls + 1 }
  }

  async function synth(text, options = {}) {
    const s = await settings()
    if (!s.apiKey) throw new Error('missing Breeze API key: write it into ~/.dsh/breeze.json')
    const voiceId = options.voiceId || s.voiceId
    if (!voiceId) throw new Error('missing voice id')
    const moodId = options.toneId || s.moodId || 'normal'
    const tone = (s.tones ?? []).find((item) => item.id === moodId)
    const mood = moodId
    const customTone = String(s.customMood || '').trim()
    const instructions = options.instructions ?? (customTone || (tone ? tone.instructions : ''))
    const format = options.format || 'wav_24000'
    const planSource = (s.emotionMode === 'marker') ? String(text ?? '') : cleanSpeech(text)
    const chunks = chunkByLanguage(cleanSpeech(text))
    if (chunks.length === 0) throw new Error('empty text')
    const cacheKey = createHash('sha1').update([voiceId, mood, s.emotionMode || 'fixed', instructions, planSource].join('|')).digest('hex').slice(0, 16)
    const cachePath = path.join(CACHE_DIR, `cache-${cacheKey}.wav`)
    if (format.startsWith('wav')) {
      try {
        const hit = await readFile(cachePath)
        if (hit.length > 44) {
          return {
            audio: hit,
            langs: ['cache'],
            chars: 0,
            credits: 0,
            mood,
            voiceId,
            format: 'wav',
            cached: true,
          }
        }
      } catch {
        /* cache miss */
      }
    }
    const current = await usage()
    if (current.chars + chunks.map((piece) => piece.text).join('').length > Number(s.dailyChars ?? 1500)) {
      throw new Error(`daily limit reached (${current.chars}/${s.dailyChars} chars)`)
    }
    const buffers = []
    const fixed = s.languageMode && s.languageMode !== 'auto' ? String(s.languageMode) : ''
    const segments = planSegments(planSource, s.emotionMode || 'fixed', instructions)
    for (const piece of segments) {
      const chunk = piece.text
      const segInstructions = piece.instructions || instructions
      const segLang = detectLanguage(chunk) || s.languageCode
      const body = {
        text: chunk,
        model_id: s.modelId,
        language_code: fixed || segLang,
      }
      if (segInstructions) body.instructions = segInstructions
      const audio = await callApi(`/text-to-speech/${encodeURIComponent(voiceId)}`, {
        method: 'POST',
        body,
        query: { output_format: format, delivery: 'sync' },
        apiKey: s.apiKey,
        binary: true,
      })
      buffers.push(audio)
    }
    const chars = segments.map((piece) => piece.text).join('').length
    const merged = format.startsWith('wav') && buffers.length > 1 ? concatWav(buffers) : Buffer.concat(buffers)
    await accountUsage(chars)
    if (format.startsWith('wav')) {
      await mkdir(CACHE_DIR, { recursive: true }).catch(() => {})
      await writeFile(cachePath, merged).catch(() => {})
    }
    return {
      audio: merged,
      langs: segments.map((piece) => piece.emotion || detectLanguage(piece.text) || ''),
      chars,
      credits: creditsOf(chars),
      mood,
      voiceId,
      format: format.startsWith('wav') ? 'wav' : 'mp3',
    }
  }

  async function saveAudio(result, file) {
    await mkdir(path.dirname(file), { recursive: true })
    await writeFile(file, result.audio)
    return file
  }

  const promptService = ctx.get('systemPrompt')
  if (promptService && typeof promptService.section === 'function') {
    ctx.effect(() => promptService.section({
      name: 'breeze-tts-emotion',
      order: 950,
      text: () => {
        if (emotionModeCache !== 'marker') return ''
        return [
          'Voice emotion tags: to make part of a reply speak with a different tone,',
          'put an HTML comment tag at the start of that segment:',
          '<!--mood:curious-->, <!--mood:excited-->, <!--mood:happy-->, <!--mood:angry-->,',
          '<!--mood:down-->, <!--mood:sad-->, <!--mood:whisper-->, <!--mood:gentle-->,',
          '<!--mood:surprised-->, <!--mood:afraid-->, <!--mood:serious-->, <!--mood:tired-->.',
          'The tag only affects speech synthesis. Use them sparingly, only where the',
          'emotional shift matters.',
        ].join(' ')
      },
    }), 'breeze-tts: emotion prompt section')
  }

  ctx.effect(() => {
    const disposers = []

    disposers.push(ctx.tools.register({
      name: 'tts_speak',
      description: 'Speak a text aloud through this machine\'s speakers with Breeze Blue TTS, optionally also writing the audio to a file.',
      parameters: {
        type: 'object',
        properties: {
          text: { type: 'string', description: 'Text to synthesize. Long text is split on sentence marks.' },
          mood: { type: 'string', description: 'Delivery preset: normal, lazy, silly or eager. Defaults to the configured mood.' },
          voice_id: { type: 'string', description: 'Voice id override. Defaults to the configured voice.' },
          play: { type: 'boolean', description: 'Play through the speakers. Set false to only produce the file.' },
          save_path: { type: 'string', description: 'Absolute path to also write the audio to.' },
        },
        required: ['text'],
      },
      output: {
        schema: {
          type: 'object',
          properties: {
            ok: { type: 'boolean' },
            chars: { type: 'number' },
            credits: { type: 'number' },
            mood: { type: 'string' },
            audio: { type: 'string' },
            played: { type: 'boolean' },
          },
        },
        render: (_args, value) => [{ type: 'text', text: JSON.stringify(value) }],
      },
      async execute(args) {
        const input = args ?? {}
        const savePath = typeof input.save_path === 'string' ? input.save_path : ''
        const wantsFile = savePath !== ''
        const plays = input.play !== false
        const format = !plays && wantsFile && /\.mp3$/i.test(savePath) ? 'mp3_24000_96' : 'wav_24000'
        const result = await synth(input.text, { mood: input.mood, voiceId: input.voice_id, format })
        await mkdir(CACHE_DIR, { recursive: true })
        const file = path.join(CACHE_DIR, `${Date.now()}-${randomUUID().slice(0, 8)}.${format.startsWith('wav') ? 'wav' : 'mp3'}`)
        await saveAudio(result, file)
        const target = typeof input.save_path === 'string' && input.save_path
          ? await saveAudio(result, input.save_path)
          : file
        const played = input.play !== false
        if (played) playFile(target, ctx.get('subprocess'))
        return {
          ok: true,
          chars: result.chars,
          credits: result.credits,
          mood: result.mood,
          audio: target,
          played,
        }
      },
    }))

    disposers.push(ctx.tools.register({
      name: 'tts_voices',
      description: 'List the Breeze voices available to this account, filtered by language or a search term.',
      parameters: {
        type: 'object',
        properties: {
          search: { type: 'string', description: 'Free-text search over name and description.' },
          language: { type: 'string', description: 'ISO 639-1 language code such as zh or en.' },
          limit: { type: 'number', description: 'Maximum rows to return, default 20.' },
        },
      },
      output: {
        schema: { type: 'object', properties: { total: { type: 'number' }, voices: { type: 'array' } } },
        render: (_args, value) => [{ type: 'text', text: JSON.stringify(value) }],
      },
      async execute(args) {
        const input = args ?? {}
        const s = await settings()
        if (!s.apiKey) throw new Error('missing Breeze API key')
        const data = await callApi('/voices', {
          query: { search: input.search, language_code: input.language },
          apiKey: s.apiKey,
        })
        const rows = (data.voices ?? data.items ?? []).map((voice) => ({
          voice_id: voice.voice_id ?? voice.id,
          name: voice.name,
          language: voice.language ?? voice.language_code,
          gender: voice.gender ?? null,
          category: voice.primary_category_code ?? voice.category ?? null,
        }))
        const limit = Number(input.limit ?? 20)
        return { total: rows.length, voices: rows.slice(0, limit) }
      },
    }))

    disposers.push(ctx.tools.register({
      name: 'tts_status',
      description: 'Report Breeze TTS readiness: configured voice, today\'s character budget, credit balance and remaining quota.',
      parameters: { type: 'object', properties: {} },
      output: {
        schema: { type: 'object', properties: { ok: { type: 'boolean' } } },
        render: (_args, value) => [{ type: 'text', text: JSON.stringify(value) }],
      },
      async execute() {
        const s = await settings()
        const current = await usage()
        let balance = null
        let error = null
        if (s.apiKey) {
          try {
            const data = await callApi('/balance', { apiKey: s.apiKey })
            balance = data.balance ?? null
          } catch (caught) {
            error = caught instanceof Error ? caught.message : String(caught)
          }
        }
        return {
          ok: Boolean(s.apiKey) && !error,
          voiceId: s.voiceId,
          modelId: s.modelId,
          moodId: s.moodId,
          tones: (s.tones ?? []).map((tone) => tone.id),
          today: { chars: current.chars, calls: current.calls, limit: Number(s.dailyChars ?? 0) },
          balance,
          error,
        }
      },
    }))

    const web = ctx.get('webServer')
    if (web) {
      disposers.push(web.register({
        kind: 'prefix',
        path: ROUTE_PREFIX,
        handler: async (req, res) => {
          const url = new URL(req.url ?? '/', 'http://localhost')
          const route = url.pathname.slice(ROUTE_PREFIX.length) || '/'
          const json = (status, payload) => {
            res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' })
            res.end(JSON.stringify(payload))
          }
          const readBody = async () => {
            const chunks = []
            for await (const chunk of req) chunks.push(chunk)
            return parseJson(Buffer.concat(chunks).toString('utf8')) ?? {}
          }
          try {
            if (route === '/status' && req.method === 'GET') {
              const s = await settings()
              const current = await usage()
              let balance = null
              let error = null
              if (s.apiKey) {
                try {
                  const data = await callApi('/balance', { apiKey: s.apiKey })
                  balance = data.balance ?? null
                } catch (caught) {
                  error = caught instanceof Error ? caught.message : String(caught)
                }
              }
              return json(200, {
                ok: Boolean(s.apiKey) && !error,
                hasKey: Boolean(s.apiKey),
                voiceId: s.voiceId,
                modelId: s.modelId,
                moodId: s.moodId ?? 'normal',
                tones: (s.tones ?? []).map((tone) => ({
                  id: tone.id,
                  name: tone.name,
                  instructions: tone.instructions,
                  builtin: Boolean(tone.builtin),
                })),
                customMood: s.customMood ?? '',
                emotionMode: s.emotionMode ?? 'fixed',
                voicePresets: VOICE_PRESETS,
                savedVoices: Array.isArray(s.savedVoices) ? s.savedVoices : [],
                autoSpeak: Boolean(s.autoSpeak),
                autoSpeakMaxChars: Number(s.autoSpeakMaxChars ?? 120),
                backgroundPlay: Boolean(s.backgroundPlay),
                previewText: s.previewText,
                today: { chars: current.chars, calls: current.calls, limit: Number(s.dailyChars ?? 0) },
                balance,
                error,
              })
            }
            if (route === '/voices' && req.method === 'GET') {
              const s = await settings()
              if (!s.apiKey) return json(400, { ok: false, error: 'missing api key' })
              const data = await callApi('/voices', {
                query: { language_code: url.searchParams.get('language') ?? 'zh' },
                apiKey: s.apiKey,
              })
              const rows = (data.voices ?? data.items ?? []).map((voice) => ({
                voiceId: voice.voice_id ?? voice.id,
                name: voice.name,
                language: voice.language ?? voice.language_code,
                gender: voice.gender ?? null,
                category: voice.primary_category_code ?? voice.category ?? null,
                description: String(voice.description ?? '').slice(0, 120),
                designed: (voice.origin ?? '') === 'designed',
                private: (voice.visibility ?? '') === 'private',
              }))
              return json(200, { ok: true, voices: rows })
            }
            if (route === '/speak' && req.method === 'POST') {
              const body = await readBody()
              const result = await synth(body.text, {
                toneId: body.toneId || body.mood || '',
                voiceId: body.voiceId,
                format: 'mp3_24000_96',
              })
              res.writeHead(200, {
                'content-type': 'audio/mpeg',
                'x-tts-chars': String(result.chars),
                'x-tts-credits': String(result.credits),
              })
              return res.end(result.audio)
            }
            if (route === '/play' && req.method === 'POST') {
              const body = await readBody()
              if (body.replay === true) {
                if (!lastAudio) return json(404, { ok: false, error: 'nothing to replay' })
                playFile(lastAudio, ctx.get('subprocess'))
                return json(200, { ok: true, replay: true, audio: lastAudio })
              }
              const result = await synth(body.text, {
                toneId: body.toneId || body.mood || '',
                voiceId: body.voiceId,
                format: 'wav_24000',
              })
              await mkdir(CACHE_DIR, { recursive: true })
              const file = path.join(CACHE_DIR, `${Date.now()}-${randomUUID().slice(0, 8)}.wav`)
              await writeFile(file, result.audio)
              lastAudio = file
              playFile(file, ctx.get('subprocess'))
              return json(200, {
                ok: true,
                chars: result.chars,
                credits: result.credits,
                audio: file,
              })
            }
            if (route === '/synth' && req.method === 'POST') {
              const body = await readBody()
              const result = await synth(body.text, {
                toneId: body.toneId || body.mood || '',
                voiceId: body.voiceId,
                format: 'wav_24000',
              })
              await mkdir(CACHE_DIR, { recursive: true })
              const name = `${Date.now()}-${randomUUID().slice(0, 8)}.wav`
              const file = path.join(CACHE_DIR, name)
              await writeFile(file, result.audio)
              lastAudio = file
              return json(200, {
                ok: true,
                url: `${ROUTE_PREFIX}/audio/${name}`,
                langs: result.langs,
                chars: result.chars,
                credits: result.credits,
                file,
              })
            }
            if (route === '/play-file' && req.method === 'POST') {
              const body = await readBody()
              const raw = typeof body.file === 'string' && body.file ? body.file
                : String(body.url ?? '').split('/').pop()
              const name = path.basename(raw)
              if (!/^[A-Za-z0-9._-]+$/.test(name)) return json(400, { ok: false, error: 'bad file name' })
              const file = path.join(CACHE_DIR, name)
              playFile(file, ctx.get('subprocess'))
              return json(200, { ok: true, file })
            }
            if (route.startsWith('/audio/') && req.method === 'GET') {
              const name = path.basename(route.slice('/audio/'.length))
              if (!/^[A-Za-z0-9._-]+$/.test(name)) return json(400, { ok: false, error: 'bad file name' })
              let bytes
              try {
                bytes = await readFile(path.join(CACHE_DIR, name))
              } catch {
                return json(404, { ok: false, error: 'no such audio' })
              }
              const type = name.endsWith('.wav') ? 'audio/wav' : name.endsWith('.mp3') ? 'audio/mpeg' : 'application/octet-stream'
              res.writeHead(200, { 'content-type': type, 'content-length': String(bytes.length), 'cache-control': 'no-store' })
              return res.end(bytes)
            }
            if (route === '/design' && req.method === 'POST') {
              const body = await readBody()
              const s2 = await settings()
              if (!s2.apiKey) return json(400, { ok: false, error: 'missing api key' })
              const description = String(body.description ?? '').trim()
              if (description.length < 3) return json(400, { ok: false, error: 'description too short' })
              const sample = String(body.text ?? '').trim().slice(0, 500) || '你好，这是一段试听。'
              const data = await callApi('/voice-previews/design', {
                method: 'POST',
                body: {
                  voice_description: description.slice(0, 500),
                  text: sample,
                  model_id: s2.modelId,
                  language_code: 'zh',
                  preview_count: 3,
                },
                query: { output_format: 'mp3' },
                apiKey: s2.apiKey,
              })
              const previews = Array.isArray(data.previews) ? data.previews : []
              const candidates = []
              await mkdir(CACHE_DIR, { recursive: true })
              for (const preview of previews) {
                const generatedVoiceId = preview.generated_voice_id
                const encoded = preview.audio_base_64 || preview.audio_base64
                if (!generatedVoiceId || !encoded) continue
                const name = `${Date.now()}-${randomUUID().slice(0, 8)}.mp3`
                await writeFile(path.join(CACHE_DIR, name), Buffer.from(String(encoded), 'base64'))
                candidates.push({ generatedVoiceId, url: `${ROUTE_PREFIX}/audio/${name}` })
              }
              return json(200, { ok: true, candidates })
            }
            if (route === '/save-voice' && req.method === 'POST') {
              const body = await readBody()
              const s3 = await settings()
              if (!s3.apiKey) return json(400, { ok: false, error: 'missing api key' })
              const generatedVoiceId = String(body.generatedVoiceId ?? '')
              if (!/^[A-Za-z0-9_-]+$/.test(generatedVoiceId)) return json(400, { ok: false, error: 'bad voice id' })
              const payload = {
                voice_name: String(body.name ?? 'voice').slice(0, 60),
                language_code: 'zh',
              }
              const desc = String(body.description ?? '').trim()
              if (desc) payload.voice_description = desc.slice(0, 500)
              const saved = await callApi(`/voice-previews/${generatedVoiceId}/save`, {
                method: 'POST',
                body: payload,
                apiKey: s3.apiKey,
              })
              const savedId = saved.voice_id || (saved.voice && saved.voice.voice_id)
              if (savedId) await writeStore({ voiceId: savedId })
              return json(200, { ok: true, voiceId: savedId || null })
            }
            if (route === '/log' && req.method === 'POST') {
              const body = await readBody()
              const line = `${new Date().toISOString()} ${String(body.msg ?? '').slice(0, 400)}`
              await mkdir(CACHE_DIR, { recursive: true })
              await appendFile(path.join(CACHE_DIR, 'autospeak.log'), line + String.fromCharCode(10)).catch(() => {})
              return json(200, { ok: true })
            }
            if (route === '/rename-voice' && req.method === 'POST') {
              const body = await readBody()
              const s6 = await settings()
              if (!s6.apiKey) return json(400, { ok: false, error: 'missing api key' })
              const voiceId = String(body.voiceId ?? '')
              const name = String(body.name ?? '').trim().slice(0, 60)
              if (!/^[A-Za-z0-9_-]+$/.test(voiceId)) return json(400, { ok: false, error: 'bad voice id' })
              if (!name) return json(400, { ok: false, error: 'name required' })
              if (VOICE_PRESETS.some((preset) => preset.voiceId === voiceId)) {
                return json(400, { ok: false, error: 'builtin voice cannot be renamed' })
              }
              const form = new FormData()
              form.append('name', name)
              await callApi(`/voices/${voiceId}`, { method: 'PATCH', body: form, apiKey: s6.apiKey })
              return json(200, { ok: true, voiceId, name })
            }
            if (route === '/delete-voice' && req.method === 'POST') {
              const body = await readBody()
              const s4 = await settings()
              const voiceId = String(body.voiceId ?? '')
              if (!s4.apiKey) return json(400, { ok: false, error: 'missing api key' })
              if (!/^[A-Za-z0-9_-]+$/.test(voiceId)) return json(400, { ok: false, error: 'bad voice id' })
              if (VOICE_PRESETS.some((preset) => preset.voiceId === voiceId)) {
                return json(400, { ok: false, error: 'builtin voice cannot be removed' })
              }
              const saved = Array.isArray(s4.savedVoices) ? s4.savedVoices : []
              if (saved.some((item) => item.voiceId === voiceId)) {
                await writeStore({ savedVoices: saved.filter((item) => item.voiceId !== voiceId) })
                if ((await readStore()).voiceId === voiceId) await writeStore({ voiceId: VOICE_PRESETS[0].voiceId })
                return json(200, { ok: true, removed: 'saved' })
              }
              await callApi(`/voices/${voiceId}`, { method: 'DELETE', apiKey: s4.apiKey })
              const st5 = await readStore()
              if (st5.voiceId === voiceId) await writeStore({ voiceId: 'voc_rc894j8q2auu' })
              return json(200, { ok: true, voiceId })
            }
            if (route === '/connect' && req.method === 'POST') {
              const body = await readBody()
              const key = String(body.apiKey ?? '').trim()
              if (!key) return json(400, { ok: false, error: 'api key required' })
              try {
                const balance = await callApi('/balance', { apiKey: key })
                await writeStore({ apiKey: key })
                return json(200, { ok: true, balance: balance.balance ?? null })
              } catch (caught) {
                return json(400, {
                  ok: false,
                  error: caught instanceof Error ? caught.message : String(caught),
                  code: caught && caught.code ? String(caught.code) : '',
                  status: caught && caught.status ? Number(caught.status) : 0,
                })
              }
            }
            if (route === '/disconnect' && req.method === 'POST') {
              const store = await readStore()
              delete store.apiKey
              delete store.api_key
              await writeFile(SETTINGS_PATH, JSON.stringify(store, null, 2), 'utf8')
              return json(200, { ok: true })
            }
            if (route === '/settings' && req.method === 'POST') {
              const body = await readBody()
              const patch = {}
              if (typeof body.voiceId === 'string' && body.voiceId) patch.voiceId = body.voiceId
              if (typeof body.moodId === 'string' && body.moodId) patch.moodId = body.moodId
              if (typeof body.customMood === 'string') patch.customMood = body.customMood.slice(0, 500)
              if (typeof body.emotionMode === 'string' && ['fixed', 'infer', 'marker'].includes(body.emotionMode)) {
                patch.emotionMode = body.emotionMode
              }
              if (Array.isArray(body.savedVoices)) {
                patch.savedVoices = body.savedVoices
                  .filter((item) => item && typeof item.voiceId === 'string')
                  .map((item) => ({
                    voiceId: item.voiceId,
                    name: String(item.name ?? item.voiceId).slice(0, 60),
                    language: String(item.language ?? '').slice(0, 8),
                    description: String(item.description ?? '').slice(0, 120),
                  }))
                  .slice(0, 50)
              }
              if (Array.isArray(body.tones)) {
                patch.tones = body.tones
                  .filter((tone) => tone && typeof tone.id === 'string' && typeof tone.instructions === 'string')
                  .map((tone) => ({
                    id: String(tone.id).slice(0, 40),
                    name: String(tone.name ?? tone.id).slice(0, 40),
                    instructions: String(tone.instructions).slice(0, 500),
                    builtin: false,
                  }))
                  .slice(0, 40)
              }
              if (typeof body.previewText === 'string' && body.previewText) patch.previewText = body.previewText
              if (typeof body.dailyChars === 'number' && body.dailyChars > 0) patch.dailyChars = Math.floor(body.dailyChars)
              if (typeof body.autoSpeak === 'boolean') patch.autoSpeak = body.autoSpeak
              if (typeof body.backgroundPlay === 'boolean') patch.backgroundPlay = body.backgroundPlay
              if (typeof body.autoSpeakMaxChars === 'number' && body.autoSpeakMaxChars >= 0) {
                patch.autoSpeakMaxChars = Math.max(0, Math.min(99999, Math.floor(body.autoSpeakMaxChars)))
              }
              const written = await writeStore(patch)
              if (typeof written.emotionMode === 'string') emotionModeCache = written.emotionMode
              return json(200, { ok: true, saved: patch })
            }
            if (route === '/health') {
              let lastPlay = ''
              try {
                const lines = (await readFile(PLAY_LOG, 'utf8')).trim().split(String.fromCharCode(10))
                lastPlay = lines.slice(-6).join(' | ')
              } catch {
                lastPlay = ''
              }
              return json(200, { ok: true, busy: fleet.busy, lastPlay })
            }
            return json(404, { ok: false, error: 'unknown route', route })
          } catch (caught) {
            return json(500, {
              ok: false,
              error: caught instanceof Error ? caught.message : String(caught),
              code: caught && caught.code ? String(caught.code) : '',
              status: caught && caught.status ? Number(caught.status) : 0,
            })
          }
        },
      }))
    }

    return () => {
      for (const dispose of disposers) {
        try {
          dispose()
        } catch {
          fleet = { ...fleet }
        }
      }
    }
  }, 'dsh-breeze-tts: tools and routes')

  ctx.logger?.info?.(`breeze-tts ready (voice ${cfg.voiceId}, ${clip(cfg.modelId)})`)
}
