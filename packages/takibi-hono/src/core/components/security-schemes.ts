import type { Components } from '../../openapi/index.js'
import { toPascalCase } from '../../utils/index.js'

/**
 * Generates security scheme component code from OpenAPI components.securitySchemes.
 * Security schemes are pure data — no schema library dependency.
 */
export function makeSecuritySchemesCode(
  securitySchemes: NonNullable<Components['securitySchemes']>,
  readonly?: boolean,
): string {
  return Object.entries(securitySchemes)
    .filter(([, scheme]) => !('$ref' in scheme && scheme.$ref))
    .map(([name, scheme]) => {
      const parts = [
        ...('type' in scheme && scheme.type ? [`type:${JSON.stringify(scheme.type)}`] : []),
        ...('description' in scheme && scheme.description
          ? [`description:${JSON.stringify(scheme.description)}`]
          : []),
        ...('name' in scheme && scheme.name ? [`name:${JSON.stringify(scheme.name)}`] : []),
        ...('in' in scheme && scheme.in ? [`in:${JSON.stringify(scheme.in)}`] : []),
        ...('scheme' in scheme && scheme.scheme ? [`scheme:${JSON.stringify(scheme.scheme)}`] : []),
        ...('bearerFormat' in scheme && scheme.bearerFormat
          ? [`bearerFormat:${JSON.stringify(scheme.bearerFormat)}`]
          : []),
        ...('flows' in scheme && scheme.flows ? [`flows:${JSON.stringify(scheme.flows)}`] : []),
        ...('openIdConnectUrl' in scheme && scheme.openIdConnectUrl
          ? [`openIdConnectUrl:${JSON.stringify(scheme.openIdConnectUrl)}`]
          : []),
      ]

      const varName = `${toPascalCase(name)}SecurityScheme`
      const suffix = readonly ? ' as const' : ''
      return `export const ${varName} = {${parts.join(',')}}${suffix}`
    })
    .join('\n\n')
}
