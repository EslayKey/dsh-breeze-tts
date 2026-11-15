/**
 * Offline checks for the AutoSpeak decision, loaded from the shipped client
 * bundle with a stub module loader and a minimal React shim.
 */
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

let captured = null
globalThis.window = {
  __ModuleLoader__: {
    load(module) {
      captured = module
    },
  },
}

const source = await readFile(new URL('../client.js', import.meta.url), 'utf8')
// eslint-disable-next-line no-new-func
new Function(source)()

assert.ok(captured && captured.factory, 'client.js did not register a module')

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
const decide = plugin.__test && plugin.__test.decideAutoSpeak
assert.equal(typeof decide, 'function', 'decideAutoSpeak is not exported')

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

function view(options = {}) {
  const {
    reason = { kind: 'completed' },
    interrupted = false,
    partial = null,
    runningCalls = [],
    turnEnded = true,
    text = 'spoken body',
  } = options
  const node = {
    kind: 'assistant',
    messageId: 'm1',
    turn: 7,
    ...(interrupted ? { interrupted: true } : {}),
    message: { content: [{ type: 'text', text }] },
  }
  return {
    timeline: { turns: new Map([[7, { end: reason === null ? undefined : { data: { reason } } }]]) },
    legacy: {
      nodes: [node],
      turnEnds: new Map(turnEnded ? [[7, 42]] : []),
      partial,
      runningCalls,
    },
  }
}

check('a completed turn yields a candidate', () => {
  const out = decide(view())
  assert.equal(out.action, 'candidate')
  assert.equal(out.id, 'm1')
  assert.equal(out.text, 'spoken body')
})

check('an error ending never speaks', () => {
  const out = decide(view({ reason: { kind: 'error', error: { message: 'boom', code: 'X' } } }))
  assert.equal(out.action, 'skip')
  assert.equal(out.reason, 'turn-error')
})

check('aborted and interrupted endings never speak', () => {
  assert.equal(decide(view({ reason: { kind: 'aborted', reason: { kind: 'user' } } })).reason, 'turn-aborted')
  assert.equal(decide(view({ reason: { kind: 'interrupted' } })).reason, 'turn-interrupted')
})

check('a missing reason is treated as unknown, not success', () => {
  const out = decide(view({ reason: null }))
  assert.equal(out.action, 'skip')
  assert.equal(out.reason, 'turn-unknown')
})

check('an interrupted node is ignored even when the turn completed', () => {
  const out = decide(view({ interrupted: true }))
  assert.equal(out.action, 'none')
})

check('a still running tool blocks speech', () => {
  const out = decide(view({ runningCalls: [{ callId: 'c1' }] }))
  assert.equal(out.action, 'wait')
  assert.equal(out.reason, 'tool-running')
})

check('a live partial blocks speech', () => {
  const out = decide(view({ partial: { blocks: [] } }))
  assert.equal(out.action, 'wait')
  assert.equal(out.reason, 'streaming')
})

check('without the turn signal auto-speak is disabled', () => {
  const out = decide({ legacy: { nodes: [] } })
  assert.equal(out.action, 'skip')
  assert.equal(out.reason, 'no-turn-signal')
})

check('an unfinished turn is not a candidate', () => {
  const out = decide(view({ turnEnded: false }))
  assert.equal(out.action, 'none')
})

console.log('\n' + passed + ' checks passed')
