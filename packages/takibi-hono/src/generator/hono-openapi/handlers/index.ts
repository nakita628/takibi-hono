import { makeImports, makeStandardImports } from '../../../helper/imports.js'
import type { RouteOperation } from '../../../helper/operations.js'
import { makeStandardValidators, makeValidators } from '../../../helper/validator.js'
import { toCamelCase, toHonoPath } from '../../../utils/index.js'
import { makeDescribeRoute } from '../routes/index.js'

export function makeHandlerCode(
  groupName: string,
  operations: readonly RouteOperation[],
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
          "(c)=>{throw new Error('Not implemented')}",
        ]
        return `.${method}(${[`'${honoPath}'`, ...middlewares].join(',')})`
      })
    : operations.map(({ method, path, operation, pathItemParameters }) => {
        const honoPath = toHonoPath(path)
        const validators = makeStandardValidators(operation, pathItemParameters, schemaLib)
        const args = [`'${honoPath}'`, ...validators, "(c)=>{throw new Error('Not implemented')}"]
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
