import { isHttpMethod, isOperation, isParameter } from '../../../guard/index.js'
import { makeDescribeRoute } from '../../../helper/describe-route.js'
import { makeImports } from '../../../helper/imports.js'
import { HANDLER_STUB } from '../../../helper/response.js'
import { makeValidators } from '../../../helper/validator.js'
import type { OpenAPI, Operation, Parameter } from '../../../openapi/index.js'

export function makeWebhooksCode(
  openapi: OpenAPI,
  schemaLib: 'zod' | 'valibot' | 'typebox' | 'arktype' | 'effect',
  options?: {
    readonly componentPaths?: { readonly [k: string]: string | undefined } | undefined
  },
) {
  const collectWebhookOperations = (
    openapi: OpenAPI,
  ): readonly {
    readonly webhookName: string
    readonly method: string
    readonly operation: Operation
    readonly pathItemParameters?: readonly Parameter[] | undefined
  }[] => {
    if (!openapi.webhooks) return [] as const
    return Object.entries(openapi.webhooks).flatMap(([webhookName, pathItem]) => {
      const pathItemParameters: readonly Parameter[] | undefined = Array.isArray(
        pathItem.parameters,
      )
        ? pathItem.parameters.filter(isParameter)
        : undefined
      return Object.entries(pathItem)
        .filter(
          (entry): entry is [string, Operation] => isHttpMethod(entry[0]) && isOperation(entry[1]),
        )
        .map(([method, operation]) => ({ webhookName, method, operation, pathItemParameters }))
    })
  }
  const webhookOperations = collectWebhookOperations(openapi)
  if (webhookOperations.length === 0) return undefined
  const routeLines = webhookOperations.map(
    ({ webhookName, method, operation, pathItemParameters }) => {
      const middlewares = [
        makeDescribeRoute(operation, schemaLib),
        ...makeValidators(operation, pathItemParameters, schemaLib),
        HANDLER_STUB,
      ]
      const args = [`'/${webhookName}'`, ...middlewares].join(',')
      return `.${method}(${args})`
    },
  )
  const handlerCode = `export const webhooksHandler=new Hono()${routeLines.join('')}`
  const componentPaths = options?.componentPaths ?? { schemas: '../components' }
  const imports = makeImports(handlerCode, schemaLib, componentPaths)
  return [...imports, '', handlerCode].join('\n')
}
