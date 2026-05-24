import type { SchemaLib } from '../core/layout.js'
import type { Schema } from '../openapi/index.js'

/** Used by typebox to decide whether the generated declaration has a 2nd-arg `opts` object to merge `ref` into. */
export function hasOuterMeta(schema: Schema): boolean {
  return Boolean(
    schema.description ||
    schema.example !== undefined ||
    schema.examples !== undefined ||
    schema.deprecated === true,
  )
}

/**
 * Adds a library-specific `ref` key so hono-openapi registers the schema under
 * `components.schemas[<name>]` and emits `$ref` instead of inlining.
 *
 * schema-to-library owns meta encoding; we MERGE `ref` into the existing meta
 * call. Library spelling:
 * - zod: `.meta({ref})`
 * - valibot: `v.metadata({ref})` (or wrap in `v.pipe(...)`)
 * - typebox: `Type.X(body, {ref, ...opts})`
 * - arktype: `.configure({ref})`
 * - effect: `.annotations({identifier})`
 */
export function injectRef(
  decl: string,
  name: string,
  schemaLib: SchemaLib,
  hasMeta: boolean,
): string {
  const splitIdx = decl.search(/\n\nexport\s+type\b/)
  const constPart = splitIdx === -1 ? decl : decl.slice(0, splitIdx)
  const tail = splitIdx === -1 ? '' : decl.slice(splitIdx)
  const refStr = JSON.stringify(name)
  const transformed = ((): string => {
    switch (schemaLib) {
      case 'zod':
        return (
          injectAtLast(constPart, '.meta({', `.meta({ref:${refStr},`) ??
          `${constPart}.meta({ref:${refStr}})`
        )
      case 'effect':
        return (
          injectAtLast(constPart, '.annotations({', `.annotations({identifier:${refStr},`) ??
          `${constPart}.annotations({identifier:${refStr}})`
        )
      case 'valibot': {
        const replaced = injectAtLast(constPart, 'v.metadata({', `v.metadata({ref:${refStr},`)
        if (replaced !== null) return replaced
        if (/=\s*v\.pipe\(/.test(constPart)) {
          return constPart.replace(/\)$/, `,v.metadata({ref:${refStr}}))`)
        }
        return constPart.replace(
          /^(export\s+const\s+[A-Za-z_$][\w$]*Schema(?:\s*:\s*[^=]+)?\s*=\s*)([\s\S]*)$/,
          `$1v.pipe($2,v.metadata({ref:${refStr}}))`,
        )
      }
      case 'typebox':
        // schema-to-library emits Type.X(body, {opts}) only when meta is present.
        return hasMeta
          ? (injectAtLast(constPart, '},{', `},{ref:${refStr},`) ?? constPart)
          : constPart.replace(/\)(\s*)$/, `,{ref:${refStr}})$1`)
      case 'arktype':
        return `${constPart}.configure({ref:${refStr}})`
    }
  })()
  return transformed + tail
}

/** Last occurrence targets the outer schema's meta call (property-level meta appears earlier in source). Returns null if not found. */
function injectAtLast(code: string, needle: string, replacement: string): string | null {
  const idx = code.lastIndexOf(needle)
  if (idx === -1) return null
  return code.slice(0, idx) + replacement + code.slice(idx + needle.length)
}
