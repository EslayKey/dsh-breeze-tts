import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { setImmediate } from 'node:timers/promises'
import test from 'node:test'

test('chat quota refreshes after synthesis and detects tool usage while mounted', async () => {
  let scheduled
  let state
  let cleanup
  let mounted = false
  const react = {
    createElement: (type, props, ...children) => ({ type, children }),
    useState: () => [state, (next) => { state = next }],
    useEffect: (effect) => {
      if (mounted) return
      mounted = true
      cleanup = effect()
    },
  }
  let client
  globalThis.window = Object.assign(new EventTarget(), {
    __ModuleLoader__: { load: (module) => { client = module.factory(() => react) } },
    setTimeout(callback, delay) {
      assert.equal(delay, 5000)
      scheduled = callback
      return callback
    },
    clearTimeout(id) {
      if (scheduled === id) scheduled = undefined
    },
  })
  globalThis.document = Object.assign(new EventTarget(), { visibilityState: 'visible' })
  const source = await readFile(new URL('../client.js', import.meta.url), 'utf8')
  new Function(source)()
  const { QuotaChip, speakRemotely } = client.__test

  let chars = 100
  let reads = 0
  let synthFails = false
  let usageFails = false
  const json = (value, status = 200) => new Response(JSON.stringify(value), {
    status,
    headers: { 'content-type': 'application/json' },
  })

  globalThis.fetch = async (route, options) => {
    if (route === '/breeze-tts/usage') {
      assert.equal(options.cache, 'no-store')
      reads++
      if (usageFails) throw new Error('host unavailable')
      return json({ hasKey: true, chars, limit: 1500, autoSpeak: false })
    }
    if (route === '/breeze-tts/synth') {
      chars += 50
      if (synthFails) return json({ error: 'second segment failed' }, 500)
      return json({ url: '/breeze-tts/audio/test.wav' })
    }
    if (route === '/breeze-tts/play-file') return json({ ok: true })
    assert.fail(`unexpected request to ${route}`)
  }

  const render = () => QuotaChip({ t: () => 'chars' })
  const label = () => render().children[1].children[0]
  render()
  try {
    await setImmediate()
    assert.equal(label(), '100 / 1500 chars')

    await speakRemotely({ text: 'new reply' }, { host: true })
    await setImmediate()
    assert.equal(label(), '150 / 1500 chars')

    synthFails = true
    await assert.rejects(() => speakRemotely({ text: 'partial reply' }, { host: true }), /second segment/)
    await setImmediate()
    assert.equal(label(), '200 / 1500 chars')

    chars = 230
    usageFails = true
    await scheduled()
    assert.equal(label(), '200 / 1500 chars')
    usageFails = false
    await scheduled()
    assert.equal(label(), '230 / 1500 chars')

    document.visibilityState = 'hidden'
    document.dispatchEvent(new Event('visibilitychange'))
    assert.equal(scheduled, undefined)
    chars = 0
    document.visibilityState = 'visible'
    document.dispatchEvent(new Event('visibilitychange'))
    await setImmediate()
    assert.equal(label(), '0 / 1500 chars')
  } finally {
    cleanup()
  }
  assert.equal(scheduled, undefined)
  const readsAtUnmount = reads
  window.dispatchEvent(new Event('focus'))
  await setImmediate()
  assert.equal(reads, readsAtUnmount)
})
