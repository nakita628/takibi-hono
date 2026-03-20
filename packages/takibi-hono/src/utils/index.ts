/**
 * Generates a camelCase route identifier from HTTP method and path.
 *
 * @param method - HTTP method (e.g., 'get', 'post').
 * @param path - URL path (e.g., '/users/{id}/posts').
 * @returns A route identifier string (e.g., 'getUsersIdPosts').
 *
 * @example
 * methodPath('get', '/users/{id}/posts') // 'getUsersIdPosts'
 * methodPath('get', '/') // 'get'
 */
export function methodPath(method: string, path: string): string {
  const hasTrailingSlash = path !== '/' && path.endsWith('/')
  const apiPath = path
    .replace(/[^A-Za-z0-9]/g, ' ')
    .trim()
    .split(/\s+/)
    .map((str) => `${str.charAt(0).toUpperCase()}${str.slice(1)}`)
    .join('')
  const suffix = hasTrailingSlash ? 'Index' : ''
  return apiPath ? `${method}${apiPath}${suffix}` : `${method}`
}

/**
 * Extracts handler file name from an OpenAPI path.
 * Uses the first path segment as the file name.
 * Root path ("/") maps to "__root".
 *
 * @param path - URL path (e.g., '/users/{id}').
 * @returns Handler file name (e.g., 'users').
 *
 * @example
 * makeHandlerFileName('/') // '__root'
 * makeHandlerFileName('/users') // 'users'
 * makeHandlerFileName('/users/{id}') // 'users'
 * makeHandlerFileName('/api/v1/todos') // 'api'
 */
export function makeHandlerFileName(path: string): string {
  const segments = path.split('/').filter(Boolean)
  if (segments.length === 0) return '__root'
  return segments[0].toLowerCase()
}

/**
 * Converts a string to PascalCase.
 *
 * @param str - Input string with separators (-, _, /, space, {, }).
 * @returns PascalCase string.
 *
 * @example
 * toPascalCase('user-name') // 'UserName'
 * toPascalCase('get_users') // 'GetUsers'
 */
export function toPascalCase(str: string): string {
  return str
    .replace(/[^A-Za-z0-9]/g, ' ')
    .trim()
    .split(/\s+/)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('')
}

/**
 * Converts a string to camelCase.
 *
 * @param str - Input string.
 * @returns camelCase string.
 *
 * @example
 * toCamelCase('user-name') // 'userName'
 */
export function toCamelCase(str: string): string {
  const words = str
    .replace(/[^A-Za-z0-9]/g, ' ')
    .trim()
    .split(/\s+/)
  if (words.length === 0) return ''
  const [first, ...rest] = words
  return first.toLowerCase() + rest.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join('')
}

/**
 * Resolves an OpenAPI $ref to its variable name using schema-to-library's suffix map.
 *
 * @param ref - OpenAPI $ref string (e.g., '#/components/schemas/Pet')
 * @returns Variable name with suffix (e.g., 'PetSchema')
 *
 * @example
 * resolveRef('#/components/schemas/Pet') // 'PetSchema'
 * resolveRef('#/components/schemas/CreateUser') // 'CreateUserSchema'
 */
export function resolveRef(ref: string): string {
  const OPENAPI_COMPONENT_SUFFIX_MAP = [
    { prefix: '#/components/schemas/', suffix: 'Schema' },
    { prefix: '#/components/parameters/', suffix: 'ParamsSchema' },
    { prefix: '#/components/headers/', suffix: 'HeaderSchema' },
    { prefix: '#/components/securitySchemes/', suffix: 'SecurityScheme' },
    { prefix: '#/components/requestBodies/', suffix: 'RequestBody' },
    { prefix: '#/components/responses/', suffix: 'Response' },
    { prefix: '#/components/examples/', suffix: 'Example' },
    { prefix: '#/components/links/', suffix: 'Link' },
    { prefix: '#/components/callbacks/', suffix: 'Callback' },
    { prefix: '#/components/pathItems/', suffix: 'PathItem' },
    { prefix: '#/components/mediaTypes/', suffix: 'MediaTypeSchema' },
  ]

  for (const { prefix, suffix } of OPENAPI_COMPONENT_SUFFIX_MAP) {
    if (ref.startsWith(prefix)) {
      const rest = ref.slice(prefix.length)
      // Decode URL-encoded names (e.g., 'My%20Schema' → 'My Schema')
      const decoded = decodeURIComponent(rest)
      // Handle nested property references (e.g., 'Pet/properties/name' → use top-level 'Pet')
      const name = decoded.split('/')[0]
      return `${toPascalCase(name)}${suffix}`
    }
  }

  return ref.split('/').at(-1) ?? 'unknown'
}

/**
 * Renders a named import statement.
 *
 * @example
 * renderNamedImport(['UserSchema', 'PostSchema'], '../schemas')
 * // "import{UserSchema,PostSchema}from'../schemas'"
 */
export function renderNamedImport(names: readonly string[], spec: string): string {
  const unique = Array.from(new Set(names))
  return unique.length > 0 ? `import{${unique.join(',')}}from'${spec}'` : ''
}

/**
 * Converts OpenAPI path parameters `{param}` to Hono-style `:param`.
 *
 * @param path - OpenAPI path (e.g., '/users/{id}/posts/{postId}')
 * @returns Hono-style path (e.g., '/users/:id/posts/:postId')
 *
 * @example
 * toHonoPath('/users/{id}') // '/users/:id'
 * toHonoPath('/todo') // '/todo'
 */
export function toHonoPath(path: string): string {
  return path.replace(/\{([^}]+)\}/g, ':$1')
}
