import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { setImmediate } from 'node:timers/promises'
import test from 'node:test'

test('settings refresh and immediate tone changes preserve the unsaved form', async () => {
  const effects = []
  const cells = []
  let cursor = 0
  const changed = (before, deps) => !before || deps.some((value, i) => !Object.is(value, before[i]))
  const react = {
    createElement: (type, props, ...children) => ({ type, props, children }),
    useState(initial) {
      const index = cursor++
      if (!(index in cells)) cells[index] = initial
      return [cells[index], (next) => { cells[index] = typeof next === 'function' ? next(cells[index]) : next }]
    },
    useCallback(callback, deps) {
      const index = cursor++
      if (changed(cells[index]?.deps, deps)) cells[index] = { callback, deps }
      return cells[index].callback
    },
    useEffect(callback, deps) {
      const index = cursor++
      if (!changed(cells[index]?.deps, deps)) return
      const cleanup = cells[index]?.cleanup
      cells[index] = { deps }
      effects.push(() => {
        cleanup?.()
        cells[index].cleanup = callback()
      })
    },
  }

  let component
  const window = { __ModuleLoader__: { load: (module) => { component = module.factory(() => react).__test.SettingsPage } } }
  const initial = {
    ok: true, hasKey: true, voiceId: 'voice-one', moodId: 'normal', emotionMode: 'marker',
    voicePresets: [{ voiceId: 'voice-one', name: 'Voice one' }],
    previewText: 'Hello', today: { chars: 25, limit: 1500 }, balance: 100, autoSpeakMaxChars: 0,
  }
  let status = initial
  const writes = []
  let failSave = false
  let pendingSave = null
  const fetch = async (url, options = {}) => {
    if (url.endsWith('/status')) return Response.json(status)
    if (url.endsWith('/voices')) return Response.json({ voices: [] })
    if (url.endsWith('/settings')) {
      const saved = JSON.parse(options.body)
      writes.push(saved)
      if (failSave) return Response.json({ error: 'save failed' }, { status: 500 })
      if (pendingSave) await pendingSave
      return Response.json({ ok: true, saved })
    }
    assert.fail('Unexpected request: ' + url)
  }
  const source = await readFile(new URL('../client.js', import.meta.url), 'utf8')
  new Function('window', 'fetch', source)(window, fetch)

  function* nodes(value) {
    if (Array.isArray(value)) {
      for (const child of value) yield* nodes(child)
    } else if (value && typeof value === 'object') {
      yield value
      yield* nodes(value.children)
    }
  }
  function render() {
    cursor = 0
    const view = component({ t: (key) => key })
    for (const effect of effects.splice(0)) effect()
    return view
  }
  function control(type, label) {
    const match = [...nodes(render())].find((node) =>
      node.type === type && (node.props?.['aria-label'] === label || node.children.includes(label)))
    assert.ok(match, label)
    return match.props
  }
  function textVisible(text) {
    return [...nodes(render())].some((node) => node.children.includes(text))
  }
  const save = () => control('button', 'label.save')
  const limit = () => control('input', 'label.dailyLimit')
  const mode = () => control('select', 'extra.emotionMode')

  render()
  await setImmediate()
  assert.equal(save().disabled, true)
  assert.equal([...nodes(render())].some((node) => node.type === 'input' && node.props.type === 'password'), false)
  control('button', 'extra.manageKey').onClick()
  assert.equal(control('input', 'extra.apiKey').type, 'password')
  control('button', 'extra.closeKey').onClick()

  limit().onChange({ target: { value: '1800' } })
  control('button', 'extra.autoSpeak').onClick()
  assert.equal(textVisible('label.unsaved'), true)
  status = { ...initial, today: { chars: 40, limit: 1500 }, balance: 90, emotionMode: 'fixed' }
  await control('button', 'label.refresh').onClick()
  assert.equal(limit().value, '1800')
  assert.equal(mode().value, 'marker')
  assert.equal(control('button', 'extra.autoSpeak')['aria-checked'], 'true')
  assert.equal(textVisible('40 / 1500 status.chars'), true)
  assert.equal(textVisible('90.0'), true)
  assert.deepEqual(writes, [])

  await mode().onChange({ target: { value: 'infer' } })
  assert.equal(mode().value, 'infer')
  assert.equal(textVisible('label.unsaved'), true)
  assert.deepEqual(writes, [{ emotionMode: 'infer' }])

  failSave = true
  await save().onClick()
  assert.equal(limit().value, '1800')
  assert.equal(save().disabled, false)
  assert.equal(textVisible('err.server'), true)
  failSave = false

  const { promise, resolve } = Promise.withResolvers()
  pendingSave = promise
  const saving = save().onClick()
  limit().onChange({ target: { value: '1500' } })
  resolve()
  await saving
  pendingSave = null
  assert.equal(limit().value, '1500')
  assert.equal(textVisible('40 / 1800 status.chars'), true)
  assert.equal(textVisible('label.unsaved'), true)

  await save().onClick()
  assert.deepEqual(writes, [
    { emotionMode: 'infer' },
    { dailyChars: 1800, autoSpeak: true },
    { dailyChars: 1800, autoSpeak: true },
    { dailyChars: 1500 },
  ])
  assert.equal(save().disabled, true)
  assert.equal(textVisible('label.saved'), true)
})
