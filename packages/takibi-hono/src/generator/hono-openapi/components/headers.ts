import { schemaToInlineExpression } from '../../../helper/inline-schema.js'
import { makeOptional } from '../../../helper/openapi.js'
import { makeTypeExport } from '../../../helper/type-export.js'
import type { Components } from '../../../openapi/index.js'
import { resolveRef, toPascalCase } from '../../../utils/index.js'

/**
 * Generates header component code from OpenAPI components.headers.
 * Each header is exported as a validation schema expression. When
 * `exportTypes` is true, an additional `export type X = ...` is emitted.
 */
export async function makeHeadersCode(
  headers: NonNullable<Components['headers']>,
  schemaLib: 'zod' | 'valibot' | 'typebox' | 'arktype' | 'effect',
  exportTypes = false,
): Promise<string> {
  return Object.entries(headers)
    .map(([name, header]) => {
      const pascal = toPascalCase(name)
      const varName = `${pascal}HeaderSchema`
      const typeName = `${pascal}Header`

      if ('$ref' in header && header.$ref) {
        const refName = resolveRef(header.$ref)
        return `export const ${varName}=${refName}`
      }

      if ('schema' in header && header.schema) {
        const schemaExpr = schemaToInlineExpression(header.schema, schemaLib)
        const optionalExpr =
          header.required !== true ? makeOptional(schemaExpr, schemaLib) : schemaExpr
        const constDecl = `export const ${varName}=${optionalExpr}`
        return exportTypes
          ? `${constDecl}\n${makeTypeExport(varName, typeName, schemaLib)}`
          : constDecl
      }

      return null
    })
    .filter((decl): decl is string => decl !== null)
    .join('\n\n')
}
