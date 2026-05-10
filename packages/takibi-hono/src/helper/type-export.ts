import type { SchemaLib } from '../core/layout.js'

/**
 * Emit a `export type X = ...` declaration that infers from a previously
 * declared schema variable, using each library's idiomatic inference API.
 *
 * @param varName   Variable name of the existing schema (e.g. `UserParamsSchema`)
 * @param typeName  Type name to export (e.g. `UserParams`)
 * @param schemaLib Target validation library
 */
export function makeTypeExport(varName: string, typeName: string, schemaLib: SchemaLib): string {
  if (schemaLib === 'zod') return `export type ${typeName}=z.infer<typeof ${varName}>`
  if (schemaLib === 'valibot') return `export type ${typeName}=v.InferOutput<typeof ${varName}>`
  if (schemaLib === 'effect') return `export type ${typeName}=typeof ${varName}.Encoded`
  if (schemaLib === 'typebox') return `export type ${typeName}=Static<typeof ${varName}>`
  return `export type ${typeName}=typeof ${varName}.infer`
}
