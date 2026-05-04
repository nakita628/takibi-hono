import type { Schema } from '../openapi/index.js'
import { toPascalCase } from '../utils/index.js'

/**
 * Strips import lines from schema-to-library output, returning only declarations.
 */
function stripImportLines(code: string) {
  return code
    .split('\n')
    .filter((line) => !line.startsWith('import '))
    .join('\n')
    .trim()
}

/**
 * Convert an OpenAPI Schema to a JSONSchema-shaped record for schema-to-library.
 *
 * The only adjustment is appending the `Schema` suffix to `title` so the
 * generated `export const` matches OpenAPI component naming. Metadata fields
 * (`description`, `example`, `examples`, `deprecated`, etc.) are passed through
 * — schema-to-library 0.2.0 emits the appropriate library-specific metadata
 * call (`.meta`, `v.pipe(...,v.description,v.metadata)`, `Type.Object(...,opts)`,
 * `.describe`, `.annotations`) for each library.
 */
function toJSONSchema(name: string, schema: Schema) {
  return { ...schema, title: `${name}Schema` } as const
}

/**
 * Post-processes schema-to-library output:
 * - Renames type alias `${varName}` / `${varName}Output` / `${varName}Encoded`
 *   to the bare `${pascalName}` to match OpenAPI component naming.
 * - Drops valibot's `${varName}Input` (we keep only Output).
 * - Nests multi-arg `z.intersection` / `Schema.extend` calls into 2-arg form.
 */
function postProcess(
  code: string,
  name: string,
  schemaLib: 'zod' | 'valibot' | 'typebox' | 'arktype' | 'effect',
) {
  const pascalName = toPascalCase(name)
  const varName = `${pascalName}Schema`
  const transforms: readonly ((s: string) => string)[] = [
    // Effect emits `${varName}Encoded`; other libs emit `${varName}` directly.
    schemaLib === 'effect'
      ? (s) => s
      : (s) =>
          s.replace(new RegExp(`export\\s+type\\s+${varName}\\s*=`), `export type ${pascalName} =`),
    // Valibot: drop `${varName}Input`, rename `${varName}Output` → `${pascalName}`.
    (s) => s.replace(new RegExp(`\\n*export\\s+type\\s+${varName}Input\\s*=\\s*[^\\n]+\\n?`), ''),
    (s) =>
      s.replace(
        new RegExp(`export\\s+type\\s+${varName}Output\\s*=`),
        `export type ${pascalName} =`,
      ),
    // Effect: rename `${varName}Encoded` → `${pascalName}`.
    (s) =>
      s.replace(
        new RegExp(`export\\s+type\\s+${varName}Encoded\\s*=`),
        `export type ${pascalName} =`,
      ),
    // Nest multi-arg calls into 2-arg form.
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
) {
  const jsonSchema = toJSONSchema(name, schema)
  const code = await makeSchemaCode(jsonSchema, schemaLib, exportType, readonly)
  return postProcess(stripImportLines(code), name, schemaLib)
}

async function makeSchemaCode(
  jsonSchema: Record<string, unknown>,
  schemaLib: 'zod' | 'valibot' | 'typebox' | 'arktype' | 'effect',
  exportType: boolean,
  readonly: boolean,
) {
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
