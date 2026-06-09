import type { ParamIn } from 'schema-to-library'
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
  // effect emits Encoded only and reuses `{varName}Schema` as the value-side type alias name;
  // skip the bare `{varName}Schema` rename for effect so we don't touch the value-side alias.
  const base =
    schemaLib === 'effect'
      ? code
      : code.replace(new RegExp(`export\\s+type\\s+${varName}\\s*=`), `export type ${pascalName} =`)
  // valibot emits both Input and Output; drop Input and rename Output / Encoded to the bare type name.
  const renamed = base
    .replace(new RegExp(`\\n*export\\s+type\\s+${varName}Input\\s*=\\s*[^\\n]+\\n?`), '')
    .replace(new RegExp(`export\\s+type\\s+${varName}Output\\s*=`), `export type ${pascalName} =`)
    .replace(new RegExp(`export\\s+type\\s+${varName}Encoded\\s*=`), `export type ${pascalName} =`)
  return renamed
}

/**
 * The arktype `scope({...})` first argument for a circular SCC group. arktype
 * cannot resolve cross-schema references between standalone `type(...)` calls; a
 * cyclic group must share one `scope`, where members reference each other by their
 * scope key (a DSL keyword). Built by handing the group to schema-to-library as
 * `definitions` (its scope path) and extracting the produced `scope({...})`.
 */
export function makeArktypeScopeBody(
  group: readonly string[],
  schemas: { readonly [k: string]: Schema },
  readonly: boolean,
): string {
  const root = group[0]
  if (root === undefined) return ''
  // Keys = PascalCase names (matching how `$ref` tails resolve in scope mode);
  // `title` makes the root one of those definitions so it is not duplicated as a
  // stray `Schema` entry.
  const definitions = Object.fromEntries(group.map((name) => [toPascalCase(name), schemas[name]]))
  const code = schemaToArktype(
    { ...schemas[root], title: toPascalCase(root), definitions },
    { readonly, exportType: false },
  )
  return code.match(/scope\((\{[\s\S]*\})\)\.export\(\)/)?.[1] ?? ''
}

export function extractSchemaExports(
  name: string,
  schema: Schema,
  schemaLib: 'zod' | 'valibot' | 'typebox' | 'arktype' | 'effect',
  exportType = true,
  readonly = false,
  paramIn?: ParamIn,
) {
  const jsonSchema = toJSONSchema(name, schema)
  const code = makeSchemaCode(jsonSchema, schemaLib, exportType, readonly, paramIn)
  return postProcess(stripImportLines(code), name, schemaLib)
}

function makeSchemaCode(
  jsonSchema: Record<string, unknown>,
  schemaLib: 'zod' | 'valibot' | 'typebox' | 'arktype' | 'effect',
  exportType: boolean,
  readonly: boolean,
  paramIn: ParamIn | undefined,
) {
  const opts = { exportType, openapi: true, readonly, ...(paramIn !== undefined && { paramIn }) }
  switch (schemaLib) {
    case 'zod':
      return schemaToZod(jsonSchema, opts)
    case 'valibot':
      return schemaToValibot(jsonSchema, opts)
    case 'typebox':
      return schemaToTypebox(jsonSchema, opts)
    case 'arktype':
      return schemaToArktype(jsonSchema, opts)
    case 'effect':
      return schemaToEffect(jsonSchema, opts)
  }
}
