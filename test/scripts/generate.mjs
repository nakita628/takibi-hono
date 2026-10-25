import { spawn } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { listCases } from './cases.mjs'
import { copyTree } from './copy.mjs'

const testRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
// The CLI entry is invoked directly (node + file path) instead of the .bin shim: shims can be
// missing when a stale node_modules cache is restored in CI.
const cli = path.resolve(testRoot, '..', 'packages', 'takibi-hono', 'dist', 'index.js')
if (!existsSync(cli)) {
  // oxlint-disable-next-line no-console -- CLI script reports the missing build to the operator
  console.error(`missing ${cli} — build the CLI first: vp run takibi-hono#build`)
  process.exit(1)
}
const cases = listCases(testRoot)

/**
 * Every generated handler body is the stub `(c) => {}`, which Hono's handler type rejects
 * until it is implemented. The runnable copy fills each stub with a handler that answers
 * the data every validator in front of it let through, by target, so a runtime test can
 * read what reached the handler — not the raw request.
 */
const FILLED_STUB =
  "(c) => c.json(Object.fromEntries((['param', 'query', 'header', 'cookie', 'json', 'form'] as const).map((target) => [target, c.req.valid(target as never)])))"

const fillStubs = (dir, stub) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      fillStubs(file, stub)
    } else if (entry.name.endsWith('.ts')) {
      const source = readFileSync(file, 'utf8')
      // oxfmt may break a long stub across lines: `(\n  c,\n) => {}`. A defineHandler stub
      // takes the validated targets apart: `async (c, { param, json }) => {}`.
      const filled = source.replaceAll(/\(\s*c(?:\s*,\s*\{[^}]*\})?\s*,?\s*\) => \{\}/gu, stub)
      if (filled !== source) writeFileSync(file, filled)
    }
  }
}

const generateCase = ({ name, dir }) =>
  new Promise((resolve) => {
    const generated = path.join(testRoot, '__generated__', name)
    const app = path.join(testRoot, '__app__', name)
    // Every case is generated afresh: what a previous run left would be merged into, so the
    // output would depend on whether the suite had run before.
    rmSync(generated, { recursive: true, force: true })
    rmSync(app, { recursive: true, force: true })
    // A seed/ dir holds what must be there before the generator runs — hand-edited handler
    // files whose bodies the merge has to carry across.
    const seed = path.join(dir, 'seed')
    if (existsSync(seed)) copyTree(seed, generated)
    // The CLI runs from the workspace root: the config's `input` and every output path are
    // relative to it, and a client output has to stay inside the directory the CLI runs in.
    const child = spawn(
      process.execPath,
      [cli, '--config', path.relative(testRoot, path.join(dir, 'takibi-hono.config.ts'))],
      { cwd: testRoot },
    )
    const chunks = []
    child.stdout.on('data', (chunk) => chunks.push(chunk))
    child.stderr.on('data', (chunk) => chunks.push(chunk))
    child.on('error', (error) => {
      resolve({ name, ok: false, output: error.message })
    })
    child.on('close', (status) => {
      const ok = status === 0
      if (ok && existsSync(generated)) {
        // `__generated__/<name>` stays exactly what the CLI wrote, for the golden comparison;
        // `__app__/<name>` is the same output made runnable: stubs filled, and an overlay/ dir
        // (what the generated code imports but the generator does not write) copied over it.
        copyTree(generated, app)
        // A stub.txt in the case replaces the default handler body: the conformance cases
        // answer hono-takibi's description of the validated values, from an overlay module.
        const stub = path.join(dir, 'stub.txt')
        fillStubs(app, existsSync(stub) ? readFileSync(stub, 'utf8').trim() : FILLED_STUB)
        const overlay = path.join(dir, 'overlay')
        if (existsSync(overlay)) copyTree(overlay, app)
      }
      resolve({ name, ok, output: Buffer.concat(chunks).toString() })
    })
  })

// Each CLI run is independent (own output files), so run them concurrently.
const queue = [...cases]
const results = []
const concurrency = Math.max(1, Math.min(8, os.availableParallelism() - 1))
await Promise.all(
  Array.from({ length: concurrency }, async () => {
    while (queue.length > 0) {
      const entry = queue.shift()
      if (entry) {
        // oxlint-disable-next-line no-await-in-loop -- each worker drains the queue sequentially to bound concurrency
        results.push(await generateCase(entry))
      }
    }
  }),
)

const failed = results.filter((result) => !result.ok)
for (const result of failed) {
  // oxlint-disable-next-line no-console -- CLI script surfaces per-case generator output
  console.error(`--- ${result.name} ---\n${result.output}`)
}
if (failed.length > 0) {
  // oxlint-disable-next-line no-console -- CLI script reports the failure summary
  console.error(`generate failed: ${failed.map((result) => result.name).join(', ')}`)
  process.exit(1)
}
// oxlint-disable-next-line no-console -- CLI script reports progress
console.log(`generated ${cases.length} cases: ${cases.map(({ name }) => name).join(', ')}`)
