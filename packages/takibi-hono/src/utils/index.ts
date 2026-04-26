export function methodPath(method: string, path: string) {
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

export function makeHandlerFileName(path: string) {
  const segments = path.split('/').filter(Boolean)
  if (segments.length === 0) return '__root'
  return segments[0].toLowerCase()
}

export function toPascalCase(str: string) {
  return str
    .replace(/[^A-Za-z0-9]/g, ' ')
    .trim()
    .split(/\s+/)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('')
}

export function toCamelCase(str: string) {
  const words = str
    .replace(/[^A-Za-z0-9]/g, ' ')
    .trim()
    .split(/\s+/)
  if (words.length === 0) return ''
  const [first, ...rest] = words
  return first.toLowerCase() + rest.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join('')
}

export function resolveRef(ref: string) {
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
      const decoded = decodeURIComponent(rest)
      const name = decoded.split('/')[0]
      return `${toPascalCase(name)}${suffix}`
    }
  }

  return ref.split('/').at(-1) ?? 'unknown'
}

export function renderNamedImport(names: readonly string[], spec: string) {
  const unique = Array.from(new Set(names))
  return unique.length > 0 ? `import{${unique.join(',')}}from'${spec}'` : ''
}

export function toHonoPath(path: string) {
  return path.replace(/\{([^}]+)\}/g, ':$1')
}
