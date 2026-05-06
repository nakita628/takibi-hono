import { serializeWithRefs } from '../../../helper/inline-refs.js'
import type { Components } from '../../../openapi/index.js'
import { toPascalCase } from '../../../utils/index.js'

/**
 * Generates path item component code from OpenAPI components.pathItems.
 * PathItems are exported as const objects for reuse.
 */
export function makePathItemsCode(
  pathItems: NonNullable<Components['pathItems']>,
  readonly?: boolean,
): string {
  return Object.entries(pathItems)
    .map(([name, pathItem]) => {
      const varName = `${toPascalCase(name)}PathItem`
      const suffix = readonly ? ' as const' : ''
      return `export const ${varName} = ${serializeWithRefs(pathItem)}${suffix}`
    })
    .join('\n\n')
}
