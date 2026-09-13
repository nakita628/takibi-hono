import type { Schema, SchemaLib } from 'oas-truth'
import { makeSchemaDeclarations as declareSchemas, toIdentifierPascalCase } from 'oas-truth'

import { getLibrary, makeInlineAdapter } from '../helper/library.js'

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

/** `name`, or the first of `name2`, `name3`, … not in `used`. */
function claimName(name: string, used: ReadonlySet<string>, i = 2): string {
  if (!used.has(name)) return name
  return used.has(`${name}${i}`) ? claimName(name, used, i + 1) : `${name}${i}`
}

/**
 * `toIdentifierPascalCase` folds `user` and `User` into one identifier; later
 * colliders get a numeric suffix so no declaration is lost. A `$ref` to a later
 * collider still resolves to the first declaration.
 */
export function makeSchemaIdentifiers(schemas: { readonly [k: string]: Schema }) {
  return Object.keys(schemas).reduce(
    (acc, key) => acc.set(key, claimName(toIdentifierPascalCase(key), new Set(acc.values()))),
    new Map<string, string>(),
  )
}

/**
 * One `export const <X>Schema=...` declaration per `components.schemas` entry,
 * through oas-truth. Host options: the OpenAPI key as the type name, and
 * hono-openapi ref registration.
 */
export function makeSchemaDeclarations(
  schemas: { readonly [k: string]: Schema },
  options: SchemaOptions,
) {
  const library = getLibrary(options.lib)
  const adapter = makeInlineAdapter(options.lib, { resolver: false })
  return declareSchemas(schemas, adapter, {
    exportTypes: options.exportTypes,
    readonly: options.readonly,
    typeAlias: 'key',
    ...(options.registerRef && {
      wrapDeclaration: (expr: string, name: string) => library.withRef(expr, name),
    }),
  })
}

/** Prologue the schema module(s) need besides imports. */
export function makeSchemasPrologue(options: SchemaOptions) {
  return options.lib === 'arktype' && options.registerRef ? `${ARKTYPE_REF_AUGMENTATION}\n\n` : ''
}
