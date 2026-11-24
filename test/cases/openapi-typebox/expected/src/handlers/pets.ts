import { Hono } from 'hono'
import { describeRoute, resolver, validator } from 'hono-openapi'
import { Type, Codec, type StaticDecode, type StaticEncode, type TSchema } from 'typebox'
import { Compile } from 'typebox/compile'
import {
  TagSchema,
  PetSchema,
  NewPetSchema,
  NotFoundResponse,
  BadRequestResponse,
} from '../components'

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

export const petsHandler = new Hono()
  .get(
    '/pets',
    describeRoute({
      operationId: 'listPets',
      summary: 'List pets',
      description: 'Lists the pets, newest first.',
      tags: ['pets'],
      responses: {
        '200': {
          description: 'The pets',
          headers: { 'X-Total-Count': { $ref: '#/components/headers/TotalCount' } },
          content: {
            'application/json': { schema: resolver(toStandardSchemaV1(Type.Array(PetSchema))) },
          },
        },
      },
    }),
    validator(
      'query',
      toStandardSchemaV1(
        Type.Object({
          limit: Type.Optional(
            Codec(
              Type.Refine(
                Type.Refine(
                  Type.String({ pattern: '^-?(?:0|[1-9]\\d*)$' }),
                  (value) => Number(value) >= 1,
                  () => 'must be >= 1',
                ),
                (value) => Number(value) <= 100,
                () => 'must be <= 100',
              ),
            )
              .Decode((value) => Number(value))
              .Encode((value) => String(value)),
          ),
          tag: Type.Optional(TagSchema),
        }),
      ),
    ),
    validator(
      'header',
      toStandardSchemaV1(Type.Object({ 'x-request-id': Type.Optional(Type.String()) })),
    ),
    validator('cookie', toStandardSchemaV1(Type.Object({ session: Type.Optional(Type.String()) }))),
    (c) => {},
  )
  .post(
    '/pets',
    describeRoute({
      operationId: 'createPet',
      summary: 'Create a pet',
      tags: ['pets'],
      security: [{ apiKey: [] }],
      responses: {
        '201': {
          description: 'Created',
          content: { 'application/json': { schema: resolver(toStandardSchemaV1(PetSchema)) } },
        },
        '400': BadRequestResponse,
      },
    }),
    validator(
      'header',
      toStandardSchemaV1(Type.Object({ 'x-request-id': Type.Optional(Type.String()) })),
    ),
    validator('json', toStandardSchemaV1(NewPetSchema)),
    (c) => {},
  )
  .on(
    'HEAD',
    '/pets',
    describeRoute({ operationId: 'pingPets', responses: { '200': { description: 'OK' } } }),
    validator(
      'header',
      toStandardSchemaV1(Type.Object({ 'x-request-id': Type.Optional(Type.String()) })),
    ),
    (c) => {},
  )
  .get(
    '/pets/:petId',
    describeRoute({
      operationId: 'getPet',
      deprecated: true,
      responses: {
        '200': {
          description: 'The pet',
          content: { 'application/json': { schema: resolver(toStandardSchemaV1(PetSchema)) } },
        },
        '404': NotFoundResponse,
      },
    }),
    validator(
      'param',
      toStandardSchemaV1(
        Type.Object({
          petId: Codec(
            Type.Refine(
              Type.String({ pattern: '^-?(?:0|[1-9]\\d*)$' }),
              (value) => Number(value) >= 1,
              () => 'must be >= 1',
            ),
          )
            .Decode((value) => Number(value))
            .Encode((value) => String(value)),
        }),
      ),
    ),
    (c) => {},
  )
  .delete(
    '/pets/:petId',
    describeRoute({ operationId: 'deletePet', responses: { '204': { description: 'Deleted' } } }),
    validator(
      'param',
      toStandardSchemaV1(
        Type.Object({
          petId: Codec(Type.String({ pattern: '^-?(?:0|[1-9]\\d*)$' }))
            .Decode((value) => Number(value))
            .Encode((value) => String(value)),
        }),
      ),
    ),
    (c) => {},
  )
  .post(
    '/pets/:petId/photos',
    describeRoute({
      operationId: 'uploadPhoto',
      responses: { '201': { description: 'Uploaded' } },
    }),
    validator(
      'param',
      toStandardSchemaV1(
        Type.Object({
          petId: Codec(Type.String({ pattern: '^-?(?:0|[1-9]\\d*)$' }))
            .Decode((value) => Number(value))
            .Encode((value) => String(value)),
        }),
      ),
    ),
    validator(
      'form',
      toStandardSchemaV1(
        Type.Object({
          caption: Type.String({ minLength: 1 }),
          featured: Type.Optional(
            Codec(
              Type.String({ pattern: /^(?:true|1|yes|on|y|enabled|false|0|no|off|n|disabled)$/i }),
            )
              .Decode((value) => /^(?:true|1|yes|on|y|enabled)$/i.test(value))
              .Encode((value) => (value ? 'true' : 'false')),
          ),
        }),
      ),
    ),
    (c) => {},
  )
