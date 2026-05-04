import { makeContent, makeHeader } from '../../helper/openapi.js'
import type { Components } from '../../openapi/index.js'
import {
  toPascalCase, } from '../../utils/index.js'

export async function makeResponsesCode(
  responses: NonNullable<Components['responses']>,
  schemaLib: 'zod' | 'valibot' | 'typebox' | 'arktype' | 'effect',
  readonly?: boolean,
): Promise<string> {
  const asConst = readonly ? ' as const' : ''

  return Object.entries(responses)
    .filter(([, response]) => !('$ref' in response && response.$ref))
    .map(([name, response]) => {
      const varName = `${toPascalCase(name)}Response`
      const parts = [
        ...(response.description ? [`description:${JSON.stringify(response.description)}`] : []),
        ...(response.content
          ? (() => {
              const entries = makeContent(response.content, schemaLib)
              return entries.length > 0 ? [`content:{${entries.join(',')}}`] : []
            })()
          : []),
        ...(response.headers
          ? (() => {
              const entries = Object.entries(response.headers).map(([headerName, header]) =>
                makeHeader(headerName, header),
              )
              return entries.length > 0 ? [`headers:{${entries.join(',')}}`] : []
            })()
          : []),
      ]
      return `export const ${varName} = {${parts.join(',')}}${asConst}`
    })
    .join('\n\n')
}
