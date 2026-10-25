import path from 'node:path'

import { Effect } from 'effect'

import { exists } from '../file/index.js'
import type { Layout } from './layout.js'
import { targetDirectory } from './layout.js'

/** `dir` and every directory above it, nearest first. */
function ancestors(dir: string): readonly string[] {
  const parent = path.dirname(dir)
  return parent === dir ? [dir] : [dir, ...ancestors(parent)]
}

/** The nearest directory at or above `dir` that holds a `package.json`, or `undefined`. */
function packageRootOf(dir: string) {
  return Effect.gen(function* () {
    const directories = ancestors(path.resolve(dir))
    // A directory that is not there yet holds no package.json; the ones above it may.
    const found = yield* Effect.forEach(directories, (candidate) =>
      exists(path.join(candidate, 'package.json')),
    )
    return directories.find((_, index) => found[index])
  })
}

/**
 * The package each generated file is written into, for `makeSpecifier`: the directory of
 * the nearest `package.json` above the directory the file is written under. Only the
 * directories the layout writes into are looked at, once each.
 */
export function makePackageRoot(layout: Layout) {
  return Effect.gen(function* () {
    const directories = [
      ...new Set(
        [
          layout.handlersDir,
          layout.appDir,
          ...Object.values(layout.targets).map(targetDirectory),
          ...layout.clientDirs,
        ].map((dir) => path.resolve(dir)),
      ),
    ]
    const roots = yield* Effect.forEach(directories, packageRootOf)
    const known = new Map(directories.map((dir, index) => [dir, roots[index]]))
    return (file: string): string | undefined => {
      const dir = path.dirname(path.resolve(file))
      // The longest known directory the file sits under: a split directory inside `src`
      // may be a package of its own.
      const match = [...known.keys()]
        .filter((candidate) => dir === candidate || dir.startsWith(`${candidate}${path.sep}`))
        .toSorted((a, b) => b.length - a.length)[0]
      return match === undefined ? undefined : known.get(match)
    }
  })
}
