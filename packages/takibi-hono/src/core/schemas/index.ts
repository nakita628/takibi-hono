import { emit } from '../../emit/index.js'
import {
  makeSchemasCode,
  makeSplitSchemas,
} from '../../generator/hono-openapi/components/schemas.js'
import type { OpenAPI } from '../../openapi/index.js'
import type { Layout, TakibiHonoOptions } from '../layout.js'

/** `useOpenAPI` adds a per-lib `ref` key for `$ref` registration; `split: true` writes one file per schema + barrel. */
export async function makeSchemas(
  openapi: OpenAPI,
  schemaLib: 'zod' | 'valibot' | 'typebox' | 'arktype' | 'effect',
  useOpenAPI: boolean,
  ohConfig: TakibiHonoOptions | undefined,
  layout: Layout,
) {
  if (!openapi.components?.schemas) return { ok: true, value: undefined } as const
  const schemasConfig = ohConfig?.components?.schemas
  const exportTypes = schemasConfig?.exportTypes ?? false
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
