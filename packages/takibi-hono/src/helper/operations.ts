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

/** How a handler file is named after the first segment of its paths; kebab case when unset. */
export type FileNameCase = 'kebab-case' | 'lowercase'

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
 * is written in kebab case (`/realTimeEvents` → `real-time-events`), or with
 * `fileNameCase: 'lowercase'` lowercased (`realtimeevents`); a segment with no ASCII letter or
 * digit, which kebab case would leave empty, is lowercased all the same rather than taken for
 * the root.
 */
export function makeHandlerFileName(path: string, fileNameCase?: FileNameCase) {
  const segment = path.split('/').find(Boolean)
  if (segment === undefined) return '__root'
  const kebab = fileNameCase === 'lowercase' ? '' : toKebabCase(segment)
  return kebab === '' ? segment.toLowerCase() : kebab
}

/** Whether the first segment of `path` holds a path parameter (`/{slug}`, `/{org_id}/items`). */
function startsAtParameter(path: string) {
  return path.split('/').find(Boolean)?.includes('{') === true
}

/**
 * The group of every path of the document, as `makeHandlerFileName` names it, but for a first
 * segment that is a parameter and would share its kebab-case name with a static one
 * (`/{user}` beside `/user`, `/{org_id}` beside `/org-id`): it keeps its lowercased name
 * (`{user}`), a group of its own. In one group, and so one handler file, the parameter route
 * would answer for the static one, or the static one be registered behind the parameter
 * routes of other files.
 */
export function nameHandlerFiles(openapi: OpenAPI, fileNameCase?: FileNameCase) {
  const statics = new Set(
    Object.keys(openapi.paths)
      .filter((path) => !startsAtParameter(path))
      .map((path) => makeHandlerFileName(path, fileNameCase)),
  )
  return (path: string) => {
    const name = makeHandlerFileName(path, fileNameCase)
    return startsAtParameter(path) && statics.has(name)
      ? makeHandlerFileName(path, 'lowercase')
      : name
  }
}

export function collectRoutes(openapi: OpenAPI, fileNameCase?: FileNameCase) {
  const paths: { readonly [path: string]: PathItem } = openapi.paths
  const nameOf = nameHandlerFiles(openapi, fileNameCase)
  return Object.entries(paths).reduce((groups, [path, pathItem]) => {
    const routes = makeRoutes(path.replaceAll(/\{([^}]+)\}/gu, ':$1'), pathItem, openapi)
    const name = nameOf(path)
    return routes.length > 0 ? groups.set(name, [...(groups.get(name) ?? []), ...routes]) : groups
  }, new Map<string, readonly Route[]>())
}

/** OAS 3.1 webhooks, each served as `/<name>`. */
export function collectWebhookRoutes(openapi: OpenAPI) {
  return Object.entries(openapi.webhooks ?? {}).flatMap(([name, pathItem]) =>
    makeRoutes(`/${name}`, pathItem, openapi),
  )
}
