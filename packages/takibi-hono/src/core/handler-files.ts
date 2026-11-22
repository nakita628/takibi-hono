import path from 'node:path'

import { Effect } from 'effect'
import type { OpenAPI } from 'oas-truth'

import { readdir, readFile } from '../file/index.js'
import type { Route } from '../helper/operations.js'
import { collectRoutes, collectWebhookRoutes } from '../helper/operations.js'
import { handlerRouteKeys, isCarriedWhole, mergeRouteBodies } from '../merge/index.js'
import type { Layout, TakibiHonoConfig } from './layout.js'

/** The groups of the handlers directory and the file each is written to. */
export type HandlerFiles = {
  /** The routes of each group (a first path segment), by its name. */
  readonly groups: ReadonlyMap<string, readonly Route[]>
  /** The file of each group, without `.ts` (see {@link matchHandlerFiles}). */
  readonly fileOf: ReadonlyMap<string, string>
  /** The handler files already in the directory, without `.ts`, sorted, with their code. */
  readonly existing: ReadonlyMap<string, string>
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

/** The groups with no handlers directory read: each group is its own file. */
export function plainHandlerFiles(openapi: OpenAPI, config: TakibiHonoConfig): HandlerFiles {
  const groups = collectRoutes(openapi, config.fileNameCase)
  return {
    groups,
    fileOf: new Map([...groups.keys()].map((group) => [group, group])),
    existing: new Map(),
  }
}

/** Reads the handlers directory and works out the file of every group. */
export function resolveHandlerFiles(openapi: OpenAPI, config: TakibiHonoConfig, layout: Layout) {
  return Effect.gen(function* () {
    const { handlersDir, definitions } = layout
    const groups = collectRoutes(openapi, config.fileNameCase)
    const webhooks = config.openapi === true && collectWebhookRoutes(openapi).length > 0
    // A definitions file written into the handlers directory is not a handler file.
    const definitionsFile =
      definitions !== undefined &&
      !definitions.split &&
      path.dirname(definitions.output) === handlersDir
        ? path.basename(definitions.output)
        : undefined
    const entries = yield* readdir(handlersDir)
    const names = entries
      .filter((entry) => entry.endsWith('.ts'))
      .filter(
        (entry) =>
          entry !== 'index.ts' &&
          entry !== definitionsFile &&
          !(webhooks && entry === 'webhooks.ts'),
      )
      .map((entry) => entry.slice(0, -'.ts'.length))
      .toSorted()
    const codes = yield* Effect.forEach(names, (name) =>
      Effect.map(readFile(path.join(handlersDir, `${name}.ts`)), (code) => [name, code] as const),
    )
    const files: HandlerFiles = {
      groups,
      fileOf: matchHandlerFiles([...groups.keys()], names),
      existing: new Map(codes.flatMap(([name, code]) => (code === null ? [] : [[name, code]]))),
    }
    return files
  })
}

/**
 * Carries into the generated code of each group (`generated`) the handlers its routes have in
 * other existing files, found by method and path: switching `fileNameCase` can move a route to
 * another file (`/user_profiles` and `/user-profiles` are one group in kebab case,
 * `/userProfiles` and `/userprofiles` two, `{org_id}.ts` becomes `org-id.ts`). The imports and
 * helpers the handlers use come with them (`mergeRouteBodies`).
 *
 * Answers the code of each group and the files no group takes that must not be deleted: one
 * that does not parse, one that still holds a helper that was not carried, and one whose
 * handlers could not be carried because the file they go to does not parse (its merge keeps it
 * as it is until it parses again). Every other file no group takes is deleted.
 */
export function carryMovedRoutes(files: HandlerFiles, generated: ReadonlyMap<string, string>) {
  const claimed = new Set(files.fileOf.values())
  const keysOf = new Map(
    [...files.existing].map(([file, code]) => [file, handlerRouteKeys(code)] as const),
  )
  const groupKeys = new Map(
    [...generated].map(([group, code]) => [group, [...(handlerRouteKeys(code) ?? [])]] as const),
  )
  const holds = (file: string, group: string) =>
    (groupKeys.get(group) ?? []).some((key) => keysOf.get(file)?.has(key) === true)
  const ownOf = (group: string) => files.fileOf.get(group) ?? group
  const broken = (file: string) => files.existing.has(file) && keysOf.get(file) === undefined
  const codes = new Map(
    [...generated].map(([group, code]) => {
      const own = ownOf(group)
      if (broken(own)) return [group, code] as const
      const ownCode = files.existing.get(own) ?? ''
      const carried = [...files.existing]
        .filter(([file]) => file !== own && !broken(file) && holds(file, group))
        .reduce((result, [, source]) => mergeRouteBodies(source, result, ownCode), code)
      return [group, carried] as const
    }),
  )
  const groups = [...generated.keys()]
  const kept = [...files.existing]
    .filter(([file]) => !claimed.has(file))
    .filter(
      ([file, code]) =>
        groups.some((group) => broken(ownOf(group)) && holds(file, group)) ||
        !isCarriedWhole(code, [...codes.values()]),
    )
    .map(([file]) => file)
  return { codes, kept }
}
