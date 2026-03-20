import type { Components } from '../../openapi/index.js'
import { toPascalCase } from '../../utils/index.js'

/**
 * Generates example component code from OpenAPI components.examples.
 * Examples are pure data — no schema library dependency.
 */
export function makeExamplesCode(
  examples: NonNullable<Components['examples']>,
  readonly?: boolean,
): string {
  return Object.entries(examples)
    .filter(([, example]) => !('$ref' in example && example.$ref))
    .map(([name, example]) => {
      const parts = [
        ...('summary' in example && example.summary
          ? [`summary:${JSON.stringify(example.summary)}`]
          : []),
        ...('description' in example && example.description
          ? [`description:${JSON.stringify(example.description)}`]
          : []),
        ...('value' in example && example.value !== undefined
          ? [`value:${JSON.stringify(example.value)}`]
          : []),
        ...('externalValue' in example && example.externalValue
          ? [`externalValue:${JSON.stringify(example.externalValue)}`]
          : []),
      ]

      const varName = `${toPascalCase(name)}Example`
      const suffix = readonly ? ' as const' : ''
      return `export const ${varName} = {${parts.join(',')}}${suffix}`
    })
    .join('\n\n')
}
