import { schemaToArktype } from 'schema-to-library/arktype'
import { schemaToEffect } from 'schema-to-library/effect'
import { schemaToTypebox } from 'schema-to-library/typebox'
import { schemaToValibot } from 'schema-to-library/valibot'
import { schemaToZod } from 'schema-to-library/zod'

import type { Schema } from '../openapi/index.js'
import { toPascalCase } from '../utils/index.js'

function stripImportLines(code: string) {
  return code
    .split('\n')
    .filter((line) => !line.startsWith('import '))
    .join('\n')
    .trim()
}

/** `${name}Schema` title forces schema-to-library to emit `export const ${name}Schema = ...` matching OpenAPI component naming. */
function toJSONSchema(name: string, schema: Schema) {
  return { ...schema, title: `${name}Schema` } as const
}

function postProcess(
  code: string,
  name: string,
  schemaLib: 'zod' | 'valibot' | 'typebox' | 'arktype' | 'effect',
) {
  const pascalName = toPascalCase(name)
  const varName = `${pascalName}Schema`
  const transforms: readonly ((s: string) => string)[] = [
    schemaLib === 'effect'
      ? (s) => s
      : (s) =>
          s.replace(new RegExp(`export\\s+type\\s+${varName}\\s*=`), `export type ${pascalName} =`),
    // valibot emits both Input and Output; we keep only Output.
    (s) => s.replace(new RegExp(`\\n*export\\s+type\\s+${varName}Input\\s*=\\s*[^\\n]+\\n?`), ''),
    (s) =>
      s.replace(
        new RegExp(`export\\s+type\\s+${varName}Output\\s*=`),
        `export type ${pascalName} =`,
      ),
    (s) =>
      s.replace(
        new RegExp(`export\\s+type\\s+${varName}Encoded\\s*=`),
        `export type ${pascalName} =`,
      ),
    schemaLib === 'zod' ? (s) => fixMultiArgCall(s, 'z.intersection') : (s) => s,
    schemaLib === 'effect' ? (s) => fixMultiArgCall(s, 'Schema.extend') : (s) => s,
  ]

  return transforms.reduce((result, fn) => fn(result), code)
}

/** fn(A,B,C) → fn(fn(A,B),C) — `z.intersection` and `Schema.extend` only accept 2 args. */
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

export function extractSchemaExports(
  name: string,
  schema: Schema,
  schemaLib: 'zod' | 'valibot' | 'typebox' | 'arktype' | 'effect',
  exportType = true,
  readonly = false,
) {
  const jsonSchema = toJSONSchema(name, schema)
  const code = makeSchemaCode(jsonSchema, schemaLib, exportType, readonly)
  return postProcess(stripImportLines(code), name, schemaLib)
}

function makeSchemaCode(
  jsonSchema: Record<string, unknown>,
  schemaLib: 'zod' | 'valibot' | 'typebox' | 'arktype' | 'effect',
  exportType: boolean,
  readonly: boolean,
) {
  switch (schemaLib) {
    case 'zod':
      return schemaToZod(jsonSchema, { exportType, openapi: true, readonly })
    case 'valibot':
      return schemaToValibot(jsonSchema, { exportType, openapi: true, readonly })
    case 'typebox':
      return schemaToTypebox(jsonSchema, { exportType, openapi: true, readonly })
    case 'arktype':
      return schemaToArktype(jsonSchema, { exportType, openapi: true, readonly })
    case 'effect':
      return schemaToEffect(jsonSchema, { exportType, openapi: true, readonly })
  }
}
