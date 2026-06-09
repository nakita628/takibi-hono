import type { Schema } from '../openapi/index.js'

/**
 * @internal Contract with schema-to-library — the merge strategies below assume
 * schema-to-library emits exactly these shapes per library. If schema-to-library
 * changes its emit format, these regex anchors must be updated in sync.
 *
 * - zod:     `... .meta({ ... })`              — `.meta({` appears once at outer
 * - valibot: `v.pipe(..., v.metadata({ ... }))` — `v.metadata({` at outer pipe
 * - typebox: `Type.X(body[, { ... }])`         — `{...}` is the 2nd arg when meta exists
 * - arktype: `... .describe('...')`             — no meta call to merge into, we append `.configure({ ... })`
 * - effect:  `... .annotations({ ... })`       — `.annotations({` appears once at outer
 *
 * `injectAtLast` always targets the last (outermost) meta call; property-level
 * meta appears earlier in the source and must not be rewritten.
 */

/**
 * arktype's `TypeMeta` is a closed interface (no `ref` key), so `.configure({ ref })`
 * fails to typecheck out of the box. arktype's documented extension point is the
 * global `ArkEnv["meta"]()` return type — augmenting it merges `ref` into `ArkEnv.meta`
 * → `TypeMeta`. Emitted once at the top of arktype component files that register refs.
 */
export const ARKTYPE_REF_AUGMENTATION =
  'declare global {\n  interface ArkEnv {\n    meta(): { ref?: string }\n  }\n}'

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
  schemaLib: 'zod' | 'valibot' | 'typebox' | 'arktype' | 'effect',
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
        if (hasMeta) return injectAtLast(constPart, '},{', `},{ref:${refStr},`) ?? constPart
        // An argument-less factory (`Type.Any()`, `Type.Null()`) takes the ref as
        // its first (options) argument; appending `,{ref}` would leave a comma
        // right after `(`. A factory with arguments appends the options object.
        return /\(\)(\s*)$/.test(constPart)
          ? constPart.replace(/\(\)(\s*)$/, `({ref:${refStr}})$1`)
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
