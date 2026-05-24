import { isHttpMethod, isOperation } from '../guard/index.js'
import type { OpenAPI, Operation, Parameter } from '../openapi/index.js'
import { makeHandlerFileName } from '../utils/index.js'
import { resolveParameterRef, resolvePathItemRef } from './openapi.js'

export type RouteOperation = {
  readonly method: string
  readonly path: string
  readonly operation: Operation
  readonly pathItemParameters?: readonly Parameter[] | undefined
}

function resolvePathItemParameters(
  params: unknown,
  openapi: OpenAPI,
): readonly Parameter[] | undefined {
  if (!Array.isArray(params)) return undefined
  return params
    .map((p) => resolveParameterRef(p, openapi.components))
    .filter((p): p is Parameter => p !== undefined)
}

export function collectOperations(
  openapi: OpenAPI,
): ReadonlyMap<string, readonly RouteOperation[]> {
  return Object.entries(openapi.paths).reduce((groups, [pathStr, rawPathItem]) => {
    const pathItem = resolvePathItemRef(rawPathItem, openapi.components)
    if (!pathItem) return groups
    const groupName = makeHandlerFileName(pathStr)
    const pathItemParameters = resolvePathItemParameters(pathItem.parameters, openapi)
    const ops = Object.entries(pathItem)
      .filter(
        (entry): entry is [string, Operation] => isHttpMethod(entry[0]) && isOperation(entry[1]),
      )
      .map(([method, operation]) => ({ method, path: pathStr, operation, pathItemParameters }))

    return ops.length > 0
      ? groups.set(groupName, [...(groups.get(groupName) ?? []), ...ops])
      : groups
  }, new Map<string, RouteOperation[]>())
}

type WebhookOperation = {
  readonly webhookName: string
  readonly method: string
  readonly operation: Operation
  readonly pathItemParameters?: readonly Parameter[] | undefined
}

export function collectWebhookOperations(openapi: OpenAPI): readonly WebhookOperation[] {
  if (!openapi.webhooks) return []
  return Object.entries(openapi.webhooks).flatMap(([webhookName, rawPathItem]) => {
    const pathItem = resolvePathItemRef(rawPathItem, openapi.components)
    if (!pathItem) return []
    const pathItemParameters = resolvePathItemParameters(pathItem.parameters, openapi)
    return Object.entries(pathItem)
      .filter(
        (entry): entry is [string, Operation] => isHttpMethod(entry[0]) && isOperation(entry[1]),
      )
      .map(([method, operation]) => ({ webhookName, method, operation, pathItemParameters }))
  })
}
