import type { ComponentAdapter, Schema, SchemaLib } from 'oas-truth'
import { isRecord, schemaRefToName, toIdentifierPascalCase } from 'oas-truth'

import { analyzeSchemas, collectSchemaRefs, makeCyclicType } from '../helper/graph.js'
import { wrapReferences } from '../helper/identifiers.js'
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

/** Keys whose value is a subschema (or a list of them) and keys whose value maps names to subschemas. */
const SUBSCHEMA_KEYS: ReadonlySet<string> = new Set([
  'items',
  'prefixItems',
  'additionalProperties',
  'allOf',
  'anyOf',
  'oneOf',
  'not',
  'if',
  'then',
  'else',
  'contains',
  'propertyNames',
  'unevaluatedItems',
  'unevaluatedProperties',
  'contentSchema',
])
const SUBSCHEMA_MAP_KEYS: ReadonlySet<string> = new Set([
  'properties',
  'patternProperties',
  'dependentSchemas',
  '$defs',
])

function isSchema(value: unknown): value is Schema {
  return isRecord(value)
}

/** Rewrites a schema bottom-up with `fn`, following only subschemas (never example or default values). */
function mapSchema(schema: Schema, fn: (node: Schema) => Schema): Schema {
  const map = (value: unknown): unknown => (isSchema(value) ? mapSchema(value, fn) : value)
  const node = Object.fromEntries(
    Object.entries(schema).map(([key, value]) => {
      if (SUBSCHEMA_KEYS.has(key)) return [key, Array.isArray(value) ? value.map(map) : map(value)]
      if (SUBSCHEMA_MAP_KEYS.has(key) && isRecord(value)) {
        return [key, Object.fromEntries(Object.entries(value).map(([k, v]) => [k, map(v)]))]
      }
      return [key, value]
    }),
  )
  return fn(isSchema(node) ? node : schema)
}

/**
 * `readonly` as the declarative `x-readonly` extension on every object and array,
 * which schema-to-library turns into each library's readonly form.
 */
function markReadonly(schema: Schema) {
  return mapSchema(schema, (node) => {
    const types = new Set<unknown>([node.type].flat())
    return types.has('object') || types.has('array') ? { ...node, 'x-readonly': true } : node
  })
}

/**
 * TypeBox and arktype cannot express a cycle with standalone `const`s: the group
 * becomes one `Type.Cyclic(...)` / `scope(...)` container and each member selects
 * its entry. schema-to-library builds the container from a `$defs` document.
 */
function makeCyclicContainer(
  varName: string,
  group: readonly string[],
  schemas: { readonly [k: string]: Schema },
  idents: ReadonlyMap<string, string>,
  adapter: ComponentAdapter,
  lib: 'typebox' | 'arktype',
) {
  const groupIdents = new Map(group.map((name) => [name, idents.get(name) ?? name]))
  // `#/$defs/...` is outside oas-truth's `Ref` type, hence the untyped rebuild.
  const localize = (node: Schema): Schema => {
    const ident = node.$ref ? groupIdents.get(schemaRefToName(node.$ref)) : undefined
    if (ident === undefined) return node
    const local = Object.fromEntries([...Object.entries(node), ['$ref', `#/$defs/${ident}Schema`]])
    return isSchema(local) ? local : node
  }
  const $defs = Object.fromEntries(
    group.map((name) => [
      `${groupIdents.get(name)}Schema`,
      mapSchema(schemas[name] ?? {}, localize),
    ]),
  )
  const code = adapter.toExpression({ title: varName, $defs })
  if (lib === 'typebox') return code
  const body = code.match(/scope\(\{([\s\S]*)\}\)\.export\(\)/u)?.[1]
  if (body === undefined) return undefined
  // A reference leaving the group is a string keyword inside `scope`; alias it to the declared schema.
  const external = [...new Set(group.flatMap((name) => collectSchemaRefs(schemas[name])))].flatMap(
    (name) => (groupIdents.has(name) || !idents.has(name) ? [] : [`${idents.get(name)}Schema`]),
  )
  return `scope({${[...external.map((ref) => `${ref}:${ref}`), body].join(',')}}).export().${varName}`
}

/**
 * One `export const <X>Schema=...` declaration per `components.schemas` entry,
 * in dependency-first order, through oas-truth's adapter. Only references inside a
 * `$ref` cycle are lazy (and their declarations get the annotation TS needs);
 * every other reference is a plain identifier, declared earlier.
 */
export function makeSchemaDeclarations(
  schemas: { readonly [k: string]: Schema },
  options: SchemaOptions,
) {
  const library = getLibrary(options.lib)
  const adapter = makeInlineAdapter(options.lib, { resolver: false })
  const prepared = Object.fromEntries(
    Object.entries(schemas).map(([name, schema]) => [
      name,
      options.readonly ? markReadonly(schema) : schema,
    ]),
  )
  const idents = makeSchemaIdentifiers(schemas)
  const { order, cycles } = analyzeSchemas(schemas)
  const taken = new Set([...idents.values(), ...library.reserved])
  const infer = (varName: string) =>
    adapter.renderTypeInfer(varName).replace(`export type ${varName}=`, '')
  return order.map((name) => {
    const schema = prepared[name] ?? {}
    const ident = idents.get(name) ?? toIdentifierPascalCase(name)
    const varName = `${ident}Schema`
    const group = cycles.get(name)
    // A readonly arktype node renders as `type(...).readonly()`, which cannot resolve `scope`
    // aliases; its container is built plain and the selected member made readonly instead.
    const arktypeReadonly = options.lib === 'arktype' && options.readonly
    const container =
      group && (options.lib === 'typebox' || options.lib === 'arktype')
        ? makeCyclicContainer(
            varName,
            group,
            arktypeReadonly ? schemas : prepared,
            idents,
            adapter,
            options.lib,
          )
        : undefined
    const member = container && arktypeReadonly ? `${container}.readonly()` : container
    const expression = member ?? adapter.toExpression({ ...schema, title: varName })
    // The adapter unwraps every lazy reference; a reference inside the cycle needs it back.
    const body = library.lazy
      ? wrapReferences(
          expression,
          new Set((group ?? []).map((peer) => `${idents.get(peer)}Schema`)),
          library.lazy.wrap,
        )
      : expression
    const value = options.registerRef ? library.withRef(body, name) : body
    const helper = group && library.cyclicAnnotation ? claimName(`${ident}Type`, taken) : undefined
    const typeDef =
      helper && options.lib !== 'effect'
        ? `${makeCyclicType(name, helper, schema, (ref) => infer(`${idents.get(ref) ?? toIdentifierPascalCase(ref)}Schema`), options.readonly)}\n\n`
        : ''
    const annotation =
      helper && library.cyclicAnnotation ? `:${library.cyclicAnnotation(helper)}` : ''
    const typeName = library.reserved.includes(ident) ? `${ident}Type` : ident
    const typeExport = options.exportTypes ? `\n\nexport type ${typeName}=${infer(varName)}` : ''
    return {
      name,
      varName,
      fileName: `${ident.charAt(0).toLowerCase()}${ident.slice(1)}`,
      code: `${typeDef}export const ${varName}${annotation}=${value}${typeExport}`,
    }
  })
}

/** Prologue the schema module(s) need besides imports. */
export function makeSchemasPrologue(options: SchemaOptions) {
  return options.lib === 'arktype' && options.registerRef ? `${ARKTYPE_REF_AUGMENTATION}\n\n` : ''
}
