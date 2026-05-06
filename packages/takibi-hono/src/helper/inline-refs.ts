import { resolveRef } from '../utils/index.js'

/**
 * Serialize an OpenAPI fragment to a JS literal expression, replacing every
 * `{ "$ref": "#/components/.../X" }` subtree with the resolved component
 * identifier (e.g. `UserSchema`, `UserResponse`). The auto-import detector in
 * `helper/imports.ts` then picks those identifiers up and emits the right
 * `import` statements at the top of the generated file.
 *
 * Used by callback / path-item generators which dump full OpenAPI fragments
 * verbatim — without this step the output retains literal `$ref` strings and
 * loses its connection to the typed component schemas.
 */
export function serializeWithRefs(value: unknown): string {
  const json = JSON.stringify(value)
  return json.replace(/\{\s*"\$ref"\s*:\s*"(#\/components\/[^"]+)"\s*\}/g, (_, ref: string) =>
    resolveRef(ref),
  )
}
