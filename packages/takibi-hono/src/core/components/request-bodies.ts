import { schemaToInlineExpression } from '../../generator/inline-schema.js'
import type { Components } from '../../openapi/index.js'
import {
  resolveRef, toPascalCase, } from '../../utils/index.js'

/**
 * Generates request body component code from OpenAPI components.requestBodies.
 */
export async function makeRequestBodiesCode(
  requestBodies: NonNullable<Components['requestBodies']>,
  schemaLib: 'zod' | 'valibot' | 'typebox' | 'arktype' | 'effect',
  readonly?: boolean,
): Promise<string> {
  return Object.entries(requestBodies)
    .filter(([, body]) => !('$ref' in body && body.$ref))
    .map(([name, body]) => {
      const parts = [
        ...('description' in body && body.description
          ? [`description:${JSON.stringify(body.description)}`]
          : []),
        ...(body.required === true ? [`required:true`] : []),
        ...('content' in body && body.content
          ? (() => {
              const contentEntries = Object.entries(body.content)
                .filter(
                  (
                    entry,
                  ): entry is [
                    string,
                    { readonly schema: import('../../openapi/index.js').Schema },
                  ] => entry[1] != null && 'schema' in entry[1] && entry[1].schema != null,
                )
                .map(([mediaType, media]) => {
                  const schemaExpr = media.schema.$ref
                    ? resolveRef(media.schema.$ref)
                    : schemaToInlineExpression(media.schema, schemaLib)
                  return `'${mediaType}':{schema:${schemaExpr}}`
                })
              return contentEntries.length > 0 ? [`content:{${contentEntries.join(',')}}`] : []
            })()
          : []),
      ]

      const varName = `${toPascalCase(name)}RequestBody`
      const suffix = readonly ? ' as const' : ''
      return `export const ${varName} = {${parts.join(',')}}${suffix}`
    })
    .join('\n\n')
}
