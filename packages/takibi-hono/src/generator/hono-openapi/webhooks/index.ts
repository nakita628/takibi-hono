import { makeImports } from '../../../helper/imports.js'
import { collectWebhookOperations } from '../../../helper/operations.js'
import { makeValidators } from '../../../helper/validator.js'
import type { OpenAPI } from '../../../openapi/index.js'
import { emitRouteCall } from '../../../utils/index.js'
import { makeDescribeRoute } from '../routes/index.js'

export function makeWebhooksCode(
  openapi: OpenAPI,
  schemaLib: 'zod' | 'valibot' | 'typebox' | 'arktype' | 'effect',
  options?: {
    readonly componentPaths?: { readonly [k: string]: string | undefined } | undefined
  },
) {
  const webhookOperations = collectWebhookOperations(openapi)
  if (webhookOperations.length === 0) return undefined
  const components = openapi.components
  const routeLines = webhookOperations.map(
    ({ webhookName, method, operation, pathItemParameters }) => {
      const middlewares = [
        makeDescribeRoute(operation, schemaLib),
        ...makeValidators(operation, pathItemParameters, schemaLib, components),
        '(c)=>{}',
      ]
      return emitRouteCall(method, [`'/${webhookName}'`, ...middlewares])
    },
  )
  const handlerCode = `export const webhooksHandler=new Hono()${routeLines.join('')}`
  const componentPaths = options?.componentPaths ?? { schemas: '../components' }
  const imports = makeImports(handlerCode, schemaLib, componentPaths)
  return [...imports, '', handlerCode].join('\n')
}
