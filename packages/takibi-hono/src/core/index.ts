import { Effect } from 'effect'
import type { SchemaLib } from 'oas-truth'

import { FormatOptions } from '../format/index.js'
import { makeSingleFileCode } from '../generator/handler.js'
import { mergeHandlerFile } from '../merge/index.js'
import { parseOpenAPI } from '../openapi/index.js'
import { makeClients } from './client.js'
import { writeComponents } from './components.js'
import { writeApp, writeHandlers, writeMerged } from './handlers.js'
import type { TakibiHonoConfig } from './layout.js'
import { checkPackages, resolveLayout } from './layout.js'
import { makePackageRoot } from './packages.js'

/**
 * Parses the spec and writes components, handlers, the app entry and (opt-in) clients, in
 * that order, formatting with the config's `format` block. The `FileSystem` everything
 * writes through comes from the caller's environment.
 */
export function hono(config: TakibiHonoConfig) {
  return Effect.gen(function* () {
    const openapi = yield* parseOpenAPI(config.input)
    const shape = resolveLayout(config)
    const layout = { ...shape, packageRoot: yield* makePackageRoot(shape) }
    yield* checkPackages(openapi, layout)
    yield* writeComponents(openapi, config, layout)
    const handlerFileNames = yield* writeHandlers(openapi, config, layout)
    yield* writeApp(handlerFileNames, config, layout)
    yield* makeClients(openapi, config, layout, process.cwd())
  }).pipe(Effect.provideService(FormatOptions, config.format ?? {}))
}

/**
 * The one-shot mode, `takibi-hono <input> -o <output.ts>`: the document's schemas, one
 * `defineHandler` per operation and the app registering them, in a single file. The
 * hand-written parts of an existing file survive as they do in a handler file.
 */
export function honoFile(input: string, output: string, lib: SchemaLib) {
  return Effect.gen(function* () {
    const openapi = yield* parseOpenAPI(input)
    yield* writeMerged(output, makeSingleFileCode(openapi, lib), mergeHandlerFile)
  }).pipe(Effect.provideService(FormatOptions, {}))
}
