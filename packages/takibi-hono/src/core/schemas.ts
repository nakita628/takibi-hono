import path from 'node:path'

import { emit } from '../emit/index.js'
import { getLibraryConfig } from '../generator/imports.js'
import { extractSchemaExports } from '../generator/schema-expression.js'
import { ast, detectCircularRefs, getLazyWrapper } from '../helper/ast.js'
import { zodType } from '../helper/type.js'
import type { Schema } from '../openapi/index.js'
import { toPascalCase } from '../utils/index.js'

export async function makeSchemasCode(
  schemas: { readonly [k: string]: Schema },
  schemaLib: 'zod' | 'valibot' | 'typebox' | 'arktype' | 'effect',
  options?: {
    readonly exportTypes?: boolean | undefined
    readonly readonly?: boolean | undefined
    readonly registerRef?: boolean | undefined
  },
) {
  const config = getLibraryConfig(schemaLib)
  const exportTypes = options?.exportTypes ?? false
  const readonly = options?.readonly ?? false
  const registerRef = options?.registerRef ?? false
  const declarations: string[] = []
  const circularNames = detectCircularRefs(schemas)
  const schemaNames = Object.keys(schemas)
  const cyclicGroupPascal = new Set([...circularNames].map((n) => toPascalCase(n)))
  for (const [name, schema] of Object.entries(schemas)) {
    const rawDecl = extractSchemaExports(name, schema, schemaLib, exportTypes, readonly)
    declarations.push(
      processDeclaration(rawDecl, name, schema, schemaLib, {
        schemaNames,
        circularNames,
        cyclicGroupPascal,
        readonly,
        registerRef,
      }),
    )
  }
  const declarationsCode = declarations.join('\n')
  const sortedDeclarations = ast(declarationsCode)
  const imports = [config.schemaImport]
  if (schemaLib === 'typebox' && exportTypes) {
    imports.push("import type{Static}from'typebox'")
  }
  return [...imports, '', sortedDeclarations].join('\n')
}

export async function makeSplitSchemas(
  schemas: { readonly [k: string]: Schema },
  schemaLib: 'zod' | 'valibot' | 'typebox' | 'arktype' | 'effect',
  outputDir: string,
  options?: {
    readonly exportTypes?: boolean | undefined
    readonly readonly?: boolean | undefined
    readonly registerRef?: boolean | undefined
  },
) {
  const config = getLibraryConfig(schemaLib)
  const exportTypes = options?.exportTypes ?? false
  const readonly = options?.readonly ?? false
  const registerRef = options?.registerRef ?? false
  const schemaNames = Object.keys(schemas)
  const circularNames = detectCircularRefs(schemas)
  const cyclicGroupPascal = new Set([...circularNames].map((n) => toPascalCase(n)))
  for (const name of schemaNames) {
    const rawDecl = extractSchemaExports(name, schemas[name], schemaLib, exportTypes, readonly)
    const decl = processDeclaration(rawDecl, name, schemas[name], schemaLib, {
      schemaNames,
      circularNames,
      cyclicGroupPascal,
      readonly,
      registerRef,
    })
    const deps = findSchemaRefs(decl, name).filter((d) => d in schemas)
    const lines: string[] = []
    lines.push(config.schemaImport)
    if (schemaLib === 'typebox' && exportTypes) {
      lines.push("import type{Static}from'typebox'")
    }
    if (deps.length > 0) {
      const sortedDeps = deps.toSorted()
      for (const dep of sortedDeps) {
        const depVar = `${toPascalCase(dep)}Schema`
        const depFile = `./${uncapitalize(dep)}`
        lines.push(`import{${depVar}}from'${depFile}'`)
      }
    }
    lines.push('')
    lines.push(decl)
    const fileName = `${uncapitalize(name)}.ts`
    const filePath = path.join(outputDir, fileName)
    const result = await emit(lines.join('\n'), outputDir, filePath)
    if (!result.ok) return result
  }
  const barrelCode = schemaNames
    .toSorted()
    .map((name) => `export*from'./${uncapitalize(name)}'`)
    .join('\n')
  const barrelPath = path.join(outputDir, 'index.ts')
  const barrelResult = await emit(barrelCode, outputDir, barrelPath)
  if (!barrelResult.ok) return barrelResult
  return { ok: true, value: undefined } as const
}

function processDeclaration(
  rawDecl: string,
  name: string,
  schema: Schema,
  schemaLib: 'zod' | 'valibot' | 'typebox' | 'arktype' | 'effect',
  ctx: {
    readonly schemaNames: readonly string[]
    readonly circularNames: ReadonlySet<string>
    readonly cyclicGroupPascal: ReadonlySet<string>
    readonly readonly: boolean
    readonly registerRef: boolean
  },
) {
  const pascalName = toPascalCase(name)
  const varName = `${pascalName}Schema`
  const needsLazy = ctx.circularNames.has(name)
  // ref registration is only meaningful when the project emits hono-openapi
  // routes; in plain Hono mode the components.schemas section is unused.
  const maybeInjectRef = (decl: string) =>
    ctx.registerRef ? injectRef(decl, name, schemaLib, hasOuterMeta(schema)) : decl
  if (needsLazy && schemaLib === 'zod') {
    const typeDef = zodType(schema, pascalName, ctx.cyclicGroupPascal, ctx.readonly)
    const wrapper = getLazyWrapper(schemaLib)
    const annotated = addTypeAnnotation(rawDecl, varName, `${pascalName}Type`)
    const wrapped = wrapper.open ? wrapWithLazy(annotated, name, wrapper) : annotated
    const unwrapped = wrapped.replace(
      /z\.lazy\(\(\)\s*=>\s*([A-Za-z_$][A-Za-z0-9_$]*Schema)\)/g,
      '$1',
    )
    return maybeInjectRef(`${typeDef}\n\n${unwrapped}`)
  }

  if (needsLazy) {
    const wrapper = getLazyWrapper(schemaLib)
    const wrapped = wrapper.open ? wrapWithLazy(rawDecl, name, wrapper) : rawDecl
    const unwrapped = unwrapNonCircularLazy(
      wrapped,
      name,
      ctx.schemaNames,
      ctx.circularNames,
      schemaLib,
    )
    return maybeInjectRef(addCircularTypeAnnotation(unwrapped, varName, schemaLib))
  }
  return maybeInjectRef(
    unwrapNonCircularLazy(rawDecl, name, ctx.schemaNames, ctx.circularNames, schemaLib),
  )
}

/**
 * Returns true if the OUTER schema carries any meta key that schema-to-library
 * encodes as a library-level meta call (description / example / examples /
 * deprecated). Used to decide whether typebox already has an `opts` 2nd arg.
 */
function hasOuterMeta(schema: Schema): boolean {
  return Boolean(
    schema.description ||
    schema.example !== undefined ||
    schema.examples !== undefined ||
    schema.deprecated === true,
  )
}

/**
 * Adds a library-specific `ref` registration key to a component schema
 * declaration so that hono-openapi (via `@standard-community/standard-openapi`)
 * registers it under `components.schemas[<name>]` and emits `$ref` at use
 * sites instead of inlining the schema.
 *
 * Strategy: schema-to-library has already produced the schema body with all
 * meta (`description`, `examples`, `deprecated`) baked into each library's
 * idiomatic call. We MERGE the registration key into that existing meta call
 * (preserving everything schema-to-library emitted) — or attach a fresh call
 * if none exists. This keeps the schema-to-library output as the source of
 * truth for meta and avoids duplicating per-library meta knowledge.
 *
 * - zod: merge `ref` into `.meta({...})` (last occurrence = outer schema)
 * - valibot: merge `ref` into `v.metadata({...})`, or extend `v.pipe(...)`
 * - typebox: inject `ref` into the `Type.X(body, {opts})` 2nd-arg options
 * - arktype: append `.configure({ ref })` (independent of `.describe()`)
 * - effect: merge `identifier` into `.annotations({...})`
 */
function injectRef(
  decl: string,
  name: string,
  schemaLib: 'zod' | 'valibot' | 'typebox' | 'arktype' | 'effect',
  hasMeta: boolean,
): string {
  // Split off the `\n\nexport type ...` tail, transform the const part, then rejoin.
  const splitIdx = decl.search(/\n\nexport\s+type\b/)
  const constPart = splitIdx === -1 ? decl : decl.slice(0, splitIdx)
  const tail = splitIdx === -1 ? '' : decl.slice(splitIdx)
  const refStr = JSON.stringify(name)
  const transformed = ((): string => {
    switch (schemaLib) {
      case 'zod':
        return (
          injectAtLast(constPart, '.meta({', `.meta({ref:${refStr},`) ??
          `${constPart}.meta({ref:${refStr}})`
        )
      case 'effect':
        return (
          injectAtLast(constPart, '.annotations({', `.annotations({identifier:${refStr},`) ??
          `${constPart}.annotations({identifier:${refStr}})`
        )
      case 'valibot': {
        const replaced = injectAtLast(constPart, 'v.metadata({', `v.metadata({ref:${refStr},`)
        if (replaced !== null) return replaced
        if (/=\s*v\.pipe\(/.test(constPart)) {
          // Insert `,v.metadata({ref:...})` before the trailing `)` of v.pipe.
          return constPart.replace(/\)$/, `,v.metadata({ref:${refStr}}))`)
        }
        // No v.pipe — wrap the right-hand side in a fresh v.pipe.
        return constPart.replace(
          /^(export\s+const\s+[A-Za-z_$][\w$]*Schema(?:\s*:\s*[^=]+)?\s*=\s*)([\s\S]*)$/,
          `$1v.pipe($2,v.metadata({ref:${refStr}}))`,
        )
      }
      case 'typebox':
        // schema-to-library emits `Type.X(body, {opts})` only when meta is
        // present. With meta we extend the existing opts; otherwise we attach
        // a fresh 2nd-arg.
        return hasMeta
          ? (injectAtLast(constPart, '},{', `},{ref:${refStr},`) ?? constPart)
          : constPart.replace(/\)(\s*)$/, `,{ref:${refStr}})$1`)
      case 'arktype':
        return `${constPart}.configure({ref:${refStr}})`
    }
  })()
  return transformed + tail
}

/**
 * Replaces the LAST occurrence of `needle` in `code` with `replacement`.
 * Returns `null` if `needle` is not found. The "last" occurrence targets the
 * outermost schema's meta call: property-level meta calls (on object props)
 * appear earlier in the source; the outer schema's meta call comes last.
 */
function injectAtLast(code: string, needle: string, replacement: string): string | null {
  const idx = code.lastIndexOf(needle)
  if (idx === -1) return null
  return code.slice(0, idx) + replacement + code.slice(idx + needle.length)
}

function findSchemaRefs(code: string, selfName: string): readonly string[] {
  const re = /\b([A-Za-z_$][A-Za-z0-9_$]*)Schema\b/g
  const selfPascal = toPascalCase(selfName)
  const found = new Set<string>()
  for (const m of code.matchAll(re)) {
    const base = m[1] ?? ''
    if (base && base !== selfPascal) found.add(base)
  }
  return [...found]
}

function uncapitalize(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1)
}

function addTypeAnnotation(decl: string, varName: string, typeName: string) {
  return decl.replace(
    new RegExp(`(export\\s+const\\s+${varName})\\s*=`),
    `$1:z.ZodType<${typeName}>=`,
  )
}

function addCircularTypeAnnotation(
  decl: string,
  varName: string,
  schemaLib: 'zod' | 'valibot' | 'typebox' | 'arktype' | 'effect',
): string {
  const typeMap: Partial<Record<'zod' | 'valibot' | 'typebox' | 'arktype' | 'effect', string>> = {
    valibot: 'v.GenericSchema',
    effect: 'Schema.Schema<any>',
  }
  const annotation = typeMap[schemaLib]
  if (!annotation) return decl
  return decl.replace(new RegExp(`(export\\s+const\\s+${varName})\\s*=`), `$1:${annotation}=`)
}

function unwrapNonCircularLazy(
  decl: string,
  selfName: string,
  allSchemaNames: readonly string[],
  circularNames: ReadonlySet<string>,
  schemaLib: 'zod' | 'valibot' | 'typebox' | 'arktype' | 'effect',
) {
  const selfPascal = toPascalCase(selfName)
  const selfVarName = `${selfPascal}Schema`
  const needsLazy = new Set<string>()
  for (const name of allSchemaNames) {
    if (circularNames.has(name)) {
      needsLazy.add(`${toPascalCase(name)}Schema`)
    }
  }
  if (circularNames.has(selfName)) {
    needsLazy.add(selfVarName)
  }
  switch (schemaLib) {
    case 'zod':
      return decl.replace(
        /z\.lazy\(\(\)\s*=>\s*([A-Za-z_$][A-Za-z0-9_$]*Schema)\)/g,
        (match, varName) => {
          if (needsLazy.has(varName)) return match
          return varName
        },
      )
    case 'typebox':
      if (circularNames.has(selfName)) {
        decl = decl.replace(
          /Type\.Recursive\(\(_?Self\)\s*=>\s*([A-Za-z_$][A-Za-z0-9_$]*Schema)\)/g,
          (_match, varName) => {
            if (varName === selfVarName) return 'This'
            return varName
          },
        )
      }
      return decl
    default:
      return decl
  }
}

function wrapWithLazy(
  decl: string,
  name: string,
  wrapper: { readonly open: string; readonly close: string },
) {
  const pascalName = toPascalCase(name)
  const pattern = new RegExp(`^(export\\s+const\\s+${pascalName}Schema[^=]*=\\s*)(.+)$`)
  const lines = decl.split('\n')
  const idx = lines.findIndex((line) => pattern.test(line))
  if (idx === -1) return decl
  const match = lines[idx].match(pattern)
  if (!match) return decl
  return [
    ...lines.slice(0, idx),
    `${match[1]}${wrapper.open}${match[2]}${wrapper.close}`,
    ...lines.slice(idx + 1),
  ].join('\n')
}
