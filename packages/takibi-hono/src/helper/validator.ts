import { isMedia } from '../guard/index.js'
import type { Components, Media, Operation, Parameter } from '../openapi/index.js'
import { makeSafeKey, resolveRef } from '../utils/index.js'
import { schemaToInlineExpression } from './inline-schema.js'
import { getStandardValidatorConfig } from './library.js'
import {
  groupParametersByLocation,
  makeObjectExpression,
  makeOptional,
  resolveRequestBodyRef,
  wrapSchemaForValidator,
} from './openapi.js'

function locationParamIn(location: string) {
  return location === 'query' ||
    location === 'path' ||
    location === 'header' ||
    location === 'cookie'
    ? location
    : undefined
}

export function makeValidators(
  operation: Operation,
  pathItemParameters: readonly Parameter[] | undefined,
  schemaLib: 'zod' | 'valibot' | 'typebox' | 'arktype' | 'effect',
  components?: Components,
) {
  const alias = 'validator'
  const allParameters = [...(pathItemParameters ?? []), ...(operation.parameters ?? [])]
  const grouped = groupParametersByLocation(allParameters, components)
  const paramValidators = Object.entries(grouped).map(([location, parameters]) => {
    const validatorTarget = location === 'path' ? 'param' : location
    const paramIn = locationParamIn(location)
    const fields = parameters.map((parameter) => {
      const expr = schemaToInlineExpression(parameter.schema, schemaLib, paramIn)
      const isOptional = !parameter.required && location !== 'path'
      return `${makeSafeKey(parameter.name)}:${isOptional ? makeOptional(expr, schemaLib) : expr}`
    })
    return `${alias}('${validatorTarget}',${wrapSchemaForValidator(makeObjectExpression(fields, schemaLib), schemaLib)})`
  })
  const resolvedBody = resolveRequestBodyRef(operation.requestBody, components)
  const bodyValidators = resolvedBody?.content
    ? Object.entries(resolvedBody.content)
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

/** Uses @hono/<lib>-validator. Wire-string coercion for path/query is delegated to schema-to-library's `paramIn` option. */
export function makeStandardValidators(
  operation: Operation,
  pathItemParameters: readonly Parameter[] | undefined,
  schemaLib: 'zod' | 'valibot' | 'typebox' | 'arktype' | 'effect',
  components?: Components,
) {
  const { validatorFn } = getStandardValidatorConfig(schemaLib)
  const allParameters = [
    ...(pathItemParameters ?? ([] as const)),
    ...(operation.parameters ?? ([] as const)),
  ] as const
  const grouped = groupParametersByLocation(allParameters, components)
  const paramValidators = Object.entries(grouped).map(([location, parameters]) => {
    const validatorTarget = location === 'path' ? 'param' : location
    const paramIn = locationParamIn(location)
    const fields = parameters.map((parameter) => {
      const expr = schemaToInlineExpression(parameter.schema, schemaLib, paramIn)
      const isOptional = !parameter.required && location !== 'path'
      return `${makeSafeKey(parameter.name)}:${isOptional ? makeOptional(expr, schemaLib) : expr}` as const
    })
    const objExpr = makeObjectExpression(fields, schemaLib)
    return `${validatorFn}('${validatorTarget}',${objExpr})` as const
  })
  const resolvedBody = resolveRequestBodyRef(operation.requestBody, components)
  const bodyValidators = resolvedBody?.content
    ? Object.entries(resolvedBody.content)
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
