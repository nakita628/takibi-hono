import { OPENAPI_COMPONENT_SUFFIX_MAP } from 'schema-to-library'

export function makeHandlerFileName(path: string) {
  const segments = path.split('/').filter(Boolean)
  if (segments.length === 0) return '__root'
  return segments[0].toLowerCase()
}

/**
 * Encode non-ASCII characters as `u<hex codepoint>` so identifier
 * normalization keeps them distinct instead of stripping every non-ASCII name
 * down to the same value (which silently collapses Unicode-named schemas into
 * one declaration). Pure-ASCII input is returned byte-for-byte unchanged.
 *
 * Mirrors `schema-to-library`'s `encodeNonAscii` so `$ref` resolution here
 * matches the component declaration names it emits (e.g. `日本語スキーマ` →
 * `U65e5u672cu8a9eu30b9u30adu30fcu30deSchema`).
 */
function encodeNonAscii(str: string) {
  return Array.from(str)
    .map((ch) => {
      const cp = ch.codePointAt(0) ?? 0
      return cp > 0x7f ? `u${cp.toString(16)}` : ch
    })
    .join('')
}

export function toPascalCase(str: string) {
  return encodeNonAscii(str)
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

/**
 * Encode a property key for object-literal output: bare identifiers stay
 * unquoted, everything else is JSON-encoded so hyphenated/reserved/numeric
 * keys (e.g. `X-Request-ID`) emit as valid TypeScript.
 */
export function makeSafeKey(key: string) {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key) ? key : JSON.stringify(key)
}

/** Maps a handler file name to its variable name (`__root` → `rootHandler`, otherwise `<camelCase>Handler`). */
export function toHandlerVarName(handlerFileName: string) {
  const base = toCamelCase(handlerFileName === '__root' ? 'root' : handlerFileName)
  // A path segment can start with a digit (e.g. `2010-04-01`); prefix `_` so the
  // generated `const <name>Handler` is a valid identifier.
  const safeBase = /^[0-9]/.test(base) ? `_${base}` : base
  return `${safeBase}Handler`
}
