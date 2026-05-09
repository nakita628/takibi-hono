import { schemaToInlineExpression } from '../../../helper/inline-schema.js'
import { makeOptional } from '../../../helper/openapi.js'
import { makeTypeExport } from '../../../helper/type-export.js'
import type { Components } from '../../../openapi/index.js'
import { toPascalCase } from '../../../utils/index.js'

/**
 * Generates parameter component code from OpenAPI components.parameters.
 * Each parameter is exported as a validation schema expression. When
 * `exportTypes` is true, an additional `export type X = ...` is emitted.
 */
export async function makeParametersCode(
  parameters: NonNullable<Components['parameters']>,
  schemaLib: 'zod' | 'valibot' | 'typebox' | 'arktype' | 'effect',
  exportTypes = false,
): Promise<string> {
  return Object.entries(parameters)
    .filter(([, param]) => !('$ref' in param && param.$ref))
    .filter(([, param]) => 'schema' in param && param.schema)
    .map(([name, param]) => {
      const pascal = toPascalCase(name)
      const varName = `${pascal}ParamsSchema`
      const typeName = `${pascal}Params`
      const schemaExpr = schemaToInlineExpression(param.schema!, schemaLib)
      const optionalExpr =
        param.required !== true ? makeOptional(schemaExpr, schemaLib) : schemaExpr
      const constDecl = `export const ${varName}=${optionalExpr}`
      return exportTypes
        ? `${constDecl}\n${makeTypeExport(varName, typeName, schemaLib)}`
        : constDecl
    })
    .join('\n\n')
}
