import { Hono } from 'hono'
import { describeRoute, resolver, validator } from 'hono-openapi'
import * as v from 'valibot'
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
          content: { 'application/json': { schema: resolver(v.array(PetSchema)) } },
        },
      },
    }),
    validator(
      'query',
      v.partial(
        v.object({
          limit: v.pipe(
            v.string(),
            v.transform(Number),
            v.number(),
            v.safeInteger(),
            v.minValue(1),
            v.maxValue(100),
          ),
          tag: TagSchema,
        }),
      ),
    ),
    validator('header', v.partial(v.object({ 'X-Request-Id': v.string() }))),
    validator('cookie', v.partial(v.object({ session: v.string() }))),
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
          content: { 'application/json': { schema: resolver(PetSchema) } },
        },
        '400': BadRequestResponse,
      },
    }),
    validator('header', v.partial(v.object({ 'X-Request-Id': v.string() }))),
    validator('json', NewPetSchema),
    (c) => {},
  )
  .on(
    'HEAD',
    '/pets',
    describeRoute({ operationId: 'pingPets', responses: { '200': { description: 'OK' } } }),
    validator('header', v.partial(v.object({ 'X-Request-Id': v.string() }))),
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
          content: { 'application/json': { schema: resolver(PetSchema) } },
        },
        '404': NotFoundResponse,
      },
    }),
    validator(
      'param',
      v.object({
        petId: v.pipe(v.string(), v.transform(Number), v.number(), v.safeInteger(), v.minValue(1)),
      }),
    ),
    (c) => {},
  )
  .delete(
    '/pets/:petId',
    describeRoute({ operationId: 'deletePet', responses: { '204': { description: 'Deleted' } } }),
    validator(
      'param',
      v.object({ petId: v.pipe(v.string(), v.transform(Number), v.number(), v.safeInteger()) }),
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
      v.object({ petId: v.pipe(v.string(), v.transform(Number), v.number(), v.safeInteger()) }),
    ),
    validator(
      'form',
      v.object({
        caption: v.pipe(v.string(), v.minCodePoints(1)),
        featured: v.optional(v.boolean()),
      }),
    ),
    (c) => {},
  )
