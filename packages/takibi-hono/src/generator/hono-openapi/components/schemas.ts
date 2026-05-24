import path from 'node:path'

import { emit } from '../../../emit/index.js'
import { ast, detectCircularRefs, getLazyWrapper } from '../../../helper/ast.js'
import { hasOuterMeta, injectRef } from '../../../helper/inject-ref.js'
import { getLibraryConfig } from '../../../helper/library.js'
import { extractSchemaExports } from '../../../helper/schema-expression.js'
import { zodType } from '../../../helper/type.js'
import type { Schema } from '../../../openapi/index.js'
import { toPascalCase } from '../../../utils/index.js'

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
  const circularNames = detectCircularRefs(schemas)
  const schemaNames = Object.keys(schemas)
  const cyclicGroupPascal = new Set([...circularNames].map((n) => toPascalCase(n)))
  const declarations = Object.entries(schemas).map(([name, schema]) =>
    processDeclaration(
      extractSchemaExports(name, schema, schemaLib, exportTypes, readonly),
      name,
      schema,
      schemaLib,
      { schemaNames, circularNames, cyclicGroupPascal, readonly, registerRef },
    ),
  )
  const sortedDeclarations = ast(declarations.join('\n'))
  const imports = [
    config.schemaImport,
    ...(schemaLib === 'typebox' && exportTypes ? ["import type{Static}from'typebox'"] : []),
  ]
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
    const depImports = deps
      .toSorted()
      .map((dep) => `import{${toPascalCase(dep)}Schema}from'./${uncapitalize(dep)}'`)
    const lines = [
      config.schemaImport,
      ...(schemaLib === 'typebox' && exportTypes ? ["import type{Static}from'typebox'"] : []),
      ...depImports,
      '',
      decl,
    ]
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
  return emit(barrelCode, outputDir, barrelPath)
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

function findSchemaRefs(code: string, selfName: string) {
  const re = /\b([A-Za-z_$][A-Za-z0-9_$]*)Schema\b/g
  const selfPascal = toPascalCase(selfName)
  const found = new Set<string>()
  for (const m of code.matchAll(re)) {
    const base = m[1] ?? ''
    if (base && base !== selfPascal) found.add(base)
  }
  return [...found] as const
}

function uncapitalize(text: string) {
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
) {
  const annotation =
    schemaLib === 'valibot'
      ? 'v.GenericSchema'
      : schemaLib === 'effect'
        ? 'Schema.Schema<any>'
        : undefined
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
    case 'valibot':
      return decl.replace(
        /v\.lazy\(\(\)\s*=>\s*([A-Za-z_$][A-Za-z0-9_$]*Schema)\)/g,
        (match, varName) => (needsLazy.has(varName) ? match : varName),
      )
    case 'effect':
      // Schema.suspend breaks the StandardSchemaV1 inference chain for
      // non-circular refs: Schema.Array(Schema.suspend(() => X)) drops
      // ~standard so resolver(...) rejects it.
      return decl.replace(
        /Schema\.suspend\(\(\)\s*=>\s*([A-Za-z_$][A-Za-z0-9_$]*Schema)\)/g,
        (match, varName) => (needsLazy.has(varName) ? match : varName),
      )
    case 'typebox':
      return circularNames.has(selfName)
        ? decl.replace(
            /Type\.Recursive\(\(_?Self\)\s*=>\s*([A-Za-z_$][A-Za-z0-9_$]*Schema)\)/g,
            (_match, varName) => (varName === selfVarName ? 'This' : varName),
          )
        : decl
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
