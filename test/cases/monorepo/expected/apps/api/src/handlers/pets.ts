import { Hono } from 'hono'
import { describeRoute, resolver, validator } from 'hono-openapi'
import * as z from 'zod'
import {
  TagSchema,
  PetSchema,
  NewPetSchema,
  NotFoundResponse,
  BadRequestResponse,
} from '@acme/components'

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
          content: { 'application/json': { schema: resolver(z.array(PetSchema)) } },
        },
      },
    }),
    validator(
      'query',
      z.object({
        limit: z.coerce.number().int().min(1).max(100).exactOptional(),
        tag: TagSchema.exactOptional(),
      }),
    ),
    validator('header', z.object({ 'X-Request-Id': z.string().exactOptional() })),
    validator('cookie', z.object({ session: z.string().exactOptional() })),
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
    validator('header', z.object({ 'X-Request-Id': z.string().exactOptional() })),
    validator('json', NewPetSchema),
    (c) => {},
  )
  .on(
    'HEAD',
    '/pets',
    describeRoute({ operationId: 'pingPets', responses: { '200': { description: 'OK' } } }),
    validator('header', z.object({ 'X-Request-Id': z.string().exactOptional() })),
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
    validator('param', z.object({ petId: z.coerce.number().int().min(1) })),
    (c) => {},
  )
  .delete(
    '/pets/:petId',
    describeRoute({ operationId: 'deletePet', responses: { '204': { description: 'Deleted' } } }),
    validator('param', z.object({ petId: z.coerce.number().int() })),
    (c) => {},
  )
  .post(
    '/pets/:petId/photos',
    describeRoute({
      operationId: 'uploadPhoto',
      responses: { '201': { description: 'Uploaded' } },
    }),
    validator('param', z.object({ petId: z.coerce.number().int() })),
    validator(
      'form',
      z.object({ caption: z.string().min(1), featured: z.boolean().exactOptional() }),
    ),
    (c) => {},
  )
