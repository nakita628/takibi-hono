import { isHttpMethod, isOperation, isParameter } from '../guard/index.js'
import type { OpenAPI, Operation, Parameter } from '../openapi/index.js'
import { makeHandlerFileName } from '../utils/index.js'

export type RouteOperation = {
  readonly method: string
  readonly path: string
  readonly operation: Operation
  readonly pathItemParameters?: readonly Parameter[] | undefined
}

export function collectOperations(
  openapi: OpenAPI,
): ReadonlyMap<string, readonly RouteOperation[]> {
  return Object.entries(openapi.paths).reduce((groups, [pathStr, pathItem]) => {
    const groupName = makeHandlerFileName(pathStr)
    const pathItemParameters = Array.isArray(pathItem.parameters)
      ? pathItem.parameters.filter(isParameter)
      : undefined
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
