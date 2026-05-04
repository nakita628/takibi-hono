import { schemaToInlineExpression } from '../../generator/inline-schema.js'
import { makeOptional } from '../../helper/openapi.js'
import type { Components } from '../../openapi/index.js'
import {
  resolveRef, toPascalCase, } from '../../utils/index.js'

/**
 * Generates header component code from OpenAPI components.headers.
 * Each header is exported as a validation schema expression.
 */
export async function makeHeadersCode(
  headers: NonNullable<Components['headers']>,
  schemaLib: 'zod' | 'valibot' | 'typebox' | 'arktype' | 'effect',
): Promise<string> {
  return Object.entries(headers)
    .map(([name, header]) => {
      if ('$ref' in header && header.$ref) {
        const refName = resolveRef(header.$ref)
        const varName = `${toPascalCase(name)}HeaderSchema`
        return `export const ${varName}=${refName}`
      }

      const varName = `${toPascalCase(name)}HeaderSchema`

      if ('schema' in header && header.schema) {
        const schemaExpr = schemaToInlineExpression(header.schema, schemaLib)
        const optionalExpr =
          header.required !== true ? makeOptional(schemaExpr, schemaLib) : schemaExpr
        return `export const ${varName}=${optionalExpr}`
      }

      return null
    })
    .filter((decl): decl is string => decl !== null)
    .join('\n\n')
}
