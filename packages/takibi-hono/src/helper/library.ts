import type { ComponentAdapter, SchemaLib, SchemaSlot } from 'oas-truth'
import { makeAdapter } from 'oas-truth'

import type { ImportEntry } from './imports.js'

/**
 * What takibi-hono needs per validator library beyond oas-truth's adapter: the
 * validator bridges and the identifiers generated code may import.
 */
type Library = {
  /** Standard Schema bridge for hono-openapi's `validator` / `resolver`. */
  readonly toStandardSchema: (expr: string) => string
  /** The Hono validator middleware used without hono-openapi, and its schema bridge. */
  readonly validator: { readonly entry: ImportEntry; readonly wrap: (expr: string) => string }
  /** Identifiers a type alias must not claim (they would shadow an import). */
  readonly reserved: readonly string[]
  readonly imports: readonly ImportEntry[]
}

const STANDARD_VALIDATOR: ImportEntry = { name: 'sValidator', from: '@hono/standard-validator' }

const LIBRARIES: { readonly [K in SchemaLib]: Library } = {
  zod: {
    toStandardSchema: (expr) => expr,
    validator: { entry: STANDARD_VALIDATOR, wrap: (expr) => expr },
    reserved: [],
    imports: [{ name: 'z', from: 'zod', style: 'namespace' }],
  },
  valibot: {
    toStandardSchema: (expr) => expr,
    validator: { entry: STANDARD_VALIDATOR, wrap: (expr) => expr },
    reserved: [],
    imports: [{ name: 'v', from: 'valibot', style: 'namespace' }],
  },
  typebox: {
    toStandardSchema: (expr) => `Compile(${expr})`,
    validator: {
      entry: { name: 'tbValidator', from: '@hono/typebox-validator' },
      wrap: (expr) => expr,
    },
    reserved: ['Type', 'Codec', 'Static', 'Compile'],
    imports: [
      { name: 'Type', from: 'typebox' },
      { name: 'Codec', from: 'typebox' },
      { name: 'Static', from: 'typebox', style: 'type' },
      { name: 'Compile', from: 'typebox/compile' },
    ],
  },
  arktype: {
    toStandardSchema: (expr) => expr,
    validator: { entry: STANDARD_VALIDATOR, wrap: (expr) => expr },
    reserved: [],
    imports: [
      { name: 'type', from: 'arktype' },
      { name: 'scope', from: 'arktype' },
    ],
  },
  effect: {
    toStandardSchema: (expr) => `Schema.toStandardSchemaV1(${expr})`,
    validator: {
      entry: STANDARD_VALIDATOR,
      wrap: (expr) => `Schema.toStandardSchemaV1(${expr})`,
    },
    reserved: ['Schema', 'Effect'],
    imports: [
      { name: 'Effect', from: 'effect' },
      { name: 'Schema', from: 'effect' },
    ],
  },
}

export function getLibrary(lib: SchemaLib) {
  return LIBRARIES[lib]
}

export type InlineAdapterOptions = {
  readonly resolver: boolean
  /**
   * When set, `wrapSchema` only wraps these slots. Omitted (with `resolver`)
   * wraps every slot — component builders still want `resolver(...)` on
   * request bodies and media types.
   */
  readonly slots?: readonly SchemaSlot[]
}

/**
 * oas-truth's adapter plus the host `reservedTypeNames` (so a schema named
 * `Compile` cannot shadow the TypeBox import) and, in hono-openapi mode,
 * `resolver(...)` around each chosen `schema:` slot.
 */
export function makeInlineAdapter(lib: SchemaLib, options: InlineAdapterOptions): ComponentAdapter {
  const adapter = makeAdapter(lib)
  const { reserved, toStandardSchema } = LIBRARIES[lib]
  const slots = options.slots && new Set(options.slots)
  return {
    ...adapter,
    reservedTypeNames: [...new Set([...(adapter.reservedTypeNames ?? []), ...reserved])],
    ...(options.resolver && {
      wrapSchema: (expr: string, slot?: SchemaSlot) => {
        if (slots && slot !== undefined && !slots.has(slot)) return expr
        return `resolver(${toStandardSchema(expr)})`
      },
    }),
  }
}

/** Imports any generated module may need; `makeImports` keeps only the referenced ones. */
export function makeLibraryImports(lib: SchemaLib): readonly ImportEntry[] {
  return [
    { name: 'Hono', from: 'hono' },
    { name: 'describeRoute', from: 'hono-openapi' },
    { name: 'resolver', from: 'hono-openapi' },
    { name: 'validator', from: 'hono-openapi' },
    LIBRARIES[lib].validator.entry,
    ...LIBRARIES[lib].imports,
  ]
}
