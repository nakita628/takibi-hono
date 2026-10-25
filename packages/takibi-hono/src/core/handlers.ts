import path from 'node:path'

import { Effect } from 'effect'
import type { OpenAPI } from 'oas-truth'
import { makeSchemaIdentifiers, toIdentifierPascalCase } from 'oas-truth'

import { emit } from '../emit/index.js'
import { readdir, readFile, unlink } from '../file/index.js'
import {
  makeAppCode,
  makeDefinitionsCode,
  makeHandlerCode,
  nameOperations,
  toHandlerVarName,
} from '../generator/handler.js'
import { makeBarrel } from '../helper/imports.js'
import { collectRoutes, collectWebhookRoutes } from '../helper/operations.js'
import { mergeAppFile, mergeHandlerFile } from '../merge/index.js'
import type { Layout, TakibiHonoConfig } from './layout.js'
import { makeSpecifier } from './layout.js'

/** The specifier a module in `fromDir` imports `file` by: relative, without `.ts`. */
function toImport(fromDir: string, file: string) {
  const rel = path.relative(fromDir, file).replaceAll('\\', '/').replace(/\.ts$/u, '')
  return rel.startsWith('.') ? rel : `./${rel}`
}

/** Writes `code`, keeping the hand-written parts of an existing file via `merge`. */
function writeMerged(
  file: string,
  code: string,
  merge: (existing: string, code: string) => string,
) {
  return Effect.gen(function* () {
    const existing = yield* readFile(file)
    yield* emit(existing === null ? code : merge(existing, code), path.dirname(file), file)
  })
}

/**
 * One handler file per first path segment, a barrel, and (hono-openapi mode) the
 * OAS 3.1 webhooks in `webhooks.ts`. Existing handler bodies survive through
 * `mergeHandlerFile`; `.ts` files no route maps to any more are deleted.
 */
export function writeHandlers(openapi: OpenAPI, config: TakibiHonoConfig, layout: Layout) {
  return Effect.gen(function* () {
    const { handlersDir, targets } = layout
    const useOpenAPI = config.openapi === true
    const components = openapi.components
    const schemas = targets.schemas
    const responses = targets.responses
    const groups = collectRoutes(openapi)
    const componentImports = (fromDir: string) => [
      ...(schemas
        ? [...makeSchemaIdentifiers(components?.schemas ?? {}).values()].map((ident) => ({
            name: `${ident}Schema`,
            from: makeSpecifier(layout, fromDir, schemas),
          }))
        : []),
      ...(responses
        ? Object.keys(components?.responses ?? {}).map((name) => ({
            name: `${toIdentifierPascalCase(name)}Response`,
            from: makeSpecifier(layout, fromDir, responses),
          }))
        : []),
    ]
    // The definitions module, when `defineHandler` is set: one definition per route of every
    // group, named so that none takes a group export's name (`postCommentsHandler` beside
    // `/post-comments`), which the handler file importing it exports. Nothing in it is the
    // user's, so it is written over.
    const definitions = layout.definitions
    const named =
      definitions === undefined
        ? undefined
        : nameOperations([...groups.values()].flat(), [...groups.keys()].map(toHandlerVarName))
    if (definitions !== undefined && named !== undefined && named.size > 0) {
      const code = makeDefinitionsCode(named, {
        lib: config.schema,
        components,
        imports: componentImports(path.dirname(definitions)),
      })
      yield* emit(code, path.dirname(definitions), definitions)
    }
    const context = {
      lib: config.schema,
      openapi: useOpenAPI,
      components,
      responseRefs: responses !== undefined,
      imports: componentImports(handlersDir),
      ...(definitions !== undefined &&
        named !== undefined && {
          defineHandler: { from: toImport(handlersDir, definitions), names: named },
        }),
    }
    const webhooks = useOpenAPI ? collectWebhookRoutes(openapi) : []
    const files = [
      ...[...groups].map(([name, routes]) => ({
        name,
        code: makeHandlerCode(toHandlerVarName(name), routes, context),
      })),
      ...(webhooks.length > 0
        ? [{ name: 'webhooks', code: makeHandlerCode('webhooksHandler', webhooks, context) }]
        : []),
    ]
    yield* Effect.forEach(
      files,
      (file) => writeMerged(path.join(handlersDir, `${file.name}.ts`), file.code, mergeHandlerFile),
      { discard: true },
    )
    const names = [...groups.keys()]
    if (names.length > 0) {
      yield* emit(makeBarrel(names), handlersDir, path.join(handlersDir, 'index.ts'))
    }
    const expected = new Set([
      ...files.map((file) => `${file.name}.ts`),
      'index.ts',
      // A definitions module written into the handlers directory is not a stale handler file.
      ...(definitions !== undefined && path.dirname(definitions) === handlersDir
        ? [path.basename(definitions)]
        : []),
    ])
    const entries = yield* readdir(handlersDir)
    yield* Effect.forEach(
      entries.filter((entry) => entry.endsWith('.ts') && !expected.has(entry)),
      (entry) => unlink(path.join(handlersDir, entry)),
      { discard: true },
    )
    return names
  })
}

/** The app entry; user imports and middleware survive through `mergeAppFile`. */
export function writeApp(
  handlerFileNames: readonly string[],
  config: TakibiHonoConfig,
  layout: Layout,
) {
  const code = makeAppCode(handlerFileNames, {
    basePath: config.basePath,
    split: config.split,
    handlersImport: `./${path.relative(layout.appDir, layout.handlersDir).replaceAll('\\', '/')}`,
  })
  return writeMerged(path.join(layout.appDir, 'index.ts'), code, mergeAppFile)
}
