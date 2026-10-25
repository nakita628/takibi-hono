import path from 'node:path'

import { Data, Effect } from 'effect'
import { docs } from 'hono-takibi/docs'
import { hooks } from 'hono-takibi/hooks'
import { rpc } from 'hono-takibi/rpc'
import * as typeModule from 'hono-takibi/type'
import type { OpenAPI } from 'oas-truth'

import { emit } from '../emit/index.js'
import { makeClientCode } from '../generator/client.js'
import type { ClientOptions, Layout, Target, TakibiHonoConfig } from './layout.js'
import { makeSpecifier, targetModule } from './layout.js'

// The client generators are delegated to hono-takibi; their entrypoint type is
// the single source of truth for the OpenAPI shape they accept.
type ClientOpenAPI = Parameters<typeof rpc>[0]

// takibi-hono's config keys stay camelCase; hono-takibi's `hooks` takes the
// library as a kebab-case literal. `satisfies` makes a hono-takibi rename of a
// library surface here as a build error instead of a silent runtime miss.
const HOOKS = [
  ['swr', 'swr'],
  ['tanstackQuery', 'tanstack-query'],
  ['svelteQuery', 'svelte-query'],
  ['vueQuery', 'vue-query'],
  ['preactQuery', 'preact-query'],
  ['solidQuery', 'solid-query'],
  ['angularQuery', 'angular-query'],
] as const satisfies readonly (readonly [keyof ClientOptions, Parameters<typeof hooks>[3]])[]

const isTsPath = (output: string): output is `${string}.ts` => output.endsWith('.ts')

/** A client generator failed, or was handed an output path it must not write to. */
export class ClientError extends Data.TaggedError('ClientError')<{ readonly message: string }> {}

/**
 * hono-takibi's emit layer writes to any path it is handed without validation.
 * Resolve the output against the project directory and refuse anything that
 * escapes it, so a config (or spec-derived) path cannot traverse outside.
 */
function resolveWithin(baseDir: string, output: string) {
  const resolved = path.resolve(baseDir, output)
  const rel = path.relative(baseDir, resolved)
  // Only a parent-traversal segment (`..` or `../`) or an absolute path escapes;
  // a normal name that merely begins with `..` (e.g. `..foo`) stays inside.
  const escapes =
    rel === '' || rel === '..' || rel.startsWith(`..${path.sep}`) || path.isAbsolute(rel)
  return escapes
    ? Effect.fail(
        new ClientError({
          message: `Client output path "${output}" escapes the project directory. Use a path inside the project (remove leading "/" or "..").`,
        }),
      )
    : Effect.succeed(resolved)
}

/** Whether `from` (a file to write) and `target` sit in different packages. */
function crossesPackage(layout: Layout, from: string, target: Target) {
  return layout.packageRoot(from) !== layout.packageRoot(targetModule(target))
}

/**
 * The module the typed client imports the type of the app from: `client.import`, or the app
 * entry, relatively (or under `pathAlias`). An app entry in another package has to be named.
 */
function appSpecifier(layout: Layout, client: ClientOptions, target: Target) {
  if (client.import !== undefined) return Effect.succeed(client.import)
  const app = {
    output: path.join(layout.appDir, 'index.ts'),
    split: false,
    exportTypes: false,
    package: undefined,
  }
  return crossesPackage(layout, target.output, app)
    ? Effect.fail(
        new ClientError({
          message: `client imports the app from another package: set client.import to the name of the package ${app.output} is written into.`,
        }),
      )
    : Effect.succeed(makeSpecifier(layout, path.dirname(target.output), app))
}

/**
 * The module rpc or a query hook imports the client from: relatively (or under `pathAlias`),
 * or by `client.package` from another package.
 */
function clientSpecifier(layout: Layout, key: string, output: string) {
  const target = layout.client
  if (target === undefined) {
    return Effect.fail(
      new ClientError({
        message: `client.${key} imports the generated client: set client.output.`,
      }),
    )
  }
  return crossesPackage(layout, output, target) && target.package === undefined
    ? Effect.fail(
        new ClientError({
          message: `client.${key} imports the client from another package: set client.package to the name of the package ${target.output} is written into.`,
        }),
      )
    : Effect.succeed(makeSpecifier(layout, path.dirname(output), target))
}

/** Writes the typed client, which rpc and the query hooks import as `client`. */
function writeClient(
  config: TakibiHonoConfig,
  client: ClientOptions,
  layout: Layout,
  baseDir: string,
) {
  return Effect.gen(function* () {
    const target = layout.client
    if (target === undefined) return
    const output = yield* resolveWithin(baseDir, target.output)
    const code = makeClientCode({
      appImport: yield* appSpecifier(layout, client, target),
      baseUrl: client.baseUrl ?? '/',
      basePath: config.basePath,
      credentials: client.credentials,
    })
    yield* emit(code, path.dirname(output), output)
  })
}

/**
 * Writes the typed client, then generates the rest of the client code by delegating to
 * hono-takibi. Every output path passes through `resolveWithin` before reaching
 * hono-takibi's unvalidated emit layer. Runs after the server pipeline; reuses the
 * already-parsed spec.
 */
export function makeClients(
  openapi: OpenAPI,
  config: TakibiHonoConfig,
  layout: Layout,
  baseDir: string,
) {
  const client = config.client ?? {}
  const basePath = config.basePath
  return Effect.gen(function* () {
    yield* writeClient(config, client, layout, baseDir)
    yield* delegateClients(openapi, client, layout, baseDir, basePath)
  })
}

/** rpc, the query hooks, the types and the docs, by hono-takibi. */
function delegateClients(
  openapi: OpenAPI,
  client: ClientOptions,
  layout: Layout,
  baseDir: string,
  basePath: string | undefined,
) {
  return Effect.gen(function* () {
    // hono-takibi declares its own (structurally equivalent) OpenAPI document type.
    // oxlint-disable-next-line typescript/consistent-type-assertions, typescript/no-unsafe-type-assertion -- see above
    const oa = openapi as ClientOpenAPI
    yield* Effect.forEach(
      HOOKS,
      ([key, library]) => {
        const cfg = client[key]
        return cfg
          ? Effect.gen(function* () {
              const output = yield* resolveWithin(baseDir, cfg.output)
              const importPath = yield* clientSpecifier(layout, key, cfg.output)
              yield* hooks(oa, output, importPath, library, {
                clientName: 'client',
                ...(basePath !== undefined && { basePath }),
              })
            })
          : Effect.void
      },
      { discard: true },
    )
    if (client.rpc) {
      const output = yield* resolveWithin(baseDir, client.rpc.output)
      const importPath = yield* clientSpecifier(layout, 'rpc', client.rpc.output)
      yield* rpc(
        oa,
        output,
        importPath,
        'client',
        client.rpc.parseResponse,
        basePath,
        client.rpc.docs,
      )
    }
    if (client.type) {
      const output = yield* resolveWithin(baseDir, client.type.output)
      if (!isTsPath(output)) {
        return yield* new ClientError({
          message: `Client type output "${client.type.output}" must end with ".ts".`,
        })
      }
      yield* typeModule.type(oa, output, client.type.readonly)
    }
    if (client.docs) {
      const output = yield* resolveWithin(baseDir, client.docs.output)
      yield* docs(
        oa,
        output,
        client.docs.entry,
        client.docs.basePath,
        client.docs.curl,
        client.docs.baseUrl,
      )
    }
    return undefined
  }).pipe(
    // hono-takibi's own error classes are not part of its public API; carry their message.
    Effect.mapError((error) =>
      error instanceof ClientError ? error : new ClientError({ message: error.message }),
    ),
  )
}
