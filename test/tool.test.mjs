import assert from 'node:assert/strict'
import { __test } from '../index.js'

const { resolveSpeakOptions, resolveToneInstructions, DEFAULT_TONES } = __test

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

check('playing an mp3 is refused before any request', () => {
  const out = resolveSpeakOptions({ play: true, save_path: 'C:/tmp/out.mp3' })
  assert.equal(typeof out.error, 'string')
  assert.match(out.error, /mp3/)
  assert.equal(out.format, undefined)
})

check('play:false with an mp3 keeps the mp3 path', () => {
  const out = resolveSpeakOptions({ play: false, save_path: 'C:/tmp/out.mp3' })
  assert.equal(out.error, undefined)
  assert.equal(out.format, 'mp3_24000_96')
  assert.equal(out.plays, false)
})

check('play:true with a wav keeps the wav path', () => {
  const out = resolveSpeakOptions({ play: true, save_path: 'C:/tmp/out.wav' })
  assert.equal(out.error, undefined)
  assert.equal(out.format, 'wav_24000')
  assert.equal(out.plays, true)
})

check('play defaults to true with no file', () => {
  const out = resolveSpeakOptions({ text: 'hi' })
  assert.equal(out.error, undefined)
  assert.equal(out.format, 'wav_24000')
  assert.equal(out.play === undefined ? true : out.plays, true)
})

check('the public mood field maps to a tone id', () => {
  assert.equal(resolveSpeakOptions({ mood: 'warm' }).toneId, 'warm')
  assert.equal(resolveSpeakOptions({}).toneId, '')
})

check('mood warm resolves to the warm instructions', () => {
  const settings = { tones: DEFAULT_TONES, customMood: '' }
  const warm = resolveToneInstructions(settings, 'warm')
  const normal = resolveToneInstructions(settings, 'normal')
  assert.equal(warm, DEFAULT_TONES.find((tone) => tone.id === 'warm').instructions)
  assert.notEqual(warm, normal)
})

check('an unknown mood falls back to an empty instruction', () => {
  assert.equal(resolveToneInstructions({ tones: DEFAULT_TONES, customMood: '' }, 'nope'), '')
})

check('a custom tone wins over the preset', () => {
  assert.equal(resolveToneInstructions({ tones: DEFAULT_TONES, customMood: 'custom words' }, 'warm'), 'custom words')
})

console.log('\n' + passed + ' checks passed')
