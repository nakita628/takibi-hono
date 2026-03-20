import { makeDescribeRoute } from '../generator/describe-route.js'
import { makeHandlerStub } from '../generator/response.js'
import { makeValidators } from '../generator/validator.js'
import { isHttpMethod, isOperation, isParameter } from '../guard/index.js'
import { makeImports } from '../helper/imports.js'
import type { OpenAPI, Operation, Parameter } from '../openapi/index.js'

type WebhookOperationInfo = {
  readonly webhookName: string
  readonly method: string
  readonly operation: Operation
  readonly pathItemParameters?: readonly Parameter[] | undefined
}

/**
 * Collects all webhook operations from the OpenAPI spec.
 */
export function collectWebhookOperations(openapi: OpenAPI): readonly WebhookOperationInfo[] {
  if (!openapi.webhooks) return []

  return Object.entries(openapi.webhooks).flatMap(([webhookName, pathItem]) => {
    const pathItemParameters: readonly Parameter[] | undefined = Array.isArray(pathItem.parameters)
      ? (pathItem.parameters.filter(isParameter) as readonly Parameter[])
      : undefined

    return Object.entries(pathItem)
      .filter(
        (entry): entry is [string, Operation] => isHttpMethod(entry[0]) && isOperation(entry[1]),
      )
      .map(([method, operation]) => ({ webhookName, method, operation, pathItemParameters }))
  })
}

/**
 * Generates webhook handler code from OpenAPI webhooks.
 */
export function makeWebhooksCode(
  openapi: OpenAPI,
  schemaLib: 'zod' | 'valibot' | 'typebox' | 'arktype' | 'effect',
  options?: {
    readonly componentPaths?: { readonly [key: string]: string | undefined } | undefined
  },
): string | undefined {
  const webhookOps = collectWebhookOperations(openapi)
  if (webhookOps.length === 0) return undefined

  // 1. Generate handler code first
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

  // 2. Scan generated code for imports
  const componentPaths = options?.componentPaths ?? { schemas: '../components' }
  const imports = makeImports(handlerCode, schemaLib, componentPaths)

  return [...imports, '', handlerCode].join('\n')
}
