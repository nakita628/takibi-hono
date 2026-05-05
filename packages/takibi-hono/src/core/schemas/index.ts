import { emit } from '../../emit/index.js'
import {
  makeSchemasCode,
  makeSplitSchemas,
} from '../../generator/hono-openapi/components/schemas.js'
import type { OpenAPI } from '../../openapi/index.js'
import type { Layout, SchemaLib, TakibiHonoOptions } from '../layout.js'

/**
 * Emits component schemas to disk.
 *
 * - When `useOpenAPI` is true, each schema is annotated with a library-specific
 *   `ref` registration key so hono-openapi populates `components.schemas` and
 *   uses `$ref` at call sites; in plain Hono mode the key is omitted.
 * - When `components.schemas.split: true`, each schema is written to its own
 *   file alongside a barrel `index.ts`.
 */
export async function makeSchemas(
  openapi: OpenAPI,
  schemaLib: SchemaLib,
  useOpenAPI: boolean,
  ohConfig: TakibiHonoOptions | undefined,
  layout: Layout,
) {
  if (!openapi.components?.schemas) return { ok: true, value: undefined } as const
  const schemasConfig = ohConfig?.components?.schemas
  const exportTypes = schemasConfig?.exportTypes ?? ohConfig?.exportSchemasTypes ?? false
  const isReadonly = ohConfig?.readonly ?? false
  const split = schemasConfig?.split ?? false
  const registerRef = useOpenAPI
  if (split) {
    const splitDir = layout.schemasFile.replace(/\/index\.ts$/, '').replace(/\.ts$/, '')
    return makeSplitSchemas(openapi.components.schemas, schemaLib, splitDir, {
      exportTypes,
      readonly: isReadonly,
      registerRef,
    })
  }
  const schemasCode = await makeSchemasCode(openapi.components.schemas, schemaLib, {
    exportTypes,
    readonly: isReadonly,
    registerRef,
  })
  return emit(schemasCode, layout.schemasDir, layout.schemasFile)
}
