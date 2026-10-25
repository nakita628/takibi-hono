import { existsSync, readdirSync } from 'node:fs'
import path from 'node:path'

/**
 * Every case under `cases/`, as `{ name, dir }`, sorted by name. A case is a directory
 * holding a `takibi-hono.config.ts`; its `expected/` is the golden copy of what the CLI
 * writes to `__generated__/<name>`, and a `tsconfig.json` opts it into the type check of
 * `__app__/<name>`, the runnable copy of that output.
 */
export function listCases(testRoot) {
  return readdirSync(path.join(testRoot, 'cases'), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => ({ name: entry.name, dir: path.join(testRoot, 'cases', entry.name) }))
    .filter(({ dir }) => existsSync(path.join(dir, 'takibi-hono.config.ts')))
    .toSorted((a, b) => a.name.localeCompare(b.name))
}

/** The cases that carry a `tsconfig.json`, so `tsc -p` can compile their `__app__` copy. */
export function listTypecheckedCases(testRoot) {
  return listCases(testRoot).filter(({ dir }) => existsSync(path.join(dir, 'tsconfig.json')))
}
