import { resolveRef } from '../utils/index.js'

/** Replaces every `{ "$ref": "#/components/.../X" }` subtree with the resolved identifier so `helper/imports.ts` can auto-emit the corresponding import. */
export function serializeWithRefs(value: unknown): string {
  const json = JSON.stringify(value)
  return json.replace(/\{\s*"\$ref"\s*:\s*"(#\/components\/[^"]+)"\s*\}/g, (_, ref: string) =>
    resolveRef(ref),
  )
}
