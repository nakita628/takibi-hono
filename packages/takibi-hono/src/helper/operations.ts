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

/**
 * A path segment in kebab case: every run of what is no letter or digit is a word break, and so
 * is a change of case, an acronym being one word. `realTimeEvents` as `real-time-events`,
 * `userAPIKeys` as `user-api-keys`, `user_profiles` as `user-profiles`. As hono-takibi names its
 * handler files.
 */
function toKebabCase(segment: string) {
  return segment
    .replaceAll(/\{([^}]+)\}/gu, '$1')
    .replaceAll(/[^0-9A-Za-z]+/gu, '-')
    .replaceAll(/([a-z0-9])([A-Z])/gu, '$1-$2')
    .replaceAll(/([A-Z])([A-Z][a-z])/gu, '$1-$2')
    .replaceAll(/^-+|-+$/gu, '')
    .toLowerCase()
}

/**
 * `/users/{id}` → group `users`; `/` → `__root`. One group per handler file. The first segment
 * is lowercased, or with `fileNameCase: 'kebab-case'` written in kebab case
 * (`/realTimeEvents` → `real-time-events`); a segment with no ASCII letter or digit, which kebab
 * case would leave empty, is lowercased all the same rather than taken for the root.
 */
export function makeHandlerFileName(path: string, fileNameCase?: 'kebab-case') {
  const segment = path.split('/').find(Boolean)
  if (segment === undefined) return '__root'
  const kebab = fileNameCase === 'kebab-case' ? toKebabCase(segment) : ''
  return kebab === '' ? segment.toLowerCase() : kebab
}

export function collectRoutes(openapi: OpenAPI, fileNameCase?: 'kebab-case') {
  const paths: { readonly [path: string]: PathItem } = openapi.paths
  return Object.entries(paths).reduce((groups, [path, pathItem]) => {
    const routes = makeRoutes(path.replaceAll(/\{([^}]+)\}/gu, ':$1'), pathItem, openapi)
    const name = makeHandlerFileName(path, fileNameCase)
    return routes.length > 0 ? groups.set(name, [...(groups.get(name) ?? []), ...routes]) : groups
  }, new Map<string, readonly Route[]>())
}

/** OAS 3.1 webhooks, each served as `/<name>`. */
export function collectWebhookRoutes(openapi: OpenAPI) {
  return Object.entries(openapi.webhooks ?? {}).flatMap(([name, pathItem]) =>
    makeRoutes(`/${name}`, pathItem, openapi),
  )
}
