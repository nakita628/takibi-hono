import { serializeWithRefs } from '../../../helper/inline-refs.js'
import type { Components } from '../../../openapi/index.js'
import { toPascalCase } from '../../../utils/index.js'

export function makeCallbacksCode(
  callbacks: NonNullable<Components['callbacks']>,
  readonly?: boolean,
) {
  return Object.entries(callbacks)
    .filter(([, callback]) => !('$ref' in callback && callback.$ref))
    .map(([name, callback]) => {
      const varName = `${toPascalCase(name)}Callback`
      const suffix = readonly ? ' as const' : ''
      return `export const ${varName} = ${serializeWithRefs(callback)}${suffix}`
    })
    .join('\n\n')
}
