import { schemaToInlineExpression } from '../../../helper/inline-schema.js'
import { makeTypeExport } from '../../../helper/type-export.js'
import type { Components } from '../../../openapi/index.js'
import { resolveRef, toPascalCase } from '../../../utils/index.js'

export function makeMediaTypesCode(
  mediaTypes: NonNullable<Components['mediaTypes']>,
  schemaLib: 'zod' | 'valibot' | 'typebox' | 'arktype' | 'effect',
  exportTypes = false,
) {
  return Object.entries(mediaTypes)
    .map(([name, media]) => {
      const pascal = toPascalCase(name)
      const varName = `${pascal}MediaTypeSchema`
      const typeName = `${pascal}MediaType`
      if ('$ref' in media && media.$ref) {
        return `export const ${varName}=${resolveRef(media.$ref)}`
      }
      if ('schema' in media && media.schema) {
        const schemaExpr = media.schema.$ref
          ? resolveRef(media.schema.$ref)
          : schemaToInlineExpression(media.schema, schemaLib)
        const constDecl = `export const ${varName}=${schemaExpr}`
        return exportTypes
          ? `${constDecl}\n${makeTypeExport(varName, typeName, schemaLib)}`
          : constDecl
      }
      return null
    })
    .filter((decl): decl is string => decl !== null)
    .join('\n\n')
}
