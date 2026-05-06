import { isMedia } from '../guard/index.js'
import type { Media, Operation, Parameter } from '../openapi/index.js'
import { resolveRef } from '../utils/index.js'
import { coerceQueryExpression } from './coerce.js'
import { schemaToInlineExpression } from './inline-schema.js'
import { getLibraryConfig, getStandardValidatorConfig } from './library.js'
import {
  groupParametersByLocation,
  makeObjectExpression,
  makeOptional,
  wrapSchemaForValidator,
} from './openapi.js'

/**
 * Generates validator middleware code from an operation's parameters and request body.
 */
export function makeValidators(
  operation: Operation,
  pathItemParameters: readonly Parameter[] | undefined,
  schemaLib: 'zod' | 'valibot' | 'typebox' | 'arktype' | 'effect',
) {
  const config = getLibraryConfig(schemaLib)
  const alias = config.validatorAlias
  const allParameters = [...(pathItemParameters ?? []), ...(operation.parameters ?? [])]
  const grouped = groupParametersByLocation(allParameters)
  const paramValidators = Object.entries(grouped).map(([location, parameters]) => {
    const validatorTarget = location === 'path' ? 'param' : location
    const fields = parameters.map((parameter) => {
      const expr = schemaToInlineExpression(parameter.schema, schemaLib)
      const isOptional = !parameter.required && location !== 'path'
      return `${parameter.name}:${isOptional ? makeOptional(expr, schemaLib) : expr}`
    })
    return `${alias}('${validatorTarget}',${wrapSchemaForValidator(makeObjectExpression(fields, schemaLib), schemaLib)})`
  })
  const bodyValidators =
    operation.requestBody && 'content' in operation.requestBody && operation.requestBody.content
      ? Object.entries(operation.requestBody.content)
          .filter((entry): entry is [string, Media] => isMedia(entry[1]) && !!entry[1].schema)
          .map(([mediaType, media]) => {
            const target = mediaType === 'application/x-www-form-urlencoded' ? 'form' : 'json'
            const { schema } = media
            const expr = schema.$ref
              ? resolveRef(schema.$ref)
              : schemaToInlineExpression(schema, schemaLib)
            return `${alias}('${target}',${wrapSchemaForValidator(expr, schemaLib)})`
          })
      : ([] as const)
  return [...paramValidators, ...bodyValidators] as const
}

/**
 * Generates library-specific validator middleware code.
 * Uses @hono/zod-validator, @hono/valibot-validator, etc. based on schemaLib.
 * Applies coercion for query parameters (number/integer/boolean).
 */
export function makeStandardValidators(
  operation: Operation,
  pathItemParameters: readonly Parameter[] | undefined,
  schemaLib: 'zod' | 'valibot' | 'typebox' | 'arktype' | 'effect',
) {
  const { validatorFn } = getStandardValidatorConfig(schemaLib)
  const allParameters = [
    ...(pathItemParameters ?? ([] as const)),
    ...(operation.parameters ?? ([] as const)),
  ] as const
  const grouped = groupParametersByLocation(allParameters)
  const paramValidators = Object.entries(grouped).map(([location, parameters]) => {
    const validatorTarget = location === 'path' ? 'param' : location
    // Path and query both arrive as strings on the wire — coerce both.
    const isStringWire = location === 'query' || location === 'path'
    const fields = parameters.map((parameter) => {
      const coerced = isStringWire ? coerceQueryExpression(parameter.schema, schemaLib) : undefined
      const expr = coerced ?? schemaToInlineExpression(parameter.schema, schemaLib)
      const isOptional = !parameter.required && location !== 'path'
      return `${parameter.name}:${isOptional ? makeOptional(expr, schemaLib) : expr}` as const
    })
    const objExpr = makeObjectExpression(fields, schemaLib)
    // tbValidator only runs `Compile().Check()` and ignores any Type.Decode
    // transform, so for typebox path/query we replace it with an inline
    // validator that runs `Value.Convert(...)` (string→typed) before checking.
    if (schemaLib === 'typebox' && isStringWire) {
      return `validator('${validatorTarget}',(_v,_c)=>{const _s=${objExpr};const _x=Value.Convert(_s,_v);return Value.Check(_s,_x)?_x:_c.json({success:false,errors:[...Value.Errors(_s,_x)]},400)})` as const
    }
    return `${validatorFn}('${validatorTarget}',${objExpr})` as const
  })
  const bodyValidators =
    operation.requestBody && 'content' in operation.requestBody && operation.requestBody.content
      ? Object.entries(operation.requestBody.content)
          .filter((entry): entry is [string, Media] => isMedia(entry[1]) && !!entry[1].schema)
          .map(([mediaType, media]) => {
            const target = mediaType === 'application/x-www-form-urlencoded' ? 'form' : 'json'
            const { schema } = media
            const expr = schema.$ref
              ? resolveRef(schema.$ref)
              : schemaToInlineExpression(schema, schemaLib)
            return `${validatorFn}('${target}',${expr})` as const
          })
      : ([] as const)
  return [...paramValidators, ...bodyValidators] as const
}
