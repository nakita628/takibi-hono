import type { OpenAPI } from '../../../openapi/index.js'
import { toHandlerVarName } from '../../../utils/index.js'

export function makeAppCode(
  openapi: OpenAPI,
  handlerFileNames: readonly string[],
  config?: {
    readonly basePath?: string | undefined
    readonly handlersImportPath?: string | undefined
  },
) {
  const handlerNames = handlerFileNames.toSorted().map(toHandlerVarName)
  const handlersImport = config?.handlersImportPath ?? './handlers'
  const routeChain = handlerNames.map((name) => `.route('/',${name})`).join('')
  const basePath = config?.basePath
  const appDecl = basePath ? `const app=new Hono().basePath('${basePath}')` : 'const app=new Hono()'
  return `import{Hono}from'hono'\nimport{${handlerNames.join(',')}}from'${handlersImport}'\n\n${appDecl}\n\nexport const api=app${routeChain}\n\nexport default app`
}
