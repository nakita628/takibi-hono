// The OpenAPI document hono-openapi builds from the generated app.
//
// `describeRoute` and `resolver(...)` are only as good as the document hono-openapi derives
// from them, so the app of cases/openapi-zod and cases/openapi-valibot is handed to
// `openAPIRouteHandler` and the document it answers with is compared with what the spec
// said: every `components.schemas` entry registered under its own name (the `ref` the
// generator attaches to each schema), the operation metadata of `describeRoute` word for
// word, and the parameters hono-openapi reads back out of the validators — the base path
// prefixed to every path, and a request body behind `$ref`.
//
// The other libraries are not asserted: for arktype hono-openapi documents the enum `Tag`
// as a union of references to itself, and for effect v4 its JSON Schema conversion (built
// for effect v3) fails. Both are upstream.
import { Hono } from 'hono'
import { openAPIRouteHandler } from 'hono-openapi'
import { describe, expect, it } from 'vite-plus/test'

type Document = {
  readonly openapi: string
  readonly components: { readonly schemas: unknown }
  readonly paths: { readonly [path: string]: { readonly [method: string]: unknown } }
}

async function loadDocument(name: string) {
  const mod = (await import(`../__app__/${name}/src/index.ts`)) as { default: Hono }
  const docs = new Hono().get(
    '/openapi',
    openAPIRouteHandler(mod.default, {
      documentation: { info: { title: 'Petstore', version: '1.0.0' } },
    }),
  )
  const res = await docs.request('/openapi')
  expect(res.status).toBe(200)
  return (await res.json()) as Document
}

const VALIDATION_ERROR = {
  description: 'Validation Error',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', enum: [false] },
          error: { type: 'array', items: {} },
          data: {},
        },
        required: ['success', 'error', 'data'],
      },
    },
  },
}

// zod 4 documents `z.int()` with the safe-integer bounds; valibot's `v.integer()` carries none.
const INTEGER = {
  zod: { type: 'integer', minimum: -9_007_199_254_740_991, maximum: 9_007_199_254_740_991 },
  valibot: { type: 'integer' },
}

describe.each(['zod', 'valibot'] as const)('openapi-%s', (lib) => {
  it('registers every components.schemas entry under its name', async () => {
    const document = await loadDocument(`openapi-${lib}`)
    expect(document.openapi).toBe('3.1.0')
    expect(document.components.schemas).toStrictEqual({
      Tag: { type: 'string', enum: ['dog', 'cat', 'bird'] },
      Pet: {
        type: 'object',
        description: 'A pet in the store',
        properties: {
          id: INTEGER[lib],
          name: { type: 'string', minLength: 1 },
          tag: { $ref: '#/components/schemas/Tag' },
        },
        required: ['id', 'name'],
      },
      NewPet: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1 },
          tag: { $ref: '#/components/schemas/Tag' },
        },
        required: ['name'],
      },
      Error: {
        type: 'object',
        properties: { message: { type: 'string' } },
        required: ['message'],
      },
    })
  })

  it('documents every path under the base path', async () => {
    const document = await loadDocument(`openapi-${lib}`)
    expect(Object.keys(document.paths).toSorted()).toStrictEqual([
      '/api',
      '/api/2024-01/reports',
      '/api/pets',
      '/api/pets/{petId}',
      '/api/pets/{petId}/photos',
    ])
  })

  it('documents an operation from describeRoute and its validators', async () => {
    const document = await loadDocument(`openapi-${lib}`)
    expect(document.paths['/api/pets']?.['get']).toStrictEqual({
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
              schema: { type: 'array', items: { $ref: '#/components/schemas/Pet' } },
            },
          },
        },
        '400': VALIDATION_ERROR,
      },
      parameters: [
        { in: 'query', name: 'limit', schema: { type: 'integer', minimum: 1, maximum: 100 } },
        { in: 'query', name: 'tag', schema: { $ref: '#/components/schemas/Tag' } },
        { in: 'header', name: 'X-Request-Id', schema: { type: 'string' } },
        { in: 'cookie', name: 'session', schema: { type: 'string' } },
      ],
    })
  })

  it('documents a request body behind $ref and a response behind $ref', async () => {
    const document = await loadDocument(`openapi-${lib}`)
    expect(document.paths['/api/pets']?.['post']).toStrictEqual({
      operationId: 'createPet',
      summary: 'Create a pet',
      tags: ['pets'],
      security: [{ apiKey: [] }],
      responses: {
        '201': {
          description: 'Created',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Pet' } } },
        },
        '400': { description: 'Bad request' },
      },
      parameters: [{ in: 'header', name: 'X-Request-Id', schema: { type: 'string' } }],
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { $ref: '#/components/schemas/NewPet' } } },
      },
    })
    expect(document.paths['/api/pets/{petId}']?.['get']).toStrictEqual({
      operationId: 'getPet',
      deprecated: true,
      responses: {
        '200': {
          description: 'The pet',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Pet' } } },
        },
        '400': VALIDATION_ERROR,
        '404': {
          description: 'Not found',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
      },
      parameters: [
        {
          in: 'path',
          name: 'petId',
          required: true,
          schema:
            lib === 'zod'
              ? { type: 'integer', minimum: 1, maximum: 9_007_199_254_740_991 }
              : { type: 'integer', minimum: 1 },
        },
      ],
    })
  })
})
