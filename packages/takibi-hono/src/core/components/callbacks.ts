import type { Components } from '../../openapi/index.js'
import { toPascalCase } from '../../utils/index.js'

export function makeCallbacksCode(
  callbacks: NonNullable<Components['callbacks']>,
  readonly?: boolean,
) {
  return Object.entries(callbacks)
    .filter(([, callback]) => !('$ref' in callback && callback.$ref))
    .map(([name, callback]) => {
      const varName = `${toPascalCase(name)}Callback`
      const suffix = readonly ? ' as const' : ''
      return `export const ${varName} = ${JSON.stringify(callback)}${suffix}`
    })
    .join('\n\n')
}
