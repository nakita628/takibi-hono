import type { Schema, SchemaLib } from 'oas-truth'
import { makeSchemaDeclarations as declareSchemas } from 'oas-truth'

import { makeInlineAdapter } from '../helper/library.js'

type SchemaOptions = {
  readonly lib: SchemaLib
  readonly exportTypes: boolean
  readonly readonly: boolean
  /** Register each schema under `components.schemas` in the hono-openapi document. */
  readonly registerRef: boolean
}

/**
 * arktype's `TypeMeta` is closed; augmenting `ArkEnv.meta` is its documented way
 * to let `.configure({ ref })` typecheck.
 */
const ARKTYPE_REF_AUGMENTATION = 'declare global{interface ArkEnv{meta():{ref?:string}}}'

/**
 * One `export const <X>Schema=...` declaration per `components.schemas` entry,
 * through oas-truth. Host options: the OpenAPI key as the type name, and
 * hono-openapi ref registration (`ref: true`).
 */
export function makeSchemaDeclarations(
  schemas: { readonly [k: string]: Schema },
  options: SchemaOptions,
) {
  const adapter = makeInlineAdapter(options.lib, { resolver: false })
  return declareSchemas(schemas, adapter, {
    exportTypes: options.exportTypes,
    readonly: options.readonly,
    typeAlias: 'key',
    ...(options.registerRef && { ref: true }),
  })
}

/** Prologue the schema module(s) need besides imports. */
export function makeSchemasPrologue(options: SchemaOptions) {
  return options.lib === 'arktype' && options.registerRef ? `${ARKTYPE_REF_AUGMENTATION}\n\n` : ''
}
