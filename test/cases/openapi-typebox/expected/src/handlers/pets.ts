import { Hono } from 'hono'
import { describeRoute, resolver, validator } from 'hono-openapi'
import { Type, Codec } from 'typebox'
import { Compile } from 'typebox/compile'
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
          content: { 'application/json': { schema: resolver(Compile(Type.Array(PetSchema))) } },
        },
      },
    }),
    validator(
      'query',
      Compile(
        Type.Object({
          limit: Type.Optional(
            Codec(Type.String())
              .Decode((value) => Number.parseInt(value, 10))
              .Encode((value) => String(value)),
          ),
          tag: Type.Optional(TagSchema),
        }),
      ),
    ),
    validator('header', Compile(Type.Object({ 'X-Request-Id': Type.Optional(Type.String()) }))),
    validator('cookie', Compile(Type.Object({ session: Type.Optional(Type.String()) }))),
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
          content: { 'application/json': { schema: resolver(Compile(PetSchema)) } },
        },
        '400': BadRequestResponse,
      },
    }),
    validator('header', Compile(Type.Object({ 'X-Request-Id': Type.Optional(Type.String()) }))),
    validator('json', Compile(NewPetSchema)),
    (c) => {},
  )
  .on(
    'HEAD',
    '/pets',
    describeRoute({ operationId: 'pingPets', responses: { '200': { description: 'OK' } } }),
    validator('header', Compile(Type.Object({ 'X-Request-Id': Type.Optional(Type.String()) }))),
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
          content: { 'application/json': { schema: resolver(Compile(PetSchema)) } },
        },
        '404': NotFoundResponse,
      },
    }),
    validator(
      'param',
      Compile(
        Type.Object({
          petId: Codec(Type.String())
            .Decode((value) => Number.parseInt(value, 10))
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
      Compile(
        Type.Object({
          petId: Codec(Type.String())
            .Decode((value) => Number.parseInt(value, 10))
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
      Compile(
        Type.Object({
          petId: Codec(Type.String())
            .Decode((value) => Number.parseInt(value, 10))
            .Encode((value) => String(value)),
        }),
      ),
    ),
    validator(
      'form',
      Compile(
        Type.Object({
          caption: Type.String({ minLength: 1 }),
          featured: Type.Optional(Type.Boolean()),
        }),
      ),
    ),
    (c) => {},
  )
