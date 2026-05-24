import { makeImports, makeStandardImports } from '../../../helper/imports.js'
import { makeStandardValidators, makeValidators } from '../../../helper/validator.js'
import type { Components, Operation, Parameter } from '../../../openapi/index.js'
import { toHandlerVarName, toHonoPath } from '../../../utils/index.js'
import { makeDescribeRoute } from '../routes/index.js'

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
    readonly components?: Components | undefined
  },
) {
  const handlerName = toHandlerVarName(groupName)
  const useOpenAPI = options?.openapi === true
  const components = options?.components
  const routeLines = useOpenAPI
    ? operations.map(({ method, path, operation, pathItemParameters }) => {
        const honoPath = toHonoPath(path)
        const middlewares = [
          makeDescribeRoute(operation, schemaLib),
          ...makeValidators(operation, pathItemParameters, schemaLib, components),
          '(c)=>{}',
        ]
        return `.${method}(${[`'${honoPath}'`, ...middlewares].join(',')})`
      })
    : operations.map(({ method, path, operation, pathItemParameters }) => {
        const honoPath = toHonoPath(path)
        const validators = makeStandardValidators(
          operation,
          pathItemParameters,
          schemaLib,
          components,
        )
        const args = [`'${honoPath}'`, ...validators, '(c)=>{}']
        return `.${method}(${args.join(',')})`
      })
  const handlerCode = `export const ${handlerName}=new Hono()${routeLines.join('')}`
  const componentPaths = options?.componentPaths ?? { schemas: '../components' }
  const imports = useOpenAPI
    ? makeImports(handlerCode, schemaLib, componentPaths)
    : makeStandardImports(handlerCode, schemaLib, componentPaths)
  return [...imports, '', handlerCode].join('\n')
}
