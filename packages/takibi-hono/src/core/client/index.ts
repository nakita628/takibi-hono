import path from 'node:path'

import { docs } from 'hono-takibi/docs'
import { hooks } from 'hono-takibi/hooks'
import { rpc } from 'hono-takibi/rpc'
import * as typeModule from 'hono-takibi/type'

import type { OpenAPI } from '../../openapi/index.js'
import type { ClientOptions } from '../layout.js'

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
    ? ({
        ok: false,
        error: `Client output path "${output}" escapes the project directory. Use a path inside the project (remove leading "/" or "..").`,
      } as const)
    : ({ ok: true, value: resolved } as const)
}

/**
 * Generates client code by delegating to hono-takibi. Every output path passes
 * through `resolveWithin` before reaching hono-takibi's unvalidated emit layer.
 * Runs after the server pipeline; reuses the already-parsed spec.
 */
export async function makeClients(
  openapi: OpenAPI,
  client: ClientOptions,
  baseDir: string,
  basePath?: string,
) {
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

  for (const { library, cfg } of queries) {
    if (cfg) {
      const safe = resolveWithin(baseDir, cfg.output)
      if (!safe.ok) return safe
      const result = await hooks(oa, safe.value, cfg.import, library, {
        ...(cfg.split !== undefined && { split: cfg.split }),
        ...(cfg.client !== undefined && { clientName: cfg.client }),
      })
      if (!result.ok) return result
    }
  }

  if (client.rpc) {
    const safe = resolveWithin(baseDir, client.rpc.output)
    if (!safe.ok) return safe
    const result = await rpc(
      oa,
      safe.value,
      client.rpc.import,
      client.rpc.split,
      client.rpc.client,
      client.rpc.parseResponse,
      basePath,
      client.rpc.docs,
    )
    if (!result.ok) return result
  }

  if (client.type) {
    const safe = resolveWithin(baseDir, client.type.output)
    if (!safe.ok) return safe
    if (!isTsPath(safe.value)) {
      return {
        ok: false,
        error: `Client type output "${client.type.output}" must end with ".ts".`,
      } as const
    }
    const result = await typeModule.type(oa, safe.value, client.type.readonly)
    if (!result.ok) return result
  }

  if (client.docs) {
    const safe = resolveWithin(baseDir, client.docs.output)
    if (!safe.ok) return safe
    const result = await docs(
      oa,
      safe.value,
      client.docs.entry,
      client.docs.basePath,
      client.docs.curl,
      client.docs.baseUrl,
    )
    if (!result.ok) return result
  }

  return { ok: true, value: undefined } as const
}
