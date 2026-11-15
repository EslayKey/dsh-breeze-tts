/**
 * Hook-level integration test for AutoSpeakChip: real client.js component,
 * minimal React hook runtime, fake timers and a scripted fetch.
 *
 * Covers the reported closes:
 *  - a /status already in flight is abandoned when the same session starts a
 *    new stream, so the old message is never spoken
 *  - switching session abandons it too
 *  - a successful play is recorded once
 *  - a failed play is not recorded as played
 */
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const timers = new Map()
let handleSeq = 1
let clock = 0

const listeners = { window: {}, document: {} }
globalThis.document = {
  visibilityState: 'visible',
  addEventListener: (type, fn) => { (listeners.document[type] = listeners.document[type] || []).push(fn) },
  removeEventListener: () => {},
}
globalThis.window = {
  __ModuleLoader__: { load(module) { globalThis.__captured = module } },
  localStorage: {
    store: new Map(),
    getItem(key) { return this.store.has(key) ? this.store.get(key) : null },
    setItem(key, value) { this.store.set(key, String(value)) },
  },
  setTimeout(fn, delay) {
    const id = handleSeq++
    timers.set(id, { fn, at: clock + delay })
    return id
  },
  clearTimeout(id) { timers.delete(id) },
  addEventListener: (type, fn) => { (listeners.window[type] = listeners.window[type] || []).push(fn) },
  removeEventListener: () => {},
}
function advance(ms) {
  clock += ms
  for (const [id, timer] of Array.from(timers.entries())) {
    if (timer.at <= clock) {
      timers.delete(id)
      timer.fn()
    }
  }
}

const source = await readFile(new URL('../client.js', import.meta.url), 'utf8')
// eslint-disable-next-line no-new-func
new Function(source)()

// --- minimal hook runtime -------------------------------------------------
let current = null
let pendingEffects = []
function render(component, props) {
  current = { index: 0, cells: current && current.component === component ? current.cells : [] }
  current.component = component
  const tree = component(props)
  const effects = pendingEffects
  pendingEffects = []
  for (const run of effects) run()
  return tree
}
const reactShim = {
  createElement: () => null,
  useState(init) {
    const i = current.index++
    if (!(i in current.cells)) current.cells[i] = { value: typeof init === 'function' ? init() : init }
    const cell = current.cells[i]
    return [cell.value, (next) => {
      cell.value = typeof next === 'function' ? next(cell.value) : next
      scheduleRender()
    }]
  },
  useRef(init) {
    const i = current.index++
    if (!(i in current.cells)) current.cells[i] = { current: init }
    return current.cells[i]
  },
  useEffect(fn, deps) {
    const i = current.index++
    const prev = current.cells[i]
    const same = prev && deps && prev.deps && deps.length === prev.deps.length
      && deps.every((value, index) => Object.is(value, prev.deps[index]))
    current.cells[i] = { deps }
    if (!same) pendingEffects.push(() => { if (prev && prev.cleanup) prev.cleanup(); const out = fn(); current.cells[i].cleanup = typeof out === 'function' ? out : undefined })
  },
  useMemo(fn, deps) {
    const i = current.index++
    const prev = current.cells[i]
    const same = prev && deps && prev.deps && deps.length === prev.deps.length
      && deps.every((value, index) => Object.is(value, prev.deps[index]))
    if (same) return prev.value
    const value = fn()
    current.cells[i] = { deps, value }
    return value
  },
  useCallback(fn, deps) {
    const i = current.index++
    const prev = current.cells[i]
    const same = prev && deps && prev.deps && deps.length === prev.deps.length
      && deps.every((value, index) => Object.is(value, prev.deps[index]))
    if (same) return prev.value
    current.cells[i] = { deps, value: fn }
    return fn
  },
}

const plugin = globalThis.__captured.factory((name) => {
  if (name === 'react') return reactShim
  throw new Error('unexpected require: ' + name)
})
const { AutoSpeakChip } = plugin.__test
assert.equal(typeof AutoSpeakChip, 'function')

// --- scripted fetch -------------------------------------------------------
const calls = []
let statusGate = null
let synthFails = false
globalThis.fetch = async (url, init = {}) => {
  const target = String(url)
  calls.push({ url: target, method: (init.method || 'GET').toUpperCase(), body: init.body })
  const json = (value) => ({
    ok: true,
    status: 200,
    headers: { get: () => 'application/json' },
    async json() { return value },
    async text() { return '' },
  })
  if (target.endsWith('/status')) {
    if (statusGate) {
      return new Promise((resolve, reject) => {
        statusGate.resolve = () => resolve(json({ autoSpeak: true, autoSpeakMaxChars: 999, backgroundPlay: true }))
        statusGate.reject = () => reject(new Error('status failed'))
      })
    }
    return json({ autoSpeak: true, autoSpeakMaxChars: 999, backgroundPlay: true })
  }
  if (target.endsWith('/synth')) {
    if (synthFails) throw new Error('synth failed')
    return json({ url: '/breeze-tts/audio/x.wav', chars: 5 })
  }
  if (target.endsWith('/play-file')) {
    if (synthFails) throw new Error('play failed')
    return json({ ok: true })
  }
  if (target.endsWith('/log')) return json({ ok: true })
  return json({})
}

// --- chat store -----------------------------------------------------------
const store = { view: makeView({ partial: null, turnEnded: true, id: 'm1' }) }
function makeView(options) {
  return {
    timeline: { turns: new Map([[7, { end: { data: { reason: { kind: 'completed' } } } }]]) },
    legacy: {
      nodes: [{
        kind: 'assistant',
        messageId: options.id,
        turn: 7,
        message: { content: [{ type: 'text', text: 'hello world' }] },
      }],
      turnEnds: new Map(options.turnEnded === false ? [] : [[7, 42]]),
      partial: options.partial,
      runningCalls: [],
    },
  }
}
let renderQueued = false
function scheduleRender() {
  if (renderQueued) return
  renderQueued = true
  Promise.resolve().then(() => {
    renderQueued = false
    draw()
  })
}
function draw() {
  render(AutoSpeakChip, {
    t: (key) => key,
    sessionId: store.sessionId || 's1',
    useChat: (selector) => selector(store.view),
  })
}

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
const flush = async (ms = 0) => {
  await new Promise((resolve) => setImmediate(resolve))
  advance(ms)
  await new Promise((resolve) => setImmediate(resolve))
}

// first render primes the history (existing message becomes "spoken")
draw()
await flush(0)

await check('a new stream abandons the in-flight /status of the same session', async () => {
  window.localStorage.store.clear()
  calls.length = 0
  // fresh component state for this case
  current = null
  store.sessionId = 's1'
  store.view = makeView({ partial: null, turnEnded: true, id: 'm2' })
  draw()                                   // priming marks m2 as spoken
  await flush(0)
  store.view = makeView({ partial: null, turnEnded: true, id: 'm3' })
  draw()
  await flush(0)                            // schedule the 400ms timer
  statusGate = {}
  await flush(400)                          // timer fires, /status hangs
  assert.ok(statusGate.resolve, 'the /status call should be in flight')
  store.view = makeView({ partial: { blocks: [] }, turnEnded: false, id: 'm4' })
  draw()
  await flush(0)                            // new stream -> wait path
  statusGate.resolve()
  await flush(10)
  assert.equal(calls.filter((c) => c.url.endsWith('/synth')).length, 0, 'stale /status must not speak')
  statusGate = null
})

await check('switching session abandons the in-flight /status', async () => {
  calls.length = 0
  current = null
  window.localStorage.store.clear()
  store.sessionId = 's1'
  store.view = makeView({ partial: null, turnEnded: true, id: 'm5' })
  draw()
  await flush(0)
  store.view = makeView({ partial: null, turnEnded: true, id: 'm6' })
  draw()
  await flush(0)
  statusGate = {}
  await flush(400)
  assert.ok(statusGate.resolve)
  store.sessionId = 's2'
  draw()
  await flush(0)
  statusGate.resolve()
  await flush(10)
  assert.equal(calls.filter((c) => c.url.endsWith('/synth')).length, 0)
  statusGate = null
})

await check('a successful play speaks once and is recorded', async () => {
  calls.length = 0
  current = null
  window.localStorage.store.clear()
  store.sessionId = 's1'
  store.view = makeView({ partial: null, turnEnded: true, id: 'm7' })
  draw()
  await flush(0)
  store.view = makeView({ partial: null, turnEnded: true, id: 'm8' })
  draw()
  await flush(400)
  await flush(20)
  const synth = calls.filter((c) => c.url.endsWith('/synth'))
  assert.equal(synth.length, 1, 'exactly one synthesis')
  const stored = JSON.parse(window.localStorage.store.get('breeze-tts:spoken:s1') || '{}')
  assert.ok(Array.isArray(stored.ids) && stored.ids.includes('m8'))
  draw()
  await flush(400)
  assert.equal(calls.filter((c) => c.url.endsWith('/synth')).length, 1, 'must not speak twice')
})

await check('a failed play is not recorded as played', async () => {
  calls.length = 0
  current = null
  window.localStorage.store.clear()
  store.sessionId = 's1'
  synthFails = true
  store.view = makeView({ partial: null, turnEnded: true, id: 'm9' })
  draw()
  await flush(0)
  store.view = makeView({ partial: null, turnEnded: true, id: 'm10' })
  draw()
  await flush(400)
  await flush(20)
  const stored = JSON.parse(window.localStorage.store.get('breeze-tts:spoken:s1') || '{}')
  const ids = stored.ids || []
  assert.equal(ids.includes('m10'), false, 'a failure must not be marked as played')
  synthFails = false
})

console.log('\n' + passed + ' checks passed')
