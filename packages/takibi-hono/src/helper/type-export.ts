export function makeTypeExport(
  varName: string,
  typeName: string,
  schemaLib: 'zod' | 'valibot' | 'typebox' | 'arktype' | 'effect',
): string {
  if (schemaLib === 'zod') return `export type ${typeName}=z.infer<typeof ${varName}>`
  if (schemaLib === 'valibot') return `export type ${typeName}=v.InferOutput<typeof ${varName}>`
  if (schemaLib === 'effect') return `export type ${typeName}=typeof ${varName}.Encoded`
  if (schemaLib === 'typebox') return `export type ${typeName}=Static<typeof ${varName}>`
  return `export type ${typeName}=typeof ${varName}.infer`
}
