import type { OpenAPI, Operation, Parameter, PathItem, Reference } from 'oas-truth'
import { schemaRefToName } from 'oas-truth'

const HTTP_METHODS = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'] as const

export type Route = {
  readonly method: (typeof HTTP_METHODS)[number]
  /** Hono path (`/users/:id`). */
  readonly path: string
  readonly operation: Operation
  /** Path Item level parameters, shared by every operation under the path. */
  readonly parameters: readonly (Parameter | Reference)[]
}

function isInline<T extends object>(value: T | Reference): value is T {
  return !('$ref' in value && typeof value.$ref === 'string')
}

/** Follows a local `$ref` into its Components map (`undefined` when it does not resolve). */
export function resolveRef<T extends object>(
  value: T | Reference | undefined,
  map: { readonly [k: string]: T } | undefined,
): T | undefined {
  if (value === undefined) return undefined
  if (isInline(value)) return value
  return map?.[schemaRefToName(value.$ref ?? '')]
}

function makeRoutes(path: string, rawPathItem: PathItem, openapi: OpenAPI): readonly Route[] {
  const pathItem = resolveRef(rawPathItem, openapi.components?.pathItems)
  if (!pathItem) return []
  return HTTP_METHODS.flatMap((method) => {
    const operation = pathItem[method]
    return operation ? [{ method, path, operation, parameters: pathItem.parameters ?? [] }] : []
  })
}

/** `/users/{id}` → group `users`; `/` → `__root`. One group per handler file. */
export function makeHandlerFileName(path: string) {
  return path.split('/').find(Boolean)?.toLowerCase() ?? '__root'
}

export function collectRoutes(openapi: OpenAPI) {
  const paths: { readonly [path: string]: PathItem } = openapi.paths
  return Object.entries(paths).reduce((groups, [path, pathItem]) => {
    const routes = makeRoutes(path.replaceAll(/\{([^}]+)\}/gu, ':$1'), pathItem, openapi)
    const name = makeHandlerFileName(path)
    return routes.length > 0 ? groups.set(name, [...(groups.get(name) ?? []), ...routes]) : groups
  }, new Map<string, readonly Route[]>())
}

/** OAS 3.1 webhooks, each served as `/<name>`. */
export function collectWebhookRoutes(openapi: OpenAPI) {
  return Object.entries(openapi.webhooks ?? {}).flatMap(([name, pathItem]) =>
    makeRoutes(`/${name}`, pathItem, openapi),
  )
}
