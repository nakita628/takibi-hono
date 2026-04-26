import { makeDescribeRoute } from '../generator/describe-route.js'
import { makeHandlerStub } from '../generator/response.js'
import { makeValidators } from '../generator/validator.js'
import { isHttpMethod, isOperation, isParameter } from '../guard/index.js'
import { makeImports } from '../helper/imports.js'
import type { OpenAPI, Operation, Parameter } from '../openapi/index.js'

export function collectWebhookOperations(openapi: OpenAPI): readonly {
  readonly webhookName: string
  readonly method: string
  readonly operation: Operation
  readonly pathItemParameters?: readonly Parameter[] | undefined
}[] {
  if (!openapi.webhooks) return []
  return Object.entries(openapi.webhooks).flatMap(([webhookName, pathItem]) => {
    const pathItemParameters: readonly Parameter[] | undefined = Array.isArray(pathItem.parameters)
      ? pathItem.parameters.filter(isParameter)
      : undefined

    return Object.entries(pathItem)
      .filter(
        (entry): entry is [string, Operation] => isHttpMethod(entry[0]) && isOperation(entry[1]),
      )
      .map(([method, operation]) => ({ webhookName, method, operation, pathItemParameters }))
  })
}

export function makeWebhooksCode(
  openapi: OpenAPI,
  schemaLib: 'zod' | 'valibot' | 'typebox' | 'arktype' | 'effect',
  options?: {
    readonly componentPaths?: { readonly [k: string]: string | undefined } | undefined
  },
) {
  const webhookOps = collectWebhookOperations(openapi)
  if (webhookOps.length === 0) return undefined
  const routeLines = webhookOps.map(({ webhookName, method, operation, pathItemParameters }) => {
    const middlewares = [
      makeDescribeRoute(operation, schemaLib),
      ...makeValidators(operation, pathItemParameters, schemaLib),
      makeHandlerStub(),
    ]
    const args = [`'/${webhookName}'`, ...middlewares].join(',')
    return `.${method}(${args})`
  })
  const handlerCode = `export const webhooksHandler=new Hono()${routeLines.join('')}`
  const componentPaths = options?.componentPaths ?? { schemas: '../components' }
  const imports = makeImports(handlerCode, schemaLib, componentPaths)
  return [...imports, '', handlerCode].join('\n')
}
