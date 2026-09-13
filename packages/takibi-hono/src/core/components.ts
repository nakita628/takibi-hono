import path from 'node:path'

import { Effect } from 'effect'
import type { OpenAPI } from 'oas-truth'

import { emitFiles } from '../emit/index.js'
import { COMPONENT_KINDS, makeComponentCode } from '../generator/components.js'
import { makeSchemaDeclarations, makeSchemasPrologue } from '../generator/schemas.js'
import type { ImportEntry } from '../helper/imports.js'
import { withImports } from '../helper/imports.js'
import { makeInlineAdapter, makeLibraryImports } from '../helper/library.js'
import type { Layout, TakibiHonoConfig, Target } from './layout.js'
import { makeSpecifier } from './layout.js'

/**
 * A split target gets one file per entry plus an `index.ts` barrel; otherwise the
 * entries share the target file. `module` turns an entry body into a full module.
 */
function placeEntries(
  target: Target,
  entries: readonly { readonly fileName: string; readonly code: string }[],
  module: (code: string, file: string) => string,
) {
  if (entries.length === 0) return []
  if (!target.split) {
    return [
      { path: target.output, code: module(entries.map((e) => e.code).join('\n\n'), target.output) },
    ]
  }
  const files = entries.map((entry) => {
    const file = path.join(target.output, `${entry.fileName}.ts`)
    return { path: file, code: module(entry.code, file) }
  })
  const barrel = entries
    .map((entry) => `export*from'./${entry.fileName}'`)
    .toSorted()
    .join('\n')
  return [...files, { path: path.join(target.output, 'index.ts'), code: barrel }]
}

/**
 * `components.schemas` through oas-truth's `makeSchemaDeclarations` (plus
 * hono-openapi ref registration), every other kind through its builders. In
 * hono-openapi mode each `schema:` slot is wrapped in `resolver(...)` and each
 * schema registers itself under `components.schemas`.
 */
export function writeComponents(openapi: OpenAPI, config: TakibiHonoConfig, layout: Layout) {
  const lib = config.schema
  const useOpenAPI = config.openapi === true
  const readonly = config.readonly ?? false
  const components = openapi.components ?? {}
  const adapter = makeInlineAdapter(lib, { resolver: useOpenAPI })
  const libraryImports = makeLibraryImports(lib)
  const schemaOptions = {
    lib,
    exportTypes: layout.targets.schemas?.exportTypes ?? false,
    readonly,
    registerRef: useOpenAPI,
  }
  const declarations = makeSchemaDeclarations(components.schemas ?? {}, schemaOptions)
  const prologue = declarations.length > 0 ? makeSchemasPrologue(schemaOptions) : ''

  if (layout.aggregate) {
    const parts = [
      ...declarations.map((d) => d.code),
      ...COMPONENT_KINDS.flatMap((kind) =>
        makeComponentCode(kind, components, adapter, {
          exportTypes: false,
          readonly,
          split: false,
        }).map((e) => e.code),
      ),
    ]
    if (parts.length === 0) return Effect.void
    return emitFiles([
      {
        path: layout.aggregate,
        code: withImports(`${prologue}${parts.join('\n\n')}`, libraryImports),
      },
    ])
  }

  const schemasTarget = layout.targets.schemas
  // Split schema files import each other by file name; a single file declares them all.
  const siblingSchemas: readonly ImportEntry[] = declarations.map((d) => ({
    name: d.varName,
    from: `./${d.fileName}`,
  }))
  const schemaFiles = schemasTarget
    ? placeEntries(schemasTarget, declarations, (code) =>
        withImports(`${prologue}${code}`, [...libraryImports, ...siblingSchemas]),
      )
    : []
  const schemaImports = (file: string): readonly ImportEntry[] =>
    schemasTarget
      ? declarations.map((d) => ({
          name: d.varName,
          from: makeSpecifier(layout, path.dirname(file), schemasTarget),
        }))
      : []
  const componentFiles = COMPONENT_KINDS.flatMap((kind) => {
    const target = layout.targets[kind]
    if (!target) return []
    return placeEntries(
      target,
      makeComponentCode(kind, components, adapter, { ...target, readonly }),
      (code, file) => withImports(code, [...libraryImports, ...schemaImports(file)]),
    )
  })
  return emitFiles([...schemaFiles, ...componentFiles])
}
