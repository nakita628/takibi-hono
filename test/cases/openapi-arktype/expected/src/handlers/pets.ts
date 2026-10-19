import { Hono } from 'hono'
import { describeRoute, resolver, validator } from 'hono-openapi'
import { type } from 'arktype'
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
          content: { 'application/json': { schema: resolver(type(PetSchema).array()) } },
        },
      },
    }),
    validator(
      'query',
      type({
        'limit?': type('string.integer.parse').to(
          type('number.integer >= 1').and(type('number.integer <= 100')),
        ),
        'tag?': TagSchema,
      }),
    ),
    validator('header', type({ 'X-Request-Id?': 'string' })),
    validator('cookie', type({ 'session?': 'string' })),
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
    validator('header', type({ 'X-Request-Id?': 'string' })),
    validator('json', NewPetSchema),
    (c) => {},
  )
  .on(
    'HEAD',
    '/pets',
    describeRoute({ operationId: 'pingPets', responses: { '200': { description: 'OK' } } }),
    validator('header', type({ 'X-Request-Id?': 'string' })),
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
    validator('param', type({ petId: type('string.integer.parse').to('number.integer >= 1') })),
    (c) => {},
  )
  .delete(
    '/pets/:petId',
    describeRoute({ operationId: 'deletePet', responses: { '204': { description: 'Deleted' } } }),
    validator('param', type({ petId: 'string.integer.parse' })),
    (c) => {},
  )
  .post(
    '/pets/:petId/photos',
    describeRoute({
      operationId: 'uploadPhoto',
      responses: { '201': { description: 'Uploaded' } },
    }),
    validator('param', type({ petId: 'string.integer.parse' })),
    validator('form', type({ caption: type('string >= 1'), 'featured?': 'boolean' })),
    (c) => {},
  )
