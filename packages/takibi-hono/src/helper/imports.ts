import path from 'node:path'

import { renderNamedImport } from '../utils/index.js'
import { getLibraryConfig, getStandardValidatorConfig } from './library.js'

const JS_IDENT = '[A-Za-z_$][A-Za-z0-9_$]*'
const EXPORT_CONST_PATTERN = /export\s+const\s+([A-Za-z_$][A-Za-z0-9_$]*)/g

const IMPORT_PATTERNS: ReadonlyArray<{ readonly pattern: RegExp; readonly key: string }> = [
  {
    pattern: new RegExp(`\\b(${JS_IDENT}(?<!Params)(?<!Header)(?<!MediaType)Schema)\\b`, 'g'),
    key: 'schemas',
  },
  { pattern: new RegExp(`\\b(${JS_IDENT}ParamsSchema)\\b`, 'g'), key: 'parameters' },
  { pattern: new RegExp(`\\b(${JS_IDENT}SecurityScheme)\\b`, 'g'), key: 'securitySchemes' },
  { pattern: new RegExp(`\\b(${JS_IDENT}RequestBody)\\b`, 'g'), key: 'requestBodies' },
  { pattern: new RegExp(`\\b(${JS_IDENT}Response)\\b`, 'g'), key: 'responses' },
  { pattern: new RegExp(`\\b(${JS_IDENT}HeaderSchema)\\b`, 'g'), key: 'headers' },
  { pattern: new RegExp(`\\b(${JS_IDENT}Example)\\b`, 'g'), key: 'examples' },
  { pattern: new RegExp(`\\b(${JS_IDENT}Link)\\b`, 'g'), key: 'links' },
  { pattern: new RegExp(`\\b(${JS_IDENT}Callback)\\b`, 'g'), key: 'callbacks' },
  { pattern: new RegExp(`\\b(${JS_IDENT}MediaTypeSchema)\\b`, 'g'), key: 'mediaTypes' },
]

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
  return IMPORT_PATTERNS.flatMap(({ pattern, key }) => {
    const importPath = componentPaths[key]
    if (!importPath) return []
    const tokens = [...new Set(Array.from(code.matchAll(pattern), (m) => m[1]))]
      .filter((t) => Boolean(t) && !defined.has(t))
      .toSorted()
    return tokens.length > 0 ? [renderNamedImport(tokens, importPath)] : []
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
  // typebox path/query uses an inline `validator(...)` from hono/validator
  // wrapping `Value.Convert` + `Value.Check`. Detect with a word boundary so
  // we don't false-match `tbValidator(`.
  const usesInlineValidator = /\bvalidator\(/.test(code)
  const usesValueModule = code.includes('Value.Convert(') || code.includes('Value.Check(')

  return [
    "import{Hono}from'hono'",
    ...(code.includes(`${svConfig.validatorFn}(`) ? [svConfig.validatorImport] : []),
    ...(schemaLib === 'typebox' && usesInlineValidator
      ? ["import{validator}from'hono/validator'"]
      : []),
    ...(schemaLib === 'typebox' && usesValueModule
      ? ["import{Value}from'typebox/value'"]
      : []),
    ...(code.includes(SCHEMA_LIB_PATTERNS[schemaLib]) ? [config.schemaImport] : []),
    ...collectComponentImportLines(code, componentPaths, defined),
  ] as const
}
