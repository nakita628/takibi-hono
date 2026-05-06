import { schemaToInlineExpression } from '../../../helper/inline-schema.js'
import type { Components } from '../../../openapi/index.js'
import { resolveRef, toPascalCase } from '../../../utils/index.js'

/**
 * Generates media type component code from OpenAPI components.mediaTypes.
 * Each media type is exported as a validation schema expression.
 *
 * @example
 * ```ts
 * // Input
 * { JsonMedia: { schema: { type: 'object', properties: { id: { type: 'integer' } } } } }
 *
 * // Output (zod)
 * export const JsonMediaMediaTypeSchema = z.object({ id: z.int() })
 * ```
 */
export function makeMediaTypesCode(
  mediaTypes: NonNullable<Components['mediaTypes']>,
  schemaLib: 'zod' | 'valibot' | 'typebox' | 'arktype' | 'effect',
) {
  return Object.entries(mediaTypes)
    .map(([name, media]) => {
      const varName = `${toPascalCase(name)}MediaTypeSchema`
      // Reference: emit alias to the resolved component name
      if ('$ref' in media && media.$ref) {
        return `export const ${varName}=${resolveRef(media.$ref)}`
      }
      // Inline media: emit the schema expression
      if ('schema' in media && media.schema) {
        const schemaExpr = media.schema.$ref
          ? resolveRef(media.schema.$ref)
          : schemaToInlineExpression(media.schema, schemaLib)
        return `export const ${varName}=${schemaExpr}`
      }
      return null
    })
    .filter((decl): decl is string => decl !== null)
    .join('\n\n')
}
