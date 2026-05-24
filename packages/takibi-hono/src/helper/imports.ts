import path from 'node:path'

import { renderNamedImport } from '../utils/index.js'
import { getLibraryConfig, getStandardValidatorConfig } from './library.js'

const JS_IDENT = '[A-Za-z_$][A-Za-z0-9_$]*'
const EXPORT_CONST_PATTERN = /export\s+const\s+([A-Za-z_$][A-Za-z0-9_$]*)/g

/**
 * OpenAPI 3.0/3.1/3.2 Components fields → identifier suffix. Listed in spec
 * order; **reordering changes user-visible import line ordering**.
 * `classifyRef` picks the longest matching suffix so `Schema` doesn't shadow
 * `ParamsSchema` / `HeaderSchema` / `MediaTypeSchema`.
 */
const COMPONENT_SUFFIXES = [
  ['schemas', 'Schema'],
  ['responses', 'Response'],
  ['parameters', 'ParamsSchema'],
  ['examples', 'Example'],
  ['requestBodies', 'RequestBody'],
  ['headers', 'HeaderSchema'],
  ['securitySchemes', 'SecurityScheme'],
  ['links', 'Link'],
  ['callbacks', 'Callback'],
  ['pathItems', 'PathItem'],
  ['mediaTypes', 'MediaTypeSchema'],
] as const

/**
 * String / comment alternatives MUST come first so the engine consumes them
 * whole — identifier-shape tokens inside strings/comments (e.g.
 * `operationId: 'userCreatedCallback'`) are then unreachable.
 */
const SCAN = new RegExp(
  [
    String.raw`"(?:\\.|[^"\\])*"`,
    String.raw`'(?:\\.|[^'\\])*'`,
    String.raw`\`(?:\\.|[^\`\\])*\``,
    String.raw`//[^\n]*`,
    String.raw`/\*[\s\S]*?\*/`,
    `\\b(${JS_IDENT}(?:${COMPONENT_SUFFIXES.map(([, suf]) => suf).join('|')}))\\b`,
  ].join('|'),
  'g',
)

/** Longest matching suffix wins so `UserParamsSchema` → parameters, not schemas. */
const classifyRef = (name: string): string | undefined =>
  COMPONENT_SUFFIXES.reduce<readonly [string, string] | undefined>(
    (best, entry) =>
      name.endsWith(entry[1]) && (!best || entry[1].length > best[1].length) ? entry : best,
    undefined,
  )?.[0]

const SCHEMA_LIB_PATTERNS: Record<'zod' | 'valibot' | 'typebox' | 'arktype' | 'effect', string> = {
  zod: 'z.',
  valibot: 'v.',
  typebox: 'Type.',
  arktype: 'type(',
  effect: 'Schema.',
}

export function makeModuleSpec(fromFile: string, targetOutput: string) {
  const rel = path.relative(path.dirname(fromFile), targetOutput).replace(/\\/g, '/')
  const stripped = rel.replace(/\.ts$/, '').replace(/\/index$/, '')
  return stripped === '' ? '.' : stripped.startsWith('.') ? stripped : `./${stripped}`
}

function collectDefinedExports(code: string) {
  return new Set(Array.from(code.matchAll(EXPORT_CONST_PATTERN), (m) => m[1]).filter(Boolean))
}

function collectComponentImportLines(
  code: string,
  componentPaths: {
    readonly [key: string]: string | undefined
  },
  defined: ReadonlySet<string>,
): readonly string[] {
  const grouped = Array.from(code.matchAll(SCAN), (m) => m[1])
    .filter((name): name is string => Boolean(name) && !defined.has(name))
    .reduce<ReadonlyMap<string, ReadonlySet<string>>>((acc, name) => {
      const kind = classifyRef(name)
      if (!kind) return acc
      return new Map(acc).set(kind, new Set([...(acc.get(kind) ?? []), name]))
    }, new Map())
  // Emit in COMPONENT_SUFFIXES declaration order (= OpenAPI 3.x spec order)
  // instead of scan-encounter order, which varies with source layout.
  return COMPONENT_SUFFIXES.flatMap(([kind]) => {
    const names = grouped.get(kind)
    const importPath = componentPaths[kind]
    if (!names || !importPath) return []
    return [renderNamedImport([...names].toSorted(), importPath)]
  })
}

export function makeComponentImports(
  code: string,
  schemaLib: 'zod' | 'valibot' | 'typebox' | 'arktype' | 'effect',
  componentPaths: {
    readonly [key: string]: string | undefined
  },
) {
  const config = getLibraryConfig(schemaLib)
  const defined = collectDefinedExports(code)
  return [
    ...(code.includes('resolver(') ? [`import{resolver}from'${config.modulePath}'`] : []),
    ...(code.includes(SCHEMA_LIB_PATTERNS[schemaLib]) ? [config.schemaImport] : []),
    ...(code.includes('standardSchemaV1(') ? ["import{standardSchemaV1}from'effect/Schema'"] : []),
    ...(code.includes('Compile(') ? ["import{Compile}from'typebox/compile'"] : []),
    ...(schemaLib === 'typebox' && code.includes('Static<typeof ')
      ? ["import type{Static}from'typebox'"]
      : []),
    ...collectComponentImportLines(code, componentPaths, defined),
  ] as const
}

export function makeImports(
  code: string,
  schemaLib: 'zod' | 'valibot' | 'typebox' | 'arktype' | 'effect',
  componentPaths: {
    readonly [key: string]: string | undefined
  },
) {
  const config = getLibraryConfig(schemaLib)
  const needsResolver = code.includes('resolver(')
  const needsValidator = code.includes("validator('")
  const defined = collectDefinedExports(code)

  const needsDescribeRoute = code.includes('describeRoute(')
  const honoOpenApiParts = [
    ...(needsDescribeRoute ? ['describeRoute'] : []),
    ...(needsResolver ? ['resolver'] : []),
    ...(needsValidator ? ['validator'] : []),
  ]
  const honoOpenApiImport =
    honoOpenApiParts.length > 0
      ? `import{${honoOpenApiParts.join(',')}}from'hono-openapi'`
      : undefined

  return [
    "import{Hono}from'hono'",
    ...(honoOpenApiImport ? [honoOpenApiImport] : []),
    ...(code.includes(SCHEMA_LIB_PATTERNS[schemaLib]) ? [config.schemaImport] : []),
    ...(code.includes('standardSchemaV1(') ? ["import{standardSchemaV1}from'effect/Schema'"] : []),
    ...(code.includes('Compile(') ? ["import{Compile}from'typebox/compile'"] : []),
    ...collectComponentImportLines(code, componentPaths, defined),
  ] as const
}

export function makeStandardImports(
  code: string,
  schemaLib: 'zod' | 'valibot' | 'typebox' | 'arktype' | 'effect',
  componentPaths: {
    readonly [key: string]: string | undefined
  },
) {
  const config = getLibraryConfig(schemaLib)
  const svConfig = getStandardValidatorConfig(schemaLib)
  const defined = collectDefinedExports(code)
  // \b boundary so we don't false-match `tbValidator(`.
  const usesInlineValidator = /\bvalidator\(/.test(code)
  const usesValueModule = code.includes('Value.Convert(') || code.includes('Value.Check(')

  return [
    "import{Hono}from'hono'",
    ...(code.includes(`${svConfig.validatorFn}(`) ? [svConfig.validatorImport] : []),
    ...(schemaLib === 'typebox' && usesInlineValidator
      ? ["import{validator}from'hono/validator'"]
      : []),
    ...(schemaLib === 'typebox' && usesValueModule ? ["import{Value}from'typebox/value'"] : []),
    ...(code.includes(SCHEMA_LIB_PATTERNS[schemaLib]) ? [config.schemaImport] : []),
    ...collectComponentImportLines(code, componentPaths, defined),
  ] as const
}
