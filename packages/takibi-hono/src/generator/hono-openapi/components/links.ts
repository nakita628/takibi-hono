import type { Components } from '../../../openapi/index.js'
import { toPascalCase } from '../../../utils/index.js'

/**
 * Generates link component code from OpenAPI components.links.
 * Links are pure data — no schema library dependency.
 */
export function makeLinksCode(links: NonNullable<Components['links']>, readonly?: boolean): string {
  return Object.entries(links)
    .filter(([, link]) => !('$ref' in link && link.$ref))
    .map(([name, link]) => {
      const parts = [
        ...('operationRef' in link && link.operationRef
          ? [`operationRef:${JSON.stringify(link.operationRef)}`]
          : []),
        ...('operationId' in link && link.operationId
          ? [`operationId:${JSON.stringify(link.operationId)}`]
          : []),
        ...('parameters' in link && link.parameters
          ? [`parameters:${JSON.stringify(link.parameters)}`]
          : []),
        ...('requestBody' in link && link.requestBody !== undefined
          ? [`requestBody:${JSON.stringify(link.requestBody)}`]
          : []),
        ...('description' in link && link.description
          ? [`description:${JSON.stringify(link.description)}`]
          : []),
        ...('server' in link && link.server ? [`server:${JSON.stringify(link.server)}`] : []),
      ]

      const varName = `${toPascalCase(name)}Link`
      const suffix = readonly ? ' as const' : ''
      return `export const ${varName} = {${parts.join(',')}}${suffix}`
    })
    .join('\n\n')
}
