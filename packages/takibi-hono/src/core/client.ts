import path from 'node:path'

import { Data, Effect } from 'effect'
import { docs } from 'hono-takibi/docs'
import { hooks } from 'hono-takibi/hooks'
import { rpc } from 'hono-takibi/rpc'
import * as typeModule from 'hono-takibi/type'
import type { OpenAPI } from 'oas-truth'

import type { ClientOptions } from './layout.js'

// The client generators are delegated to hono-takibi; their entrypoint type is
// the single source of truth for the OpenAPI shape they accept.
type ClientOpenAPI = Parameters<typeof rpc>[0]

// takibi-hono's config keys stay camelCase; hono-takibi's `hooks` takes the
// library as a kebab-case literal. `satisfies` makes a hono-takibi rename of a
// library surface here as a build error instead of a silent runtime miss.
const HOOK_LIBRARIES = {
  swr: 'swr',
  tanstackQuery: 'tanstack-query',
  svelteQuery: 'svelte-query',
  vueQuery: 'vue-query',
  preactQuery: 'preact-query',
  solidQuery: 'solid-query',
  angularQuery: 'angular-query',
} as const satisfies Record<string, Parameters<typeof hooks>[3]>

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

/**
 * Generates client code by delegating to hono-takibi. Every output path passes
 * through `resolveWithin` before reaching hono-takibi's unvalidated emit layer.
 * Runs after the server pipeline; reuses the already-parsed spec.
 */
export function makeClients(
  openapi: OpenAPI,
  client: ClientOptions,
  baseDir: string,
  basePath?: string,
) {
  return Effect.gen(function* () {
    // hono-takibi declares its own (structurally equivalent) OpenAPI document type.
    // oxlint-disable-next-line typescript/consistent-type-assertions, typescript/no-unsafe-type-assertion -- see above
    const oa = openapi as ClientOpenAPI
    const queries = [
      { library: HOOK_LIBRARIES.swr, cfg: client.swr },
      { library: HOOK_LIBRARIES.tanstackQuery, cfg: client.tanstackQuery },
      { library: HOOK_LIBRARIES.svelteQuery, cfg: client.svelteQuery },
      { library: HOOK_LIBRARIES.vueQuery, cfg: client.vueQuery },
      { library: HOOK_LIBRARIES.preactQuery, cfg: client.preactQuery },
      { library: HOOK_LIBRARIES.solidQuery, cfg: client.solidQuery },
      { library: HOOK_LIBRARIES.angularQuery, cfg: client.angularQuery },
    ] as const
    yield* Effect.forEach(
      queries,
      ({ library, cfg }) =>
        cfg
          ? Effect.gen(function* () {
              const output = yield* resolveWithin(baseDir, cfg.output)
              yield* hooks(oa, output, cfg.import, library, {
                ...(cfg.split !== undefined && { split: cfg.split }),
                ...(cfg.client !== undefined && { clientName: cfg.client }),
              })
            })
          : Effect.void,
      { discard: true },
    )
    if (client.rpc) {
      const output = yield* resolveWithin(baseDir, client.rpc.output)
      yield* rpc(
        oa,
        output,
        client.rpc.import,
        client.rpc.split,
        client.rpc.client,
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
