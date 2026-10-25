import { existsSync, rmSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { listCases } from './cases.mjs'
import { copyTree } from './copy.mjs'

/**
 * Accepts the current output as the golden copy: replaces every `cases/<name>/expected`
 * with `__generated__/<name>` as `generate.mjs` last wrote it.
 *
 * Run it only after reading the diff `runtime/golden.test.ts` reported and deciding the new
 * output is right; what it writes is what the next run will hold the generator to.
 */
const testRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
for (const { name, dir } of listCases(testRoot)) {
  const generated = path.join(testRoot, '__generated__', name)
  if (!existsSync(generated)) {
    // oxlint-disable-next-line no-console -- CLI script reports the missing generation to the operator
    console.error(`missing ${generated} — run scripts/generate.mjs first`)
    process.exit(1)
  }
  const expected = path.join(dir, 'expected')
  rmSync(expected, { recursive: true, force: true })
  copyTree(generated, expected)
}
// oxlint-disable-next-line no-console -- CLI script reports progress
console.log(`updated expected output of ${listCases(testRoot).length} cases`)
