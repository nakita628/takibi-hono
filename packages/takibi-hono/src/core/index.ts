import { Effect } from 'effect'
import type { SchemaLib } from 'oas-truth'

import { FormatOptions } from '../format/index.js'
import { parseOpenAPI } from '../openapi/index.js'
import { makeClients } from './client.js'
import { writeComponents } from './components.js'
import { resolveHandlerFiles } from './handler-files.js'
import { writeApp, writeDefinitions, writeHandlers } from './handlers.js'
import type { TakibiHonoConfig } from './layout.js'
import { checkPackages, resolveLayout } from './layout.js'
import { makePackageRoot } from './packages.js'

/**
 * Parses the spec and writes components, the `defineHandler` definitions, handlers, the app
 * entry and (opt-in) clients, in that order, formatting with the config's `format` block.
 * Definitions without `template` stand alone: nothing after them is written. The
 * `FileSystem` everything writes through comes from the caller's environment.
 */
export function hono(config: TakibiHonoConfig) {
  return Effect.gen(function* () {
    const openapi = yield* parseOpenAPI(config.input)
    const shape = resolveLayout(config)
    const layout = { ...shape, packageRoot: yield* makePackageRoot(shape) }
    yield* checkPackages(openapi, layout)
    yield* writeComponents(openapi, config, layout)
    const handlerFiles = yield* resolveHandlerFiles(openapi, config, layout)
    const named = yield* writeDefinitions(openapi, config, layout, handlerFiles)
    if (!layout.scaffold) return
    const fileOf = yield* writeHandlers(openapi, config, layout, named, handlerFiles)
    yield* writeApp(fileOf, config, layout)
    yield* makeClients(openapi, config, layout, process.cwd(), fileOf)
  }).pipe(Effect.provideService(FormatOptions, config.format ?? {}))
}

/**
 * The one-shot mode, `takibi-hono <input> -o <output.ts>`: `defineHandler: { output }` and
 * nothing else — the document's components and the definition of every operation, in a
 * single file the user's handlers import, as hono-takibi's `-o` writes its routes.
 */
export function honoFile(input: string, output: string, lib: SchemaLib) {
  return hono({ input, schema: lib, defineHandler: { output } })
}
