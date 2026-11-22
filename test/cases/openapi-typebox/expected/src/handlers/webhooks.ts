import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import type { StaticDecode, StaticEncode, TSchema } from 'typebox'
import { Compile } from 'typebox/compile'
import { PetSchema } from '../components'

const toStandardSchemaV1 = <T extends TSchema>(schema: T) => {
  const validator = Compile(schema)
  return Object.assign(validator, {
    '~standard': {
      version: 1 as const,
      vendor: 'typebox',
      validate: (value: unknown) =>
        validator.Check(value)
          ? { value: validator.Decode(value) }
          : {
              issues: validator.Errors(value).map((error) => ({
                message: error.message,
                path: error.instancePath
                  .split('/')
                  .slice(1)
                  .map((key) => key.replaceAll('~1', '/').replaceAll('~0', '~')),
              })),
            },
      types: undefined as
        | { readonly input: StaticEncode<T>; readonly output: StaticDecode<T> }
        | undefined,
    },
  })
}

export const webhooksHandler = new Hono().post(
  '/petAdded',
  describeRoute({
    operationId: 'onPetAdded',
    summary: 'A pet was added',
    responses: { '200': { description: 'Acknowledged' } },
  }),
  validator('json', toStandardSchemaV1(PetSchema)),
  (c) => {},
)
