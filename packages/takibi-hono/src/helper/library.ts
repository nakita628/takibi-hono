import type { ComponentAdapter, SchemaLib } from 'oas-truth'
import { makeAdapter } from 'oas-truth'
import { ts } from 'ts-morph'

import type { ImportEntry } from './imports.js'

/**
 * What takibi-hono needs per validator library beyond oas-truth's adapter: the
 * lazy wrapper a `$ref` cycle needs, the validator bridges, hono-openapi `ref`
 * registration, and the identifiers generated code may import.
 */
type Library = {
  /**
   * Deferred reference: `pattern` matches the wrapper schema-to-library emits around
   * a `$ref`, `wrap` builds it. TypeBox and arktype express cycles with containers.
   */
  readonly lazy:
    | { readonly pattern: RegExp; readonly wrap: (varName: string) => string }
    | undefined
  /** Annotation that breaks TS7022 on a self/mutually recursive declaration. */
  readonly cyclicAnnotation: ((typeName: string) => string) | undefined
  /** Standard Schema bridge for hono-openapi's `validator` / `resolver`. */
  readonly toStandardSchema: (expr: string) => string
  /** The Hono validator middleware used without hono-openapi, and its schema bridge. */
  readonly validator: { readonly entry: ImportEntry; readonly wrap: (expr: string) => string }
  readonly withRef: (expr: string, ref: string) => string
  /** Identifiers a type alias must not claim (they would shadow an import). */
  readonly reserved: readonly string[]
  readonly imports: readonly ImportEntry[]
}

const STANDARD_VALIDATOR: ImportEntry = { name: 'sValidator', from: '@hono/standard-validator' }

/** The argument a TypeBox builder takes its options in, when it is not the second. */
const TYPEBOX_OPTIONS_INDEX: { readonly [builder: string]: number } = {
  Any: 0,
  BigInt: 0,
  Boolean: 0,
  Integer: 0,
  Never: 0,
  Null: 0,
  Number: 0,
  String: 0,
  Undefined: 0,
  Unknown: 0,
  Void: 0,
  Cyclic: 2,
  Record: 2,
}

/**
 * TypeBox schemas take `ref` in the outermost builder's options object, which
 * schema-to-library emits only when it has something to put there. Parsing
 * finds that argument (or its slot) without guessing from the text.
 */
function withTypeboxRef(expr: string, ref: string) {
  const source = ts.createSourceFile('ref.ts', `(${expr})`, ts.ScriptTarget.Latest, true)
  const statement = source.statements[0]
  const root =
    statement &&
    ts.isExpressionStatement(statement) &&
    ts.isParenthesizedExpression(statement.expression)
      ? statement.expression.expression
      : undefined
  const call = root && findOptionsCall(root)
  if (!call || !ts.isPropertyAccessExpression(call.expression)) return expr
  const entry = `ref:${JSON.stringify(ref)}`
  const index = TYPEBOX_OPTIONS_INDEX[call.expression.name.text] ?? 1
  const options = call.arguments[index]
  // Positions are in `(${expr})`, one character ahead of `expr`.
  if (options && ts.isObjectLiteralExpression(options)) {
    const at = options.getStart(source)
    return `${expr.slice(0, at)}${entry},${expr.slice(at)}`
  }
  if (call.arguments.length !== index) return expr
  const at = call.getEnd() - 2
  return `${expr.slice(0, at)}${index === 0 ? '' : ','}{${entry}}${expr.slice(at)}`
}

/** The outermost `Type.X(...)` call that takes options; `Type.Readonly(inner)` defers to `inner`. */
function findOptionsCall(node: ts.Node): ts.CallExpression | undefined {
  if (!ts.isCallExpression(node) || !ts.isPropertyAccessExpression(node.expression)) {
    return undefined
  }
  if (node.expression.name.text !== 'Readonly') return node
  const inner = node.arguments[0]
  return inner ? findOptionsCall(inner) : undefined
}

const LIBRARIES: { readonly [K in SchemaLib]: Library } = {
  zod: {
    lazy: { pattern: /z\.lazy\(\(\)\s*=>\s*(\w+)\)/gu, wrap: (name) => `z.lazy(() => ${name})` },
    cyclicAnnotation: (typeName) => `z.ZodType<${typeName}>`,
    toStandardSchema: (expr) => expr,
    validator: { entry: STANDARD_VALIDATOR, wrap: (expr) => expr },
    withRef: (expr, ref) => `${expr}.meta({ref:${JSON.stringify(ref)}})`,
    reserved: [],
    imports: [{ name: 'z', from: 'zod', style: 'namespace' }],
  },
  valibot: {
    lazy: { pattern: /v\.lazy\(\(\)\s*=>\s*(\w+)\)/gu, wrap: (name) => `v.lazy(() => ${name})` },
    cyclicAnnotation: (typeName) => `v.GenericSchema<${typeName}>`,
    toStandardSchema: (expr) => expr,
    validator: { entry: STANDARD_VALIDATOR, wrap: (expr) => expr },
    // Each `v.metadata` action is read with the pipe state before it, so appending keeps the rest.
    withRef: (expr, ref) => `v.pipe(${expr},v.metadata({ref:${JSON.stringify(ref)}}))`,
    reserved: [],
    imports: [{ name: 'v', from: 'valibot', style: 'namespace' }],
  },
  typebox: {
    lazy: undefined,
    cyclicAnnotation: undefined,
    toStandardSchema: (expr) => `Compile(${expr})`,
    validator: {
      entry: { name: 'tbValidator', from: '@hono/typebox-validator' },
      wrap: (expr) => expr,
    },
    withRef: withTypeboxRef,
    reserved: ['Type', 'Codec', 'Static', 'Compile'],
    imports: [
      { name: 'Type', from: 'typebox' },
      { name: 'Codec', from: 'typebox' },
      { name: 'Static', from: 'typebox', style: 'type' },
      { name: 'Compile', from: 'typebox/compile' },
    ],
  },
  arktype: {
    lazy: undefined,
    cyclicAnnotation: undefined,
    toStandardSchema: (expr) => expr,
    validator: { entry: STANDARD_VALIDATOR, wrap: (expr) => expr },
    withRef: (expr, ref) => `${expr}.configure({ref:${JSON.stringify(ref)}})`,
    reserved: [],
    imports: [
      { name: 'type', from: 'arktype' },
      { name: 'scope', from: 'arktype' },
    ],
  },
  effect: {
    lazy: {
      pattern: /Schema\.suspend\(\(\)\s*=>\s*(\w+)\)/gu,
      wrap: (name) => `Schema.suspend(() => ${name})`,
    },
    // `Codec` (not `Schema`) keeps the decoding services `never`, as `toStandardSchemaV1` requires.
    cyclicAnnotation: () => 'Schema.Codec<any>',
    toStandardSchema: (expr) => `Schema.toStandardSchemaV1(${expr})`,
    validator: {
      entry: STANDARD_VALIDATOR,
      wrap: (expr) => `Schema.toStandardSchemaV1(${expr})`,
    },
    withRef: (expr, ref) => `${expr}.annotate({identifier:${JSON.stringify(ref)}})`,
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

/**
 * oas-truth's adapter for inline schemas. Inline schemas only reference declared
 * components, so every lazy wrapper is unwrapped (oas-truth does so for zod and
 * valibot, not Effect). `resolver` wraps each `schema:` slot for hono-openapi.
 */
export function makeInlineAdapter(
  lib: SchemaLib,
  options: { readonly resolver: boolean },
): ComponentAdapter {
  const adapter = makeAdapter(lib)
  const { lazy, toStandardSchema } = LIBRARIES[lib]
  return {
    ...adapter,
    toExpression: (schema, paramIn) => {
      const expr = adapter.toExpression(schema, paramIn)
      return lazy ? expr.replaceAll(lazy.pattern, '$1') : expr
    },
    ...(options.resolver && {
      wrapSchema: (expr: string) => `resolver(${toStandardSchema(expr)})`,
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
