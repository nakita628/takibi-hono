import { makeHeaderValue } from '../../../helper/openapi.js'
import type { Components } from '../../../openapi/index.js'
import { toPascalCase } from '../../../utils/index.js'

/**
 * Generates header component code from OpenAPI components.headers.
 * Each header is exported as an OpenAPI Header Object (`{ description?, schema:
 * <JSON Schema literal> as const, required?, deprecated? }`) — the same value
 * shape inline route headers use — so it slots directly into a describeRoute
 * `headers` map. A response header's `schema` is documentation (SchemaObject),
 * not a runtime validator, so the output is schema-library independent.
 */
export async function makeHeadersCode(
  headers: NonNullable<Components['headers']>,
): Promise<string> {
  return Object.entries(headers)
    .map(
      ([name, header]) =>
        `export const ${toPascalCase(name)}HeaderSchema=${makeHeaderValue(header)}`,
    )
    .join('\n\n')
}
