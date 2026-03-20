import path from 'node:path'

import { getLibraryConfig } from '../generator/imports.js'
import { extractSchemaExports } from '../generator/schema-expression.js'
import { ast } from '../helper/ast.js'
import { detectCircularRefs, getLazyWrapper } from '../helper/circular.js'
import { core } from '../helper/core.js'
import { zodType } from '../helper/type.js'
import type { Schema } from '../openapi/index.js'
import { toPascalCase } from '../utils/index.js'

/**
 * Generates schemas as a single file.
 */
export async function makeSchemasCode(
  schemas: { readonly [k: string]: Schema },
  schemaLib: 'zod' | 'valibot' | 'typebox' | 'arktype' | 'effect',
  options?: {
    readonly exportTypes?: boolean | undefined
    readonly readonly?: boolean | undefined
  },
): Promise<string> {
  const config = getLibraryConfig(schemaLib)
  const exportTypes = options?.exportTypes ?? false
  const readonly = options?.readonly ?? false
  const declarations: string[] = []

  const circularNames = detectCircularRefs(schemas)
  const schemaNames = Object.keys(schemas)
  const cyclicGroupPascal = new Set([...circularNames].map((n) => toPascalCase(n)))

  for (const [name, schema] of Object.entries(schemas)) {
    const rawDecl = await extractSchemaExports(name, schema, schemaLib, exportTypes, readonly)
    declarations.push(
      processDeclaration(rawDecl, name, schema, schemaLib, {
        schemaNames,
        circularNames,
        cyclicGroupPascal,
        readonly,
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

/**
 * Generates split schema files: one file per schema + barrel index.
 */
export async function makeSplitSchemas(
  schemas: { readonly [k: string]: Schema },
  schemaLib: 'zod' | 'valibot' | 'typebox' | 'arktype' | 'effect',
  outputDir: string,
  options?: { readonly exportTypes?: boolean | undefined; readonly readonly?: boolean | undefined },
): Promise<
  { readonly ok: true; readonly value: undefined } | { readonly ok: false; readonly error: string }
> {
  const config = getLibraryConfig(schemaLib)
  const exportTypes = options?.exportTypes ?? false
  const readonly = options?.readonly ?? false
  const schemaNames = Object.keys(schemas)
  const circularNames = detectCircularRefs(schemas)
  const cyclicGroupPascal = new Set([...circularNames].map((n) => toPascalCase(n)))

  for (const name of schemaNames) {
    const rawDecl = await extractSchemaExports(
      name,
      schemas[name],
      schemaLib,
      exportTypes,
      readonly,
    )
    const decl = processDeclaration(rawDecl, name, schemas[name], schemaLib, {
      schemaNames,
      circularNames,
      cyclicGroupPascal,
      readonly,
    })

    // Find schema references in the generated code (exclude self)
    const deps = findSchemaRefs(decl, name).filter((d) => d in schemas)

    // Build file content
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
    const result = await core(lines.join('\n'), outputDir, filePath)
    if (!result.ok) return result
  }

  // Generate barrel index
  const barrelCode = schemaNames
    .toSorted()
    .map((name) => `export*from'./${uncapitalize(name)}'`)
    .join('\n')

  const barrelPath = path.join(outputDir, 'index.ts')
  const barrelResult = await core(barrelCode, outputDir, barrelPath)
  if (!barrelResult.ok) return barrelResult

  return { ok: true, value: undefined }
}

/**
 * Transforms a raw schema declaration by applying lazy wrapping, type annotations,
 * and circular reference handling based on schema library and circular dependency info.
 */
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
  },
): string {
  const pascalName = toPascalCase(name)
  const varName = `${pascalName}Schema`
  const needsLazy = ctx.circularNames.has(name)

  if (needsLazy && schemaLib === 'zod') {
    const typeDef = zodType(schema, pascalName, ctx.cyclicGroupPascal, ctx.readonly)
    const wrapper = getLazyWrapper(schemaLib)
    const annotated = addTypeAnnotation(rawDecl, varName, `${pascalName}Type`)
    const wrapped = wrapper.open ? wrapWithLazy(annotated, name, wrapper) : annotated
    const unwrapped = unwrapInnerLazy(wrapped, varName, ctx.schemaNames, ctx.circularNames)
    return `${typeDef}\n\n${unwrapped}`
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
    return addCircularTypeAnnotation(unwrapped, varName, schemaLib)
  }

  return unwrapNonCircularLazy(rawDecl, name, ctx.schemaNames, ctx.circularNames, schemaLib)
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

/**
 * Adds `:z.ZodType<TypeName>` annotation to a const declaration.
 * `export const FooSchema = ...` → `export const FooSchema:z.ZodType<FooType> = ...`
 */
function addTypeAnnotation(decl: string, varName: string, typeName: string): string {
  return decl.replace(
    new RegExp(`(export\\s+const\\s+${varName})\\s*=`),
    `$1:z.ZodType<${typeName}>=`,
  )
}

/**
 * Adds a type annotation for circular schemas in non-zod libraries
 * to prevent implicit any errors.
 */
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

/**
 * Inside a circular schema wrapped with outer z.lazy(),
 * unwrap inner z.lazy() calls:
 *   - Self-reference: z.lazy(() => FooSchema) → FooSchema (direct, works inside outer z.lazy)
 *   - Non-circular ref: z.lazy(() => BarSchema) → BarSchema (direct, already defined)
 *   - Circular ref to other: z.lazy(() => BazSchema) → BazSchema (direct, works inside outer z.lazy)
 *
 * When the outer z.lazy(() => ...) is present, ALL inner z.lazy are unnecessary
 * because the outer one already defers evaluation.
 */
function unwrapInnerLazy(
  decl: string,
  _selfVarName: string,
  _allSchemaNames: readonly string[],
  _circularNames: ReadonlySet<string>,
): string {
  // Inside outer z.lazy, all inner z.lazy(() => XxxSchema) can be unwrapped
  return decl.replace(/z\.lazy\(\(\)\s*=>\s*([A-Za-z_$][A-Za-z0-9_$]*Schema)\)/g, '$1')
}

/**
 * Removes lazy wrappers for non-circular references in non-circular schemas.
 * For typebox circular schemas, replaces inner Type.Recursive self-refs with This.
 */
function unwrapNonCircularLazy(
  decl: string,
  selfName: string,
  allSchemaNames: readonly string[],
  circularNames: ReadonlySet<string>,
  schemaLib: 'zod' | 'valibot' | 'typebox' | 'arktype' | 'effect',
): string {
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
      // Inside Type.Recursive(This => ...), replace inner Type.Recursive((_Self) => SelfSchema) with This
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

/**
 * Wraps the outermost schema expression with a lazy wrapper.
 */
function wrapWithLazy(
  decl: string,
  name: string,
  wrapper: { readonly open: string; readonly close: string },
): string {
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
