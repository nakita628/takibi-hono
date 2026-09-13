import path from 'node:path'

import { Effect } from 'effect'
import type { OpenAPI } from 'oas-truth'
import { makeSchemaIdentifiers, toIdentifierPascalCase } from 'oas-truth'

import { emit } from '../emit/index.js'
import { readdir, readFile, unlink } from '../file/index.js'
import { makeAppCode, makeHandlerCode, toHandlerVarName } from '../generator/handler.js'
import { collectRoutes, collectWebhookRoutes } from '../helper/operations.js'
import { mergeAppFile, mergeHandlerFile } from '../merge/index.js'
import type { Layout, TakibiHonoConfig } from './layout.js'
import { makeSpecifier } from './layout.js'

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
    const context = {
      lib: config.schema,
      openapi: useOpenAPI,
      components,
      responseRefs: responses !== undefined,
      imports: [
        ...(schemas
          ? [...makeSchemaIdentifiers(components?.schemas ?? {}).values()].map((ident) => ({
              name: `${ident}Schema`,
              from: makeSpecifier(layout, handlersDir, schemas),
            }))
          : []),
        ...(responses
          ? Object.keys(components?.responses ?? {}).map((name) => ({
              name: `${toIdentifierPascalCase(name)}Response`,
              from: makeSpecifier(layout, handlersDir, responses),
            }))
          : []),
      ],
    }
    const groups = collectRoutes(openapi)
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
      const barrel = names
        .toSorted()
        .map((name) => `export*from'./${name}'`)
        .join('\n')
      yield* emit(barrel, handlersDir, path.join(handlersDir, 'index.ts'))
    }
    const expected = new Set([...files.map((file) => `${file.name}.ts`), 'index.ts'])
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
    handlersImport: `./${path.relative(layout.appDir, layout.handlersDir).replaceAll('\\', '/')}`,
  })
  return writeMerged(path.join(layout.appDir, 'index.ts'), code, mergeAppFile)
}
