import path from 'node:path'

import { emit } from '../../../emit/index.js'
import {
  ast,
  detectCircularRefs,
  detectCircularSCCGroups,
  getLazyWrapper,
} from '../../../helper/ast.js'
import { ARKTYPE_REF_AUGMENTATION, hasOuterMeta, injectRef } from '../../../helper/inject-ref.js'
import { getLibraryConfig } from '../../../helper/library.js'
import { extractSchemaExports, makeArktypeScopeBody } from '../../../helper/schema-expression.js'
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
  const cyclicMemberExprs = makeCyclicMemberExprs(schemas, schemaLib, readonly)
  const declarations = Object.entries(schemas).map(([name, schema]) =>
    processDeclaration(
      extractSchemaExports(name, schema, schemaLib, exportTypes, readonly),
      name,
      schema,
      schemaLib,
      { schemaNames, circularNames, cyclicGroupPascal, readonly, registerRef, cyclicMemberExprs },
    ),
  )
  const sortedDeclarations = ast(declarations.join('\n'))
  const imports = [
    config.schemaImport,
    ...(schemaLib === 'typebox' && exportTypes ? ["import type{Static}from'typebox'"] : []),
    ...(schemaLib === 'arktype' && sortedDeclarations.includes('scope(')
      ? ["import{scope}from'arktype'"]
      : []),
    ...(schemaLib === 'arktype' && registerRef ? [ARKTYPE_REF_AUGMENTATION] : []),
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
  const cyclicMemberExprs = makeCyclicMemberExprs(schemas, schemaLib, readonly)
  for (const name of schemaNames) {
    const rawDecl = extractSchemaExports(name, schemas[name], schemaLib, exportTypes, readonly)
    const decl = processDeclaration(rawDecl, name, schemas[name], schemaLib, {
      schemaNames,
      circularNames,
      cyclicGroupPascal,
      readonly,
      registerRef,
      cyclicMemberExprs,
    })
    const deps = findSchemaRefs(decl, name).filter((d) => d in schemas)
    const depImports = deps
      .toSorted()
      .map((dep) => `import{${toPascalCase(dep)}Schema}from'./${uncapitalize(dep)}'`)
    const lines = [
      config.schemaImport,
      ...(schemaLib === 'typebox' && exportTypes ? ["import type{Static}from'typebox'"] : []),
      ...(schemaLib === 'arktype' && decl.includes('scope(') ? ["import{scope}from'arktype'"] : []),
      ...(schemaLib === 'arktype' && registerRef ? [ARKTYPE_REF_AUGMENTATION] : []),
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

/**
 * Per-member replacement RHS expression for circular SCC groups in libraries that
 * require a shared container instead of standalone lazy closures: TypeBox v1
 * (`Type.Module({...}).Member`) and arktype (`scope({...}).export().Member`).
 * Self-referential and mutually-recursive members of a group share one container;
 * each member's export selects its entry. Empty for zod/valibot/effect (their
 * `z.lazy` / `v.lazy` / `Schema.suspend` closures need no aggregation).
 */
function makeCyclicMemberExprs(
  schemas: { readonly [k: string]: Schema },
  schemaLib: 'zod' | 'valibot' | 'typebox' | 'arktype' | 'effect',
  readonly: boolean,
): ReadonlyMap<string, string> {
  if (schemaLib !== 'typebox' && schemaLib !== 'arktype') return new Map()
  const result = new Map<string, string>()
  for (const group of detectCircularSCCGroups(schemas)) {
    if (schemaLib === 'arktype') {
      const scopeBody = makeArktypeScopeBody(group, schemas, readonly)
      // arktype `scope` values must be plain object DSL with string-keyword refs.
      // A composed member (`type(...).or(...)` from oneOf/anyOf/allOf) embeds a
      // nested `type()` whose own empty scope cannot resolve sibling keywords, so
      // skip aggregation for those groups (they fall back to standalone emit).
      if (scopeBody === '' || scopeBody.includes('type(')) continue
      for (const member of group) {
        result.set(member, `scope(${scopeBody}).export().${toPascalCase(member)}`)
      }
      continue
    }
    const groupPascals = new Set(group.map((n) => toPascalCase(n)))
    const entries = group.map((member) => {
      const memberSchema = schemas[member]
      if (!memberSchema) return ''
      const decl = extractSchemaExports(member, memberSchema, 'typebox', false, readonly)
      const pascal = toPascalCase(member)
      const rhs =
        decl.match(new RegExp(`^export\\s+const\\s+${pascal}Schema\\s*=\\s*(.+)$`, 'm'))?.[1] ?? ''
      // Intra-group references resolve through the module via `Type.Ref('Name')`.
      // They arrive either as a self `Type.Recursive((_Self) => XSchema)` wrapper
      // or as a bare `XSchema` value reference to another group member; both are
      // rewritten. Refs outside the group stay value imports.
      const deRecursed = rhs.replace(
        /Type\.Recursive\(\(_?Self\)\s*=>\s*([A-Za-z_$][A-Za-z0-9_$]*)Schema\)/g,
        (whole, refPascal: string) =>
          groupPascals.has(refPascal) ? `Type.Ref('${refPascal}')` : whole,
      )
      const reffed = deRecursed.replace(
        /\b([A-Za-z_$][A-Za-z0-9_$]*)Schema\b/g,
        (whole, refPascal: string) =>
          groupPascals.has(refPascal) ? `Type.Ref('${refPascal}')` : whole,
      )
      return `${pascal}:${reffed}`
    })
    const body = `{${entries.join(',')}}`
    for (const member of group) result.set(member, `Type.Module(${body}).${toPascalCase(member)}`)
  }
  return result
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
    readonly cyclicMemberExprs: ReadonlyMap<string, string>
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

  const cyclicExpr = ctx.cyclicMemberExprs.get(name)
  if (needsLazy && cyclicExpr) {
    // TypeBox / arktype circular members select their entry from a shared
    // container (`Type.Module(...).Name` / `scope(...).export().Name`) built in
    // `makeCyclicMemberExprs`; substitute the standalone right-hand side with it.
    const body = rawDecl.replace(
      new RegExp(`^(export\\s+const\\s+${varName}\\s*=\\s*)(.+)$`, 'm'),
      (_m: string, prefix: string) => `${prefix}${cyclicExpr}`,
    )
    return maybeInjectRef(body)
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
