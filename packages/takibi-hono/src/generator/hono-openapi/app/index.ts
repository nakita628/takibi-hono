import type { OpenAPI } from '../../../openapi/index.js'
import { toCamelCase } from '../../../utils/index.js'

export function makeAppCode(
  openapi: OpenAPI,
  handlerFileNames: readonly string[],
  config?: {
    readonly basePath?: string | undefined
    readonly handlersImportPath?: string | undefined
  },
) {
  const sorted = handlerFileNames.toSorted()
  const handlersImport = config?.handlersImportPath ?? './handlers'

  const handlerImports = sorted.map(
    (name) => `${toCamelCase(name === '__root' ? 'root' : name)}Handler`,
  )
  const routeChain = sorted
    .map((name) => {
      const handlerName = `${toCamelCase(name === '__root' ? 'root' : name)}Handler`
      return `.route('/',${handlerName})`
    })
    .join('')
  const basePath = config?.basePath
  const appDecl = basePath ? `const app=new Hono().basePath('${basePath}')` : 'const app=new Hono()'
  return `import{Hono}from'hono'\nimport{${handlerImports.join(',')}}from'${handlersImport}'\n\n${appDecl}\n\nexport const api=app${routeChain}\n\nexport default app`
}
