import type { SchemaLib } from '../core/layout.js'
import type { Schema } from '../openapi/index.js'

/**
 * Returns true if the OUTER schema carries any meta key that schema-to-library
 * encodes as a library-level meta call (description / example / examples /
 * deprecated). Used by typebox to decide whether the generated declaration
 * already has a 2nd-arg `opts` object to merge `ref` into.
 */
export function hasOuterMeta(schema: Schema): boolean {
  return Boolean(
    schema.description ||
    schema.example !== undefined ||
    schema.examples !== undefined ||
    schema.deprecated === true,
  )
}

/**
 * Adds a library-specific `ref` registration key to a component schema
 * declaration so that hono-openapi (via `@standard-community/standard-openapi`)
 * registers it under `components.schemas[<name>]` and emits `$ref` at use
 * sites instead of inlining the schema.
 *
 * Strategy: schema-to-library has already produced the schema body with all
 * meta (`description`, `examples`, `deprecated`) baked into each library's
 * idiomatic call. We MERGE the registration key into that existing meta call
 * (preserving everything schema-to-library emitted) — or attach a fresh call
 * if none exists. schema-to-library remains the single source of truth for
 * meta encoding; we only know HOW each library spells "ref":
 *
 * - zod: merge `ref` into `.meta({...})` (last occurrence = outer schema)
 * - valibot: merge `ref` into `v.metadata({...})`, or extend `v.pipe(...)`
 * - typebox: inject `ref` into the `Type.X(body, {opts})` 2nd-arg options
 * - arktype: append `.configure({ ref })` (independent of `.describe()`)
 * - effect: merge `identifier` into `.annotations({...})`
 *
 * @param decl - The full declaration string from `extractSchemaExports`,
 *   including any trailing `export type X = ...` line.
 * @param name - The schema's component name (the value used for `ref` /
 *   `identifier`). Wrapped in `JSON.stringify` for safe quoting.
 * @param schemaLib - Target schema library.
 * @param hasMeta - Whether the OUTER schema has any meta field. Required by
 *   typebox to distinguish between `Type.X(body)` (no opts) and
 *   `Type.X(body, {opts})` (opts present).
 */
export function injectRef(
  decl: string,
  name: string,
  schemaLib: SchemaLib,
  hasMeta: boolean,
): string {
  // Split off the `\n\nexport type ...` tail, transform the const part, then rejoin.
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
          // Insert `,v.metadata({ref:...})` before the trailing `)` of v.pipe.
          return constPart.replace(/\)$/, `,v.metadata({ref:${refStr}}))`)
        }
        // No v.pipe — wrap the right-hand side in a fresh v.pipe.
        return constPart.replace(
          /^(export\s+const\s+[A-Za-z_$][\w$]*Schema(?:\s*:\s*[^=]+)?\s*=\s*)([\s\S]*)$/,
          `$1v.pipe($2,v.metadata({ref:${refStr}}))`,
        )
      }
      case 'typebox':
        // schema-to-library emits `Type.X(body, {opts})` only when meta is
        // present. With meta we extend the existing opts; otherwise we attach
        // a fresh 2nd-arg.
        return hasMeta
          ? (injectAtLast(constPart, '},{', `},{ref:${refStr},`) ?? constPart)
          : constPart.replace(/\)(\s*)$/, `,{ref:${refStr}})$1`)
      case 'arktype':
        return `${constPart}.configure({ref:${refStr}})`
    }
  })()
  return transformed + tail
}

/**
 * Replaces the LAST occurrence of `needle` in `code` with `replacement`.
 * Returns `null` if `needle` is not found. The "last" occurrence targets the
 * outermost schema's meta call: property-level meta calls (on object props)
 * appear earlier in the source; the outer schema's meta call comes last.
 */
function injectAtLast(code: string, needle: string, replacement: string): string | null {
  const idx = code.lastIndexOf(needle)
  if (idx === -1) return null
  return code.slice(0, idx) + replacement + code.slice(idx + needle.length)
}
