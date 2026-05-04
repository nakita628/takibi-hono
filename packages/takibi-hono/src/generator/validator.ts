import { isMedia } from '../guard/index.js'
import {
  groupParametersByLocation,
  makeObjectExpression,
  makeOptional,
  wrapSchemaForValidator,
} from '../helper/openapi.js'
import type { Media, Operation, Parameter } from '../openapi/index.js'
import { resolveRef } from '../utils/index.js'
import { coerceQueryExpression } from './coerce.js'
import { getLibraryConfig, getStandardValidatorConfig } from './imports.js'
import { schemaToInlineExpression } from './inline-schema.js'

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
    const isQuery = location === 'query'
    const fields = parameters.map((parameter) => {
      const coerced = isQuery ? coerceQueryExpression(parameter.schema, schemaLib) : undefined
      const expr = coerced ?? schemaToInlineExpression(parameter.schema, schemaLib)
      const isOptional = !parameter.required && location !== 'path'
      return `${parameter.name}:${isOptional ? makeOptional(expr, schemaLib) : expr}` as const
    })
    return `${validatorFn}('${validatorTarget}',${makeObjectExpression(fields, schemaLib)})` as const
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
