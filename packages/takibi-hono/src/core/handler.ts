import { makeDescribeRoute } from '../generator/describe-route.js'
import { makeHandlerStub } from '../generator/response.js'
import { makeStandardValidators, makeValidators } from '../generator/validator.js'
import { isHttpMethod, isOperation, isParameter } from '../guard/index.js'
import { makeImports, makeStandardImports } from '../helper/imports.js'
import type { OpenAPI, Operation, Parameter } from '../openapi/index.js'
import {
  makeHandlerFileName, toCamelCase, toHonoPath, } from '../utils/index.js'

export function collectOperations(openapi: OpenAPI): ReadonlyMap<
  string,
  readonly {
    readonly method: string
    readonly path: string
    readonly operation: Operation
    readonly pathItemParameters?: readonly Parameter[] | undefined
  }[]
> {
  return Object.entries(openapi.paths).reduce(
    (groups, [pathStr, pathItem]) => {
      const groupName = makeHandlerFileName(pathStr)
      const pathItemParameters: readonly Parameter[] | undefined = Array.isArray(
        pathItem.parameters,
      )
        ? (pathItem.parameters.filter(isParameter) as readonly Parameter[])
        : undefined
      const ops = Object.entries(pathItem)
        .filter(
          (entry): entry is [string, Operation] => isHttpMethod(entry[0]) && isOperation(entry[1]),
        )
        .map(([method, operation]) => ({ method, path: pathStr, operation, pathItemParameters }))

      return ops.length > 0
        ? groups.set(groupName, [...(groups.get(groupName) ?? []), ...ops])
        : groups
    },
    new Map<
      string,
      {
        readonly method: string
        readonly path: string
        readonly operation: Operation
        readonly pathItemParameters?: readonly Parameter[] | undefined
      }[]
    >(),
  )
}

export function makeHandlerCode(
  groupName: string,
  operations: readonly {
    readonly method: string
    readonly path: string
    readonly operation: Operation
    readonly pathItemParameters?: readonly Parameter[] | undefined
  }[],
  schemaLib: 'zod' | 'valibot' | 'typebox' | 'arktype' | 'effect',
  options?: {
    readonly componentPaths?: { readonly [key: string]: string | undefined } | undefined
    readonly openapi?: boolean | undefined
  },
) {
  const handlerName = `${toCamelCase(groupName === '__root' ? 'root' : groupName)}Handler`
  const useOpenAPI = options?.openapi === true
  const routeLines = useOpenAPI
    ? operations.map(({ method, path, operation, pathItemParameters }) => {
        const honoPath = toHonoPath(path)
        const middlewares = [
          makeDescribeRoute(operation, schemaLib),
          ...makeValidators(operation, pathItemParameters, schemaLib),
          makeHandlerStub(),
        ]
        return `.${method}(${[`'${honoPath}'`, ...middlewares].join(',')})`
      })
    : operations.map(({ method, path, operation, pathItemParameters }) => {
        const honoPath = toHonoPath(path)
        const validators = makeStandardValidators(operation, pathItemParameters, schemaLib)
        const args = [`'${honoPath}'`, ...validators, makeHandlerStub()]
        return `.${method}(${args.join(',')})`
      })
  const handlerCode = `export const ${handlerName}=new Hono()${routeLines.join('')}`
  if (!useOpenAPI) {
    const componentPaths = options?.componentPaths ?? { schemas: '../components' }
    const imports = makeStandardImports(handlerCode, schemaLib, componentPaths)
    return [...imports, '', handlerCode].join('\n')
  }
  const componentPaths = options?.componentPaths ?? { schemas: '../components' }
  const imports = makeImports(handlerCode, schemaLib, componentPaths)
  return [...imports, '', handlerCode].join('\n')
}
