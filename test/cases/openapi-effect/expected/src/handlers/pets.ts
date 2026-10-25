import { Hono } from 'hono'
import { describeRoute, resolver, validator } from 'hono-openapi'
import { Schema, SchemaTransformation } from 'effect'
import {
  TagSchema,
  PetSchema,
  NewPetSchema,
  NotFoundResponse,
  BadRequestResponse,
} from '../components'

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
            'application/json': {
              schema: resolver(Schema.toStandardSchemaV1(Schema.Array(PetSchema))),
            },
          },
        },
      },
    }),
    validator(
      'query',
      Schema.toStandardSchemaV1(
        Schema.Struct({
          limit: Schema.optional(
            Schema.FiniteFromString.check(
              Schema.isInt(),
              Schema.isGreaterThanOrEqualTo(1),
              Schema.isLessThanOrEqualTo(100),
            ),
          ),
          tag: Schema.optional(TagSchema),
        }),
      ),
    ),
    validator(
      'header',
      Schema.toStandardSchemaV1(Schema.Struct({ 'X-Request-Id': Schema.optional(Schema.String) })),
    ),
    validator(
      'cookie',
      Schema.toStandardSchemaV1(Schema.Struct({ session: Schema.optional(Schema.String) })),
    ),
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
          content: {
            'application/json': { schema: resolver(Schema.toStandardSchemaV1(PetSchema)) },
          },
        },
        '400': BadRequestResponse,
      },
    }),
    validator(
      'header',
      Schema.toStandardSchemaV1(Schema.Struct({ 'X-Request-Id': Schema.optional(Schema.String) })),
    ),
    validator('json', Schema.toStandardSchemaV1(NewPetSchema)),
    (c) => {},
  )
  .on(
    'HEAD',
    '/pets',
    describeRoute({ operationId: 'pingPets', responses: { '200': { description: 'OK' } } }),
    validator(
      'header',
      Schema.toStandardSchemaV1(Schema.Struct({ 'X-Request-Id': Schema.optional(Schema.String) })),
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
          content: {
            'application/json': { schema: resolver(Schema.toStandardSchemaV1(PetSchema)) },
          },
        },
        '404': NotFoundResponse,
      },
    }),
    validator(
      'param',
      Schema.toStandardSchemaV1(
        Schema.Struct({
          petId: Schema.FiniteFromString.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(1)),
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
      Schema.toStandardSchemaV1(
        Schema.Struct({ petId: Schema.FiniteFromString.check(Schema.isInt()) }),
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
      Schema.toStandardSchemaV1(
        Schema.Struct({ petId: Schema.FiniteFromString.check(Schema.isInt()) }),
      ),
    ),
    validator(
      'form',
      Schema.toStandardSchemaV1(
        Schema.Struct({
          caption: Schema.String.check(
            Schema.makeFilter((input) => [...input].length >= 1, {
              expected: 'a string of at least 1 character',
            }),
          ),
          featured: Schema.optional(
            Schema.String.check(
              Schema.isPattern(/^(?:true|1|yes|on|y|enabled|false|0|no|off|n|disabled)$/i),
            ).pipe(
              Schema.decodeTo(
                Schema.Boolean,
                SchemaTransformation.transform({
                  decode: (input) => /^(?:true|1|yes|on|y|enabled)$/i.test(input),
                  encode: (output) => (output ? 'true' : 'false'),
                }),
              ),
            ),
          ),
        }),
      ),
    ),
    (c) => {},
  )
