import type { Components } from '../../openapi/index.js'
import { toPascalCase } from '../../utils/index.js'

/**
 * Generates callback component code from OpenAPI components.callbacks.
 * Callbacks contain PathItem structures exported as const objects.
 */
export function makeCallbacksCode(
  callbacks: NonNullable<Components['callbacks']>,
  readonly?: boolean,
): string {
  return Object.entries(callbacks)
    .filter(([, callback]) => !('$ref' in callback && callback.$ref))
    .map(([name, callback]) => {
      const varName = `${toPascalCase(name)}Callback`
      const suffix = readonly ? ' as const' : ''
      return `export const ${varName} = ${JSON.stringify(callback)}${suffix}`
    })
    .join('\n\n')
}
