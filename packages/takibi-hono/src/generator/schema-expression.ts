import type { Schema } from '../openapi/index.js'
import { toPascalCase } from '../utils/index.js'

/**
 * Strips import lines from schema-to-library output, returning only declarations.
 */
function stripImportLines(code: string): string {
  return code
    .split('\n')
    .filter((line) => !line.startsWith('import '))
    .join('\n')
    .trim()
}

/**
 * Converts an OpenAPI Schema to a plain object compatible with schema-to-library's JSONSchema.
 * Removes OpenAPI-specific properties that conflict with JSONSchema types.
 * Appends 'Schema' suffix to match OpenAPI component naming convention.
 */
function toJSONSchema(name: string, schema: Schema): Record<string, unknown> {
  const { examples: _examples, example: _example, description: _description, ...rest } = schema
  return { title: `${name}Schema`, ...rest }
}

type SchemaMeta = {
  readonly description?: string | undefined
  readonly example?: unknown
}

/**
 * Appends library-specific metadata to the schema const declaration.
 *
 * zod:     .describe("desc")
 * valibot: wraps with v.pipe(schema, v.description("desc"), v.examples([...]))
 * typebox: options already in constructor, skip
 * arktype: .describe("desc")
 * effect:  .annotations({ description: "desc", examples: [...] })
 */
function appendMeta(
  expr: string,
  schemaLib: 'zod' | 'valibot' | 'typebox' | 'arktype' | 'effect',
  meta: SchemaMeta,
): string {
  const { description, example } = meta

  switch (schemaLib) {
    case 'zod':
      return description ? `${expr}.describe(${JSON.stringify(description)})` : expr

    case 'valibot': {
      const pipes = [
        ...(description ? [`v.description(${JSON.stringify(description)})`] : []),
        ...(example !== undefined ? [`v.examples([${JSON.stringify(example)}])`] : []),
      ]
      return pipes.length === 0 ? expr : `v.pipe(${expr},${pipes.join(',')})`
    }

    case 'typebox': {
      const opts = [
        ...(description ? [`description:${JSON.stringify(description)}`] : []),
        ...(example !== undefined ? [`examples:[${JSON.stringify(example)}]`] : []),
      ]
      if (opts.length === 0) return expr
      // Inject options as 2nd arg: Type.Object({...}) → Type.Object({...},{description:...})
      const lastParen = expr.lastIndexOf(')')
      if (lastParen === -1) return expr
      return `${expr.slice(0, lastParen)},{${opts.join(',')}})`
    }

    case 'arktype':
      return description ? `${expr}.describe(${JSON.stringify(description)})` : expr

    case 'effect': {
      const annParts = [
        ...(description ? [`description:${JSON.stringify(description)}`] : []),
        ...(example !== undefined ? [`examples:[${JSON.stringify(example)}]`] : []),
      ]
      return annParts.length === 0 ? expr : `${expr}.annotations({${annParts.join(',')}})`
    }
  }
}

/**
 * Post-processes schema-to-library output:
 * 1. Appends library-specific metadata (description, examples)
 * 2. Fixes type export names to remove Schema suffix
 */
function postProcess(
  code: string,
  name: string,
  schemaLib: 'zod' | 'valibot' | 'typebox' | 'arktype' | 'effect',
  meta: SchemaMeta,
): string {
  const pascalName = toPascalCase(name)
  const varName = `${pascalName}Schema`

  const transforms: readonly ((s: string) => string)[] = [
    // Append metadata to the const declaration
    meta.description || meta.example !== undefined
      ? (s) =>
          s.replace(
            new RegExp(`(export\\s+const\\s+${varName}\\s*=\\s*)(.+)`),
            (_, prefix, expr) => `${prefix}${appendMeta(expr, schemaLib, meta)}`,
          )
      : (s) => s,
    // Fix type export: `export type PetSchema = ...` → `export type Pet = ...`
    // For effect: remove .Type line entirely (we only keep .Encoded)
    schemaLib === 'effect'
      ? (s) => s.replace(new RegExp(`\\n*export\\s+type\\s+${varName}\\s*=[^\\n]*`), '')
      : (s) =>
          s.replace(new RegExp(`export\\s+type\\s+${varName}\\s*=`), `export type ${pascalName} =`),
    // Handle valibot: remove Input type (if present), keep only Output type
    (s) => s.replace(new RegExp(`\\n*export\\s+type\\s+${varName}Input\\s*=\\s*[^\\n]+\\n?`), ''),
    (s) =>
      s.replace(
        new RegExp(`export\\s+type\\s+${varName}Output\\s*=`),
        `export type ${pascalName} =`,
      ),
    // Handle effect: `export type PetSchemaEncoded = ...` → `export type Pet = ...`
    (s) =>
      s.replace(
        new RegExp(`export\\s+type\\s+${varName}Encoded\\s*=`),
        `export type ${pascalName} =`,
      ),
    // Fix multi-arg z.intersection/Schema.extend
    schemaLib === 'zod' ? (s) => fixMultiArgCall(s, 'z.intersection') : (s) => s,
    schemaLib === 'effect' ? (s) => fixMultiArgCall(s, 'Schema.extend') : (s) => s,
  ]

  return transforms.reduce((result, fn) => fn(result), code)
}

/**
 * Fixes calls with 3+ arguments by nesting into 2-arg calls.
 * e.g., fn(A,B,C) → fn(fn(A,B),C)
 */
function fixMultiArgCall(code: string, fnName: string): string {
  const escaped = fnName.replace(/\./g, '\\.')
  const pattern = new RegExp(`${escaped}\\(`, 'g')
  const matches = Array.from(code.matchAll(pattern), (m) => m.index!).reverse()

  return matches.reduce((result, start) => {
    const argsStart = start + fnName.length + 1
    const args = extractTopLevelArgs(result, argsStart)
    if (args.length <= 2) return result

    const nested = args
      .slice(2)
      .reduce((acc, arg) => `${fnName}(${acc},${arg})`, `${fnName}(${args[0]},${args[1]})`)

    const closeIdx = findClosingParen(result, argsStart - 1)
    if (closeIdx === -1) return result

    return result.slice(0, start) + nested + result.slice(closeIdx + 1)
  }, code)
}

function extractTopLevelArgs(code: string, startIdx: number): string[] {
  const args: string[] = []
  let depth = 0
  let current = ''

  for (let i = startIdx; i < code.length; i++) {
    const ch = code[i]
    if (ch === '(' || ch === '[' || ch === '{') {
      depth++
      current += ch
    } else if (ch === ')' || ch === ']' || ch === '}') {
      if (depth === 0) {
        if (current.trim()) args.push(current.trim())
        break
      }
      depth--
      current += ch
    } else if (ch === ',' && depth === 0) {
      if (current.trim()) args.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }

  return args
}

function findClosingParen(code: string, openIdx: number): number {
  let depth = 0
  for (let i = openIdx; i < code.length; i++) {
    if (code[i] === '(') depth++
    else if (code[i] === ')') {
      depth--
      if (depth === 0) return i
    }
  }
  return -1
}

/**
 * Extracts schema export declarations from a schema-to-library generated output.
 */
export async function extractSchemaExports(
  name: string,
  schema: Schema,
  schemaLib: 'zod' | 'valibot' | 'typebox' | 'arktype' | 'effect',
  exportType = true,
  readonly = false,
): Promise<string> {
  const jsonSchema = toJSONSchema(name, schema)

  const code = await makeSchemaCode(jsonSchema, schemaLib, exportType, readonly)
  const stripped = stripImportLines(code)
  return postProcess(stripped, name, schemaLib, {
    description: schema.description,
    example: schema.example,
  })
}

async function makeSchemaCode(
  jsonSchema: Record<string, unknown>,
  schemaLib: 'zod' | 'valibot' | 'typebox' | 'arktype' | 'effect',
  exportType: boolean,
  readonly: boolean,
): Promise<string> {
  switch (schemaLib) {
    case 'zod': {
      const { schemaToZod } = await import('schema-to-library/zod')
      return schemaToZod(jsonSchema, { exportType, openapi: true, readonly })
    }
    case 'valibot': {
      const { schemaToValibot } = await import('schema-to-library/valibot')
      return schemaToValibot(jsonSchema, { exportType, openapi: true, readonly })
    }
    case 'typebox': {
      const { schemaToTypebox } = await import('schema-to-library/typebox')
      return schemaToTypebox(jsonSchema, { exportType, openapi: true, readonly })
    }
    case 'arktype': {
      const { schemaToArktype } = await import('schema-to-library/arktype')
      return schemaToArktype(jsonSchema, { exportType, openapi: true, readonly })
    }
    case 'effect': {
      const { schemaToEffect } = await import('schema-to-library/effect')
      return schemaToEffect(jsonSchema, { exportType, openapi: true, readonly })
    }
  }
}
