import { schemaToInlineExpression } from '../../../helper/inline-schema.js'
import { makeOptional } from '../../../helper/openapi.js'
import type { Components } from '../../../openapi/index.js'
import { toPascalCase } from '../../../utils/index.js'

/**
 * Generates parameter component code from OpenAPI components.parameters.
 * Each parameter is exported as a validation schema expression.
 */
export async function makeParametersCode(
  parameters: NonNullable<Components['parameters']>,
  schemaLib: 'zod' | 'valibot' | 'typebox' | 'arktype' | 'effect',
): Promise<string> {
  return Object.entries(parameters)
    .filter(([, param]) => !('$ref' in param && param.$ref))
    .filter(([, param]) => 'schema' in param && param.schema)
    .map(([name, param]) => {
      const varName = `${toPascalCase(name)}ParamsSchema`
      const schemaExpr = schemaToInlineExpression(param.schema!, schemaLib)
      const optionalExpr =
        param.required !== true ? makeOptional(schemaExpr, schemaLib) : schemaExpr
      return `export const ${varName}=${optionalExpr}`
    })
    .join('\n\n')
}
