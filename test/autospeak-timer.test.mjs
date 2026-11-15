/**
 * Offline checks for the auto-speak timer gate: a stale timer or a late
 * /status response from another session must never speak.
 */
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const timers = new Map()
let nextHandle = 1
let clock = 0
globalThis.window = {
  __ModuleLoader__: { load() {} },
  setTimeout(fn, delay) {
    const handle = nextHandle++
    timers.set(handle, { fn, at: clock + delay })
    return handle
  },
  clearTimeout(handle) {
    timers.delete(handle)
  },
}
function advance(ms) {
  clock += ms
  for (const [handle, timer] of Array.from(timers.entries())) {
    if (timer.at <= clock) {
      timers.delete(handle)
      timer.fn()
    }
  }
}

let captured = null
globalThis.window.__ModuleLoader__.load = (module) => {
  captured = module
}
const source = await readFile(new URL('../client.js', import.meta.url), 'utf8')
// eslint-disable-next-line no-new-func
new Function(source)()

const reactShim = {
  createElement: () => null,
  useState: (value) => [value, () => {}],
  useEffect: () => {},
  useRef: (value) => ({ current: value }),
  useMemo: (fn) => fn(),
  useCallback: (fn) => fn,
}
const plugin = captured.factory((name) => {
  if (name === 'react') return reactShim
  throw new Error('unexpected require: ' + name)
})
const createTurnTimer = plugin.__test.createTurnTimer
assert.equal(typeof createTurnTimer, 'function', 'createTurnTimer is not exported')

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

check('a scheduled timer fires for the same generation', () => {
  const gate = createTurnTimer()
  const token = gate.generation()
  let fired = 0
  gate.schedule(token, 400, () => { fired += 1 })
  advance(400)
  assert.equal(fired, 1)
})

check('switching session cancels the pending timer', () => {
  const gate = createTurnTimer()
  const token = gate.generation()
  let fired = 0
  gate.schedule(token, 400, () => { fired += 1 })
  gate.invalidate()
  advance(400)
  assert.equal(fired, 0)
  assert.equal(gate.generation(), token + 1)
})

check('a late callback after invalidation is refused', () => {
  const gate = createTurnTimer()
  const token = gate.generation()
  gate.invalidate()
  let fired = 0
  gate.schedule(token, 400, () => { fired += 1 })
  advance(400)
  assert.equal(fired, 0, 'stale token must not fire')
})

check('only the newest schedule survives', () => {
  const gate = createTurnTimer()
  const token = gate.generation()
  let first = 0
  let second = 0
  gate.schedule(token, 400, () => { first += 1 })
  gate.schedule(token, 400, () => { second += 1 })
  advance(400)
  assert.equal(first, 0)
  assert.equal(second, 1)
})

check('clear() drops the pending timer without changing the token', () => {
  const gate = createTurnTimer()
  const token = gate.generation()
  let fired = 0
  gate.schedule(token, 400, () => { fired += 1 })
  gate.clear()
  advance(400)
  assert.equal(fired, 0)
  assert.equal(gate.generation(), token)
})

check('a generation read before an await detects the switch', () => {
  const gate = createTurnTimer()
  const token = gate.generation()
  gate.invalidate()
  assert.notEqual(gate.generation(), token, 'late /status response must be discarded')
})

console.log('\n' + passed + ' checks passed')
