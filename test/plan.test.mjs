import assert from 'node:assert/strict'
import { buildPlan, cleanSpeech, detectLanguage, EMOTION_MARKERS, buildPlan as plan } from '../plan.js'

let passed = 0
function check(name, fn) {
  try {
    fn()
    passed += 1
    console.log('ok   ' + name)
  } catch (error) {
    console.log('FAIL ' + name)
    console.log('     ' + (error && error.message ? error.message : String(error)))
    process.exitCode = 1
  }
}

check('single leading marker is parsed and removed', () => {
  const { segments, chars } = plan('<!--mood:excited-->Hello world.', { emotionMode: 'marker' })
  assert.equal(segments.length, 1)
  assert.equal(segments[0].text, 'Hello world.')
  assert.equal(segments[0].emotion, 'excited')
  assert.equal(segments[0].instructions.length > 0, true)
  assert.equal(chars, 12)
  assert.equal(segments[0].text.includes('mood'), false)
})

check('markers switch tone and never reach the spoken text', () => {
  const { segments } = plan('<!--mood:happy-->今天真开心！<!--mood:whisper-->小声说一句。', { emotionMode: 'marker' })
  assert.deepEqual(segments.map((s) => s.emotion), ['happy', 'whisper'])
  assert.deepEqual(segments.map((s) => s.text), ['今天真开心！', '小声说一句。'])
})

check('all published emoji markers produce the existing tone and cost', () => {
  assert.equal(EMOTION_MARKERS.length, 12)
  for (const marker of EMOTION_MARKERS) {
    const id = /breeze-mood:([a-z]+)\)/.exec(marker)[1]
    const modern = plan(marker + ' Hello world.', { emotionMode: 'marker' })
    const legacy = plan('<!--mood:' + id + '-->Hello world.', { emotionMode: 'marker' })
    assert.deepEqual(modern, legacy)
    assert.equal(modern.chars, 12)
    assert.equal(modern.segments[0].emotion, id)
    assert.ok(modern.segments[0].instructions)
  }
})

check('mixed marker formats preserve tones, text and language', () => {
  const { segments, chars } = plan('[😄](breeze-mood:happy) Hello there. <!--mood:whisper-->小声说一句。', { emotionMode: 'marker' })
  assert.deepEqual(segments.map((s) => [s.text, s.emotion, s.language]), [
    ['Hello there.', 'happy', 'en'],
    ['小声说一句。', 'whisper', 'zh'],
  ])
  assert.equal(chars, 18)
})

check('code examples and ordinary Markdown links cannot set the tone', () => {
  const { segments } = plan('`[😄](breeze-mood:happy)` Hello [label](breeze-mood:angry).', { emotionMode: 'marker' })
  assert.deepEqual(segments.map((s) => [s.text, s.emotion]), [['Hello label.', '']])
})

check('mixed languages split into per-language segments', () => {
  const { segments } = plan('Hello world. 你好。This is English.', { emotionMode: 'fixed' })
  assert.deepEqual(segments.map((s) => s.language), ['en', 'zh', 'en'])
  for (const segment of segments) assert.equal(detectLanguage(segment.text), segment.language)
})

check('a single over-long sentence is hard split under the limit', () => {
  const text = '啊'.repeat(1001)
  const { segments, chars } = plan(text, { emotionMode: 'fixed', maxChars: 900 })
  assert.equal(segments.length, 2)
  assert.equal(chars, 1001)
  for (const segment of segments) assert.equal(Array.from(segment.text).length <= 900, true)
  assert.equal(segments.map((s) => s.text).join(''), text)
})

check('hard split never breaks a surrogate pair', () => {
  const text = '😀'.repeat(600)
  const { segments } = plan(text, { emotionMode: 'fixed', maxChars: 400 })
  for (const segment of segments) {
    const round = Array.from(segment.text).join('')
    assert.equal(round, segment.text)
    assert.equal(segment.text.includes('\uFFFD'), false)
  }
})

check('english sentences keep a space when merged', () => {
  const { segments } = plan('Hello world. This is English.', { emotionMode: 'fixed' })
  assert.equal(segments.length, 1)
  assert.equal(segments[0].text, 'Hello world. This is English.')
})

check('infer mode assigns tone by punctuation', () => {
  const { segments } = plan('你好吗？我很想你！后来嘛……就没有后来了。', { emotionMode: 'infer' })
  assert.deepEqual(segments.map((s) => s.emotion), ['curious', 'excited', 'sad'])
})

check('fixed mode keeps one tone and drops markers', () => {
  const { segments } = plan('[😄](breeze-mood:happy) 今天真开心！', { emotionMode: 'fixed' })
  assert.equal(segments.length, 1)
  assert.equal(segments[0].emotion, '')
  assert.equal(segments[0].text, '今天真开心！')
})

check('whitespace and markdown are normalised', () => {
  const out = cleanSpeech('**重点** 看这里   [链接](https://x.y) https://a.b/c')
  assert.equal(out.includes('*'), false)
  assert.equal(out.includes('http'), false)
  assert.equal(/ {2,}/.test(out), false)
})

check('chars equals the spoken text length', () => {
  const { segments, chars } = plan('你好。Hello there.', { emotionMode: 'fixed' })
  const sum = segments.reduce((n, s) => n + Array.from(s.text).length, 0)
  assert.equal(chars, sum)
})

check('buildPlan and the exported alias agree', () => {
  assert.equal(buildPlan, plan)
})

console.log('\n' + passed + ' checks passed')
