import path from 'node:path'

import { Effect } from 'effect'
import type { OpenAPI } from 'oas-truth'
import { makeSchemaIdentifiers, toIdentifierPascalCase } from 'oas-truth'

import { emit, emitFiles } from '../emit/index.js'
import { readdir, readFile, unlink } from '../file/index.js'
import {
  makeAppCode,
  makeDefinitionEntries,
  makeHandlerCode,
  nameOperations,
  toHandlerVarName,
} from '../generator/handler.js'
import { makeBarrel, withImports } from '../helper/imports.js'
import { makeLibraryImports } from '../helper/library.js'
import { collectRoutes, collectWebhookRoutes } from '../helper/operations.js'
import { mergeAppFile, mergeHandlerFile } from '../merge/index.js'
import { makeAggregateCode } from './components.js'
import type { Layout, TakibiHonoConfig } from './layout.js'
import { makeSpecifier, targetDirectory } from './layout.js'

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

/** The imports a module in `fromDir` needs for the components it may refer to. */
function componentImports(openapi: OpenAPI, layout: Layout, fromDir: string) {
  const components = openapi.components
  const schemas = layout.targets.schemas
  const responses = layout.targets.responses
  return [
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
}

/**
 * The `defineHandler` definitions, when `defineHandler` is set: one per route of every group,
 * named so that none takes a group export's name (`postCommentsHandler` beside
 * `/post-comments`), which the handler file importing it exports. One file — holding the
 * components too when they have no module of their own — or one file per definition and a
 * barrel (`split`). Nothing in them is the user's, so they are written over. Answers the name
 * of each route's definition, for the handler files.
 */
export function writeDefinitions(openapi: OpenAPI, config: TakibiHonoConfig, layout: Layout) {
  return Effect.gen(function* () {
    const definitions = layout.definitions
    if (definitions === undefined) return undefined
    const groups = collectRoutes(openapi)
    const named = nameOperations(
      [...groups.values()].flat(),
      [...groups.keys()].map(toHandlerVarName),
    )
    const dir = targetDirectory(definitions)
    const entries = makeDefinitionEntries([...groups.values()].flat(), named, {
      lib: config.schema,
      components: openapi.components,
      imports: [],
    })
    const shared = !definitions.split && layout.aggregate === definitions.output
    const { prologue, parts } = shared
      ? makeAggregateCode(openapi, config, layout)
      : { prologue: '', parts: [] }
    const module = (code: string) =>
      withImports(`${prologue}${code}`, [
        ...makeLibraryImports(config.schema),
        ...(shared ? [] : componentImports(openapi, layout, dir)),
      ])
    if (entries.length === 0 && parts.length === 0) return named
    yield* emitFiles(
      definitions.split
        ? [
            ...entries.map((entry) => ({
              path: path.join(dir, `${entry.fileName}.ts`),
              code: module(entry.code),
            })),
            {
              path: path.join(dir, 'index.ts'),
              code: makeBarrel(entries.map((entry) => entry.fileName)),
            },
          ]
        : [
            {
              path: definitions.output,
              code: module([...parts, ...entries.map((entry) => entry.code)].join('\n\n')),
            },
          ],
    )
    return named
  })
}

/**
 * One handler file per first path segment, a barrel, and (hono-openapi mode) the
 * OAS 3.1 webhooks in `webhooks.ts`. Existing handler bodies survive through
 * `mergeHandlerFile`; `.ts` files no route maps to any more are deleted. `named` is what
 * `writeDefinitions` answered: the definition each route's call takes.
 */
export function writeHandlers(
  openapi: OpenAPI,
  config: TakibiHonoConfig,
  layout: Layout,
  named: ReadonlyMap<string, string> | undefined,
) {
  return Effect.gen(function* () {
    const { handlersDir } = layout
    const useOpenAPI = config.openapi === true
    const components = openapi.components
    const definitions = layout.definitions
    const groups = collectRoutes(openapi)
    const context = {
      lib: config.schema,
      openapi: useOpenAPI,
      components,
      responseRefs: layout.targets.responses !== undefined,
      imports: componentImports(openapi, layout, handlersDir),
      ...(definitions !== undefined &&
        named !== undefined && {
          defineHandler: { from: makeSpecifier(layout, handlersDir, definitions), names: named },
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
      // A definitions file written into the handlers directory is not a stale handler file.
      ...(definitions !== undefined &&
      !definitions.split &&
      path.dirname(definitions.output) === handlersDir
        ? [path.basename(definitions.output)]
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
