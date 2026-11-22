import type { ComponentAdapter, SchemaLib, SchemaSlot } from 'oas-truth'
import { makeAdapter } from 'oas-truth'

import type { ImportEntry, LocalEntry } from './imports.js'

/**
 * What takibi-hono needs per validator library beyond oas-truth's adapter: the
 * validator bridges and the identifiers generated code may import.
 */
type Library = {
  /** Standard Schema bridge for hono-openapi's `validator` / `resolver`. */
  readonly toStandardSchema: (expr: string) => string
  /**
   * The schema as a `defineHandler` option. Hono types each option as a Standard Schema or a
   * validation function; a library whose schema is callable (arktype) is handed over as the
   * plain `{ '~standard' }` object, which is what Hono reads. `undefined` for a library with
   * no Standard Schema interface, which `defineHandler` cannot take.
   */
  readonly toDefineHandlerSchema: ((expr: string) => string) | undefined
  /** The Hono validator middleware used without hono-openapi, and its schema bridge. */
  readonly validator: { readonly entry: ImportEntry; readonly wrap: (expr: string) => string }
  /** Identifiers a type alias must not claim (they would shadow an import). */
  readonly reserved: readonly string[]
  readonly imports: readonly (ImportEntry | LocalEntry)[]
}

/**
 * TypeBox as a Standard Schema: the compiled `Validator` with a `~standard` that checks, then
 * decodes (a query or header Codec turns its text into the value), and reports each error at
 * its JSON Pointer as a path. Its `types` carry the encoded input and the decoded output, so
 * hono-openapi infers the request types. The vendor stays `typebox`, so hono-openapi's JSON
 * Schema conversion reads the schema from the validator's `Type()`.
 */
const TYPEBOX_STANDARD_SCHEMA =
  "const toStandardSchemaV1=<T extends TSchema>(schema:T)=>{const validator=Compile(schema);return Object.assign(validator,{'~standard':{version:1 as const,vendor:'typebox',validate:(value:unknown)=>validator.Check(value)?{value:validator.Decode(value)}:{issues:validator.Errors(value).map((error)=>({message:error.message,path:error.instancePath.split('/').slice(1).map((key)=>key.replaceAll('~1','/').replaceAll('~0','~'))}))},types:undefined as {readonly input:StaticEncode<T>;readonly output:StaticDecode<T>}|undefined}})}"

const STANDARD_VALIDATOR: ImportEntry = { name: 'sValidator', from: '@hono/standard-validator' }

const LIBRARIES: { readonly [K in SchemaLib]: Library } = {
  zod: {
    toStandardSchema: (expr) => expr,
    toDefineHandlerSchema: (expr) => expr,
    validator: { entry: STANDARD_VALIDATOR, wrap: (expr) => expr },
    reserved: [],
    imports: [{ name: 'z', from: 'zod', style: 'namespace' }],
  },
  valibot: {
    toStandardSchema: (expr) => expr,
    toDefineHandlerSchema: (expr) => expr,
    validator: { entry: STANDARD_VALIDATOR, wrap: (expr) => expr },
    reserved: [],
    imports: [{ name: 'v', from: 'valibot', style: 'namespace' }],
  },
  typebox: {
    // TypeBox 1.x has no `~standard`, and hono-openapi's `validator` and `resolver` take a
    // Standard Schema only: the module declares the bridge (`TYPEBOX_STANDARD_SCHEMA`).
    toStandardSchema: (expr) => `toStandardSchemaV1(${expr})`,
    toDefineHandlerSchema: undefined,
    validator: {
      entry: { name: 'tbValidator', from: '@hono/typebox-validator' },
      wrap: (expr) => expr,
    },
    reserved: [
      'Type',
      'Codec',
      'Static',
      'StaticDecode',
      'StaticEncode',
      'TSchema',
      'Compile',
      'toStandardSchemaV1',
    ],
    imports: [
      { name: 'Type', from: 'typebox' },
      { name: 'Codec', from: 'typebox' },
      { name: 'Static', from: 'typebox', style: 'type' },
      { name: 'StaticDecode', from: 'typebox', style: 'type' },
      { name: 'StaticEncode', from: 'typebox', style: 'type' },
      { name: 'TSchema', from: 'typebox', style: 'type' },
      { name: 'Compile', from: 'typebox/compile' },
      { name: 'toStandardSchemaV1', declaration: TYPEBOX_STANDARD_SCHEMA },
    ],
  },
  arktype: {
    toStandardSchema: (expr) => expr,
    // An arktype `Type` is callable, so Hono's `Validation` type (a Standard Schema or a
    // function) infers it both ways and overflows (TS2589) once the handler is registered
    // on a Hono. Its `~standard` alone is a plain object, and validates the same.
    toDefineHandlerSchema: (expr) => `{'~standard':${expr}['~standard']}`,
    validator: { entry: STANDARD_VALIDATOR, wrap: (expr) => expr },
    reserved: [],
    imports: [
      { name: 'type', from: 'arktype' },
      { name: 'scope', from: 'arktype' },
    ],
  },
  effect: {
    toStandardSchema: (expr) => `Schema.toStandardSchemaV1(${expr})`,
    toDefineHandlerSchema: (expr) => `Schema.toStandardSchemaV1(${expr})`,
    validator: {
      entry: STANDARD_VALIDATOR,
      wrap: (expr) => `Schema.toStandardSchemaV1(${expr})`,
    },
    reserved: ['Schema', 'Effect', 'SchemaTransformation'],
    imports: [
      { name: 'Effect', from: 'effect' },
      { name: 'Schema', from: 'effect' },
      // schema-truth spells the string transforms (`x-toLowerCase`, `x-toUpperCase`,
      // the boolean decode) through `SchemaTransformation`.
      { name: 'SchemaTransformation', from: 'effect' },
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
export function makeLibraryImports(lib: SchemaLib): readonly (ImportEntry | LocalEntry)[] {
  return [
    { name: 'Hono', from: 'hono' },
    { name: 'defineHandler', from: 'hono/factory' },
    { name: 'describeRoute', from: 'hono-openapi' },
    { name: 'resolver', from: 'hono-openapi' },
    { name: 'validator', from: 'hono-openapi' },
    LIBRARIES[lib].validator.entry,
    ...LIBRARIES[lib].imports,
  ]
}
