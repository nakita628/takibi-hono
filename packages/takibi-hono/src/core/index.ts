import { Effect } from 'effect'

import { FormatOptions } from '../format/index.js'
import { parseOpenAPI } from '../openapi/index.js'
import { makeClients } from './client.js'
import { writeComponents } from './components.js'
import { writeApp, writeHandlers } from './handlers.js'
import type { TakibiHonoConfig } from './layout.js'
import { resolveLayout } from './layout.js'

/**
 * Parses the spec and writes components, handlers, the app entry and (opt-in) clients, in
 * that order, formatting with the config's `format` block. The `FileSystem` everything
 * writes through comes from the caller's environment.
 */
export function hono(config: TakibiHonoConfig) {
  return Effect.gen(function* () {
    const openapi = yield* parseOpenAPI(config.input)
    const layout = resolveLayout(config)
    yield* writeComponents(openapi, config, layout)
    const handlerFileNames = yield* writeHandlers(openapi, config, layout)
    yield* writeApp(handlerFileNames, config, layout)
    if (config.client) yield* makeClients(openapi, config.client, process.cwd(), config.basePath)
  }).pipe(Effect.provideService(FormatOptions, config.format ?? {}))
}
