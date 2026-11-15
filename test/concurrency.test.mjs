import assert from 'node:assert/strict'
import { __test } from '../index.js'

const { withSynthSlot, inflight } = __test

let passed = 0
function check(name, fn) {
  return Promise.resolve()
    .then(fn)
    .then(() => {
      passed += 1
      console.log('ok   ' + name)
    })
    .catch((error) => {
      console.log('FAIL ' + name)
      console.log('     ' + (error && error.message ? error.message : String(error)))
      process.exitCode = 1
    })
}

async function run() {
  await check('synthesis runs one call at a time', async () => {
    let active = 0
    let peak = 0
    const task = () => withSynthSlot(async () => {
      active += 1
      peak = Math.max(peak, active)
      await new Promise((resolve) => setTimeout(resolve, 25))
      active -= 1
      return true
    })
    await Promise.all(Array.from({ length: 8 }, task))
    assert.equal(peak, 1, 'quota checks and spending must be serialised')
    assert.equal(active, 0)
  })

  await check('a slot is released when the task throws', async () => {
    await assert.rejects(withSynthSlot(async () => {
      throw new Error('boom')
    }), /boom/)
    const ok = await withSynthSlot(async () => 'recovered')
    assert.equal(ok, 'recovered')
  })

  await check('identical in-flight keys share one job', async () => {
    inflight.clear()
    let runs = 0
    const key = 'same-text'
    const factory = () => {
      const existing = inflight.get(key)
      if (existing) return existing
      const job = withSynthSlot(async () => {
        runs += 1
        await new Promise((resolve) => setTimeout(resolve, 20))
        return 'audio'
      })
      inflight.set(key, job)
      job.finally(() => inflight.delete(key))
      return job
    }
    const [a, b] = await Promise.all([factory(), factory()])
    assert.equal(a, 'audio')
    assert.equal(b, 'audio')
    assert.equal(runs, 1)
  })

  await check('different keys run separately', async () => {
    inflight.clear()
    let runs = 0
    const factory = (key) => {
      const job = withSynthSlot(async () => {
        runs += 1
        return key
      })
      inflight.set(key, job)
      job.finally(() => inflight.delete(key))
      return job
    }
    const out = await Promise.all([factory('a'), factory('b')])
    assert.deepEqual(out, ['a', 'b'])
    assert.equal(runs, 2)
  })

  console.log('\n' + passed + ' checks passed')
}

run()
