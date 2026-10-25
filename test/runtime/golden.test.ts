// Every case's output, byte for byte.
//
// `scripts/generate.mjs` (the suite's global setup) runs the packaged CLI on each case in
// cases/<name> and writes exactly what it produced to __generated__/<name>. This file holds
// that tree to the golden copy committed as cases/<name>/expected: the same set of files,
// and the same contents, formatting included. A change in generated output — a different
// import order, a renamed identifier, a schema expression that moved — fails here, in the
// file that changed, with a diff of the generated source.
//
// To accept a change on purpose, read the diff, decide the new output is right, and run
// `pnpm -F @takibi-hono/test update-expected`, which regenerates and copies __generated__
// over expected/. The commit then shows the generator's change as a change in its output.
import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vite-plus/test'

import { listCases } from '../scripts/cases.mjs'

const testRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

/** Every file under `dir`, as POSIX paths relative to it, sorted. */
function listFiles(dir: string): readonly string[] {
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) =>
      path.relative(dir, path.join(entry.parentPath, entry.name)).replaceAll('\\', '/'),
    )
    .toSorted()
}

const cases: readonly { readonly name: string; readonly dir: string }[] = listCases(testRoot)

describe.each(cases)('$name', ({ name, dir }) => {
  const expected = path.join(dir, 'expected')
  const generated = path.join(testRoot, '__generated__', name)
  const files = listFiles(expected)

  it('writes the expected set of files', () => {
    expect(listFiles(generated)).toStrictEqual(files)
  })

  it.each(files)('%s', (file) => {
    expect(readFileSync(path.join(generated, file), 'utf8')).toBe(
      readFileSync(path.join(expected, file), 'utf8'),
    )
  })
})
