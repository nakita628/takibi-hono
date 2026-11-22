import path from 'node:path'

import { Effect } from 'effect'
import type { OpenAPI } from 'oas-truth'

import { readdir, readFile } from '../file/index.js'
import type { Route } from '../helper/operations.js'
import { collectRoutes, collectWebhookRoutes } from '../helper/operations.js'
import { handlerFileParses, mergeHandlerFile, mergeRouteBodies } from '../merge/index.js'
import type { Layout, TakibiHonoConfig } from './layout.js'

/** The groups of the handlers directory and the file each is written to. */
export type HandlerFiles = {
  /** The routes of each group (a first path segment), by its name. */
  readonly groups: ReadonlyMap<string, readonly Route[]>
  /** The file of each group, without `.ts` (see {@link matchHandlerFiles}). */
  readonly fileOf: ReadonlyMap<string, string>
  /** The handler files already in the directory, without `.ts`, sorted. */
  readonly existing: readonly string[]
  /** A definitions file written into the handlers directory, which is not a handler file. */
  readonly definitionsFile: string | undefined
}

/**
 * A handler file name with its case, `-` and `_` ignored: `real-time-events` as
 * `realtimeevents`. The root keeps its own name, so that it never takes `root.ts`.
 */
function looseName(name: string) {
  return name === '__root' ? name : name.replaceAll(/[-_]/gu, '').toLowerCase()
}

/**
 * The file of each group: the file named as the group when there is one, else an existing file
 * whose name matches once case, `-` and `_` are ignored (`realtimeevents.ts` for
 * `real-time-events`, or a file renamed by hand), else the group's own name. A project written
 * in one case keeps its files when `fileNameCase` is switched. No file is taken twice.
 */
function matchHandlerFiles(names: readonly string[], existing: readonly string[]) {
  const exact = new Set(names.filter((name) => existing.includes(name)))
  return names.reduce((files, name) => {
    if (exact.has(name)) return files.set(name, name)
    const taken = new Set([...exact, ...files.values()])
    const loose = looseName(name)
    const found = existing.find((file) => !taken.has(file) && looseName(file) === loose)
    return files.set(name, found ?? name)
  }, new Map<string, string>())
}

/** Reads the handlers directory and works out the file of every group. */
export function resolveHandlerFiles(openapi: OpenAPI, config: TakibiHonoConfig, layout: Layout) {
  return Effect.gen(function* () {
    const { handlersDir, definitions } = layout
    const groups = collectRoutes(openapi, config.fileNameCase)
    const webhooks = config.openapi === true && collectWebhookRoutes(openapi).length > 0
    const definitionsFile =
      definitions !== undefined &&
      !definitions.split &&
      path.dirname(definitions.output) === handlersDir
        ? path.basename(definitions.output)
        : undefined
    const entries = yield* readdir(handlersDir)
    const existing = entries
      .filter((entry) => entry.endsWith('.ts'))
      .filter(
        (entry) =>
          entry !== 'index.ts' &&
          entry !== definitionsFile &&
          !(webhooks && entry === 'webhooks.ts'),
      )
      .map((entry) => entry.slice(0, -'.ts'.length))
      .toSorted()
    const files: HandlerFiles = {
      groups,
      fileOf: matchHandlerFiles([...groups.keys()], existing),
      existing,
      definitionsFile,
    }
    return files
  })
}

/**
 * Carries into `code`, the generated file of `group`, what the other existing files whose name
 * matches the group's once case, `-` and `_` are ignored hold of it. Switching `fileNameCase`
 * can move routes between groups (`/user_profiles` and `/user-profiles` are one group in kebab
 * case, `/userProfiles` and `/userprofiles` two), and their handlers move with them:
 *
 * - a file that stays the file of another group gives the bodies of the routes now in this
 *   group, and nothing else;
 * - a file no group takes any more, and that is deleted, is merged in whole (its helpers and
 *   imports too) into the first group it matches, and gives only bodies to the others. One
 *   that does not parse is not merged and answered in `kept`, so that it is not deleted.
 */
export function carryMovedRoutes(
  handlersDir: string,
  files: HandlerFiles,
  group: string,
  code: string,
) {
  const own = files.fileOf.get(group) ?? group
  const claimed = new Set(files.fileOf.values())
  const loose = looseName(group)
  const first = [...files.groups.keys()].find((name) => looseName(name) === loose) === group
  const siblings = files.existing.filter((file) => file !== own && looseName(file) === loose)
  return Effect.map(
    Effect.forEach(siblings, (sibling) =>
      Effect.map(readFile(path.join(handlersDir, `${sibling}.ts`)), (text) => ({ sibling, text })),
    ),
    (read) => ({
      code: read.reduce((carried, { sibling, text }) => {
        if (text === null || !handlerFileParses(text)) return carried
        return claimed.has(sibling) || !first
          ? mergeRouteBodies(text, carried)
          : mergeHandlerFile(text, carried)
      }, code),
      kept: read
        .filter(
          ({ sibling, text }) => text !== null && !claimed.has(sibling) && !handlerFileParses(text),
        )
        .map(({ sibling }) => sibling),
    }),
  )
}
