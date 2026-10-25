import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { listTypecheckedCases } from './cases.mjs'

const testRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
// tsc is resolved as a file and run with node instead of the .bin shim: shims can be missing
// when a stale node_modules cache is restored in CI. TypeScript 7 drops `./lib/tsc.js` from
// its `exports` map, so the manifest (which stays exported) is resolved and the path joined.
const tsc = path.join(
  path.dirname(
    createRequire(path.join(testRoot, 'package.json')).resolve('typescript/package.json'),
  ),
  'lib',
  'tsc.js',
)
const cases = listTypecheckedCases(testRoot)

const typecheckCase = ({ name, dir }) =>
  new Promise((resolve) => {
    const child = spawn(process.execPath, [tsc, '-p', dir])
    const chunks = []
    child.stdout.on('data', (chunk) => chunks.push(chunk))
    child.stderr.on('data', (chunk) => chunks.push(chunk))
    child.on('error', (error) => {
      resolve({ name, ok: false, output: error.message })
    })
    child.on('close', (status) => {
      // oxlint-disable-next-line no-console -- CLI script reports per-case progress
      console.log(`typecheck: ${name} ${status === 0 ? 'ok' : 'FAILED'}`)
      resolve({ name, ok: status === 0, output: Buffer.concat(chunks).toString() })
    })
  })

// Bounded parallelism: tsc processes are heap-isolated but memory- and I/O-hungry, and a
// 2-core CI runner stays sequential to bound peak memory.
const queue = [...cases]
const results = []
const concurrency = Math.max(1, Math.min(2, Math.floor(os.availableParallelism() / 2)))
await Promise.all(
  Array.from({ length: concurrency }, async () => {
    while (queue.length > 0) {
      const entry = queue.shift()
      if (entry) {
        // oxlint-disable-next-line no-await-in-loop -- each worker drains the queue sequentially to bound concurrency
        results.push(await typecheckCase(entry))
      }
    }
  }),
)

const failed = results.filter((result) => !result.ok)
for (const result of failed) {
  // oxlint-disable-next-line no-console -- CLI script surfaces per-case tsc output
  console.error(`--- ${result.name} ---\n${result.output}`)
}
if (failed.length > 0) {
  // oxlint-disable-next-line no-console -- CLI script reports the failure summary
  console.error(`typecheck failed: ${failed.map((result) => result.name).join(', ')}`)
  process.exit(1)
}
// oxlint-disable-next-line no-console -- CLI script reports progress
console.log(`typecheck passed for ${cases.length} cases`)
