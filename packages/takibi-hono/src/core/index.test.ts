import fs from 'node:fs'
import fsp from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import { afterAll, beforeAll, describe, expect, it } from 'vite-plus/test'

import { hono } from './index.js'

const PETSTORE_YAML = `openapi: 3.0.3
info:
  title: Petstore
  version: 1.0.0
paths:
  /:
    get:
      summary: Root
      responses:
        '200':
          description: OK
  /pets:
    get:
      summary: List all pets
      parameters:
        - name: limit
          in: query
          required: false
          schema:
            type: integer
      responses:
        '200':
          description: A list of pets
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Pet'
    post:
      summary: Create a pet
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreatePet'
      responses:
        '201':
          description: Created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Pet'
  /pets/{petId}:
    get:
      summary: Get a pet by ID
      parameters:
        - name: petId
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: A pet
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Pet'
    delete:
      summary: Delete a pet
      parameters:
        - name: petId
          in: path
          required: true
          schema:
            type: string
      responses:
        '204':
          description: Deleted
components:
  schemas:
    Pet:
      type: object
      required:
        - id
        - name
      description: A pet in the store
      example:
        id: 1
        name: Buddy
        tag: dog
      properties:
        id:
          type: integer
        name:
          type: string
        tag:
          type: string
    CreatePet:
      type: object
      required:
        - name
      description: Data for creating a new pet
      properties:
        name:
          type: string
        tag:
          type: string
`

const COMPONENTS_YAML = `openapi: 3.0.3
info:
  title: Components Test API
  version: 1.0.0
paths:
  /users:
    get:
      summary: List users
      tags:
        - users
      operationId: listUsers
      responses:
        '200':
          $ref: '#/components/responses/UserListResponse'
        '401':
          $ref: '#/components/responses/UnauthorizedResponse'
    post:
      summary: Create user
      tags:
        - users
      operationId: createUser
      responses:
        '201':
          description: Created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
          headers:
            X-Request-Id:
              $ref: '#/components/headers/X-Request-Id'
  /users/{userId}:
    get:
      summary: Get user by ID
      tags:
        - users
      operationId: getUserById
      deprecated: true
      security:
        - bearerAuth: []
      externalDocs:
        url: https://example.com/docs/users
        description: User documentation
      parameters:
        - name: userId
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: User found
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
          headers:
            X-Rate-Limit:
              $ref: '#/components/headers/X-Rate-Limit'
        '404':
          description: Not found
components:
  schemas:
    User:
      type: object
      required:
        - id
        - name
        - email
      properties:
        id:
          type: integer
        name:
          type: string
        email:
          type: string
        role:
          type: string
          enum:
            - admin
            - user
            - guest
        tags:
          type: array
          items:
            type: string
        address:
          type: object
          properties:
            city:
              type: string
            country:
              type: string
    CreateUser:
      type: object
      required:
        - name
        - email
      properties:
        name:
          type: string
        email:
          type: string
        role:
          type: string
          enum:
            - admin
            - user
            - guest
    Error:
      type: object
      required:
        - code
        - message
      properties:
        code:
          type: integer
        message:
          type: string
  responses:
    UserListResponse:
      description: A list of users
      content:
        application/json:
          schema:
            type: array
            items:
              $ref: '#/components/schemas/User'
      headers:
        X-Total-Count:
          description: Total number of users
          schema:
            type: integer
    UnauthorizedResponse:
      description: Authentication required
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
  parameters:
    PageParam:
      name: page
      in: query
      required: false
      schema:
        type: integer
    LimitParam:
      name: limit
      in: query
      required: false
      schema:
        type: integer
  headers:
    X-Request-Id:
      required: true
      schema:
        type: string
    X-Rate-Limit:
      required: false
      schema:
        type: integer
  examples:
    UserExample:
      summary: A sample user
      value:
        id: 1
        name: John Doe
        email: john@example.com
        role: admin
    ErrorExample:
      summary: A sample error
      value:
        code: 404
        message: Not found
  securitySchemes:
    BearerAuth:
      type: http
      description: JWT Bearer token
      scheme: bearer
      bearerFormat: JWT
    ApiKey:
      type: apiKey
      description: API key authentication
      name: X-API-Key
      in: header
  requestBodies:
    CreateUserBody:
      description: User to create
      required: true
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/CreateUser'
  links:
    GetUserById:
      operationId: getUserById
      parameters:
        userId: '$response.body#/id'
      description: Get user by the ID returned in the response
`

let tempBase: string
let petstoreYaml: string
let componentsYaml: string
let nonexistentYaml: string

beforeAll(async () => {
  tempBase = fs.mkdtempSync(path.join(os.tmpdir(), 'takibi-hono-test-'))
  petstoreYaml = path.join(tempBase, 'petstore.yaml')
  componentsYaml = path.join(tempBase, 'components.yaml')
  nonexistentYaml = path.join(tempBase, 'nonexistent', 'openapi.yaml')
  await fsp.writeFile(petstoreYaml, PETSTORE_YAML)
  await fsp.writeFile(componentsYaml, COMPONENTS_YAML)
})

const tmpDirs: string[] = []
afterAll(async () => {
  for (const d of tmpDirs) await fsp.rm(d, { recursive: true, force: true }).catch(() => {})
  if (tempBase) await fsp.rm(tempBase, { recursive: true, force: true }).catch(() => {})
})

function tmpDir(label: string): string {
  const d = path.join(os.tmpdir(), `takibi-hono-__test_${label}_${Date.now()}`)
  tmpDirs.push(d)
  return d
}

describe('hono', () => {
  describe('zod: standard mode (openapi unset)', () => {
    it.concurrent('schemas.ts', { timeout: 30000 }, async () => {
      const d = tmpDir('zod_standard_schemas')
      const result = await hono({
        input: petstoreYaml,
        schema: 'zod',
        'takibi-hono': {
          handlers: { output: path.join(d, 'handlers') },
          components: { schemas: { output: path.join(d, 'schemas.ts'), exportTypes: true } },
        },
      })
      expect(result).toStrictEqual({ ok: true, value: undefined })

      const schemas = await fsp.readFile(path.join(d, 'schemas.ts'), 'utf-8')
      expect(schemas).toBe(`import * as z from 'zod'

export const PetSchema = z
  .object({ id: z.int(), name: z.string(), tag: z.string().optional() })
  .meta({ description: 'A pet in the store', examples: [{ id: 1, name: 'Buddy', tag: 'dog' }] })

export type Pet = z.infer<typeof PetSchema>

export const CreatePetSchema = z
  .object({ name: z.string(), tag: z.string().optional() })
  .meta({ description: 'Data for creating a new pet' })

export type CreatePet = z.infer<typeof CreatePetSchema>
`)
    })

    it.concurrent(
      'handlers/pets.ts: sValidator, query coerce, $ref body',
      { timeout: 30000 },
      async () => {
        const d = tmpDir('zod_standard_pets')
        const result = await hono({
          input: petstoreYaml,
          schema: 'zod',
          'takibi-hono': {
            handlers: { output: path.join(d, 'handlers') },
            components: { schemas: { output: path.join(d, 'schemas.ts'), exportTypes: true } },
          },
        })
        expect(result).toStrictEqual({ ok: true, value: undefined })

        const pets = await fsp.readFile(path.join(d, 'handlers/pets.ts'), 'utf-8')
        expect(pets).toBe(`import { Hono } from 'hono'
import { sValidator } from '@hono/standard-validator'
import * as z from 'zod'
import { CreatePetSchema } from '../schemas'

export const petsHandler = new Hono()
  .get(
    '/pets',
    sValidator('query', z.object({ limit: z.coerce.number().pipe(z.int()).optional() })),
    (c) => {},
  )
  .post('/pets', sValidator('json', CreatePetSchema), (c) => {})
  .get('/pets/:petId', sValidator('param', z.object({ petId: z.string() })), (c) => {})
  .delete('/pets/:petId', sValidator('param', z.object({ petId: z.string() })), (c) => {})
`)
      },
    )

    it.concurrent('handlers/__root.ts: no validator imports', { timeout: 30000 }, async () => {
      const d = tmpDir('zod_standard_root')
      const result = await hono({
        input: petstoreYaml,
        schema: 'zod',
        'takibi-hono': {
          handlers: { output: path.join(d, 'handlers') },
          components: { schemas: { output: path.join(d, 'schemas.ts'), exportTypes: true } },
        },
      })
      expect(result).toStrictEqual({ ok: true, value: undefined })

      const root = await fsp.readFile(path.join(d, 'handlers/__root.ts'), 'utf-8')
      expect(root).toBe(`import { Hono } from 'hono'

export const rootHandler = new Hono().get('/', (c) => {})
`)
    })

    it.concurrent('handlers/index.ts: barrel exports', { timeout: 30000 }, async () => {
      const d = tmpDir('zod_standard_barrel')
      const result = await hono({
        input: petstoreYaml,
        schema: 'zod',
        'takibi-hono': {
          handlers: { output: path.join(d, 'handlers') },
          components: { schemas: { output: path.join(d, 'schemas.ts'), exportTypes: true } },
        },
      })
      expect(result).toStrictEqual({ ok: true, value: undefined })

      const barrel = await fsp.readFile(path.join(d, 'handlers/index.ts'), 'utf-8')
      expect(barrel).toBe(`export * from './__root'
export * from './pets'
`)
    })

    it.concurrent('index.ts: app with routes', { timeout: 30000 }, async () => {
      const d = tmpDir('zod_standard_app')
      const result = await hono({
        input: petstoreYaml,
        schema: 'zod',
        'takibi-hono': {
          handlers: { output: path.join(d, 'handlers') },
          components: { schemas: { output: path.join(d, 'schemas.ts'), exportTypes: true } },
        },
      })
      expect(result).toStrictEqual({ ok: true, value: undefined })

      const app = await fsp.readFile(path.join(d, 'index.ts'), 'utf-8')
      expect(app).toBe(`import { Hono } from 'hono'
import { rootHandler, petsHandler } from './handlers'

const app = new Hono()

export const api = app.route('/', rootHandler).route('/', petsHandler)

export default app
`)
    })

    it.concurrent('handler files list', { timeout: 30000 }, async () => {
      const d = tmpDir('zod_standard_files')
      const result = await hono({
        input: petstoreYaml,
        schema: 'zod',
        'takibi-hono': {
          handlers: { output: path.join(d, 'handlers') },
          components: { schemas: { output: path.join(d, 'schemas.ts'), exportTypes: true } },
        },
      })
      expect(result).toStrictEqual({ ok: true, value: undefined })

      const files = await fsp.readdir(path.join(d, 'handlers'))
      expect(files.sort()).toStrictEqual(['__root.ts', 'index.ts', 'pets.ts'])
    })
  })

  describe('valibot: standard mode (openapi unset)', () => {
    it.concurrent('schemas.ts', { timeout: 30000 }, async () => {
      const d = tmpDir('valibot_standard_schemas')
      const result = await hono({
        input: petstoreYaml,
        schema: 'valibot',
        'takibi-hono': {
          handlers: { output: path.join(d, 'handlers') },
          components: { schemas: { output: path.join(d, 'schemas.ts'), exportTypes: true } },
        },
      })
      expect(result).toStrictEqual({ ok: true, value: undefined })

      const schemas = await fsp.readFile(path.join(d, 'schemas.ts'), 'utf-8')
      expect(schemas).toBe(`import * as v from 'valibot'

export const PetSchema = v.pipe(
  v.object({ id: v.pipe(v.number(), v.integer()), name: v.string(), tag: v.optional(v.string()) }),
  v.description('A pet in the store'),
  v.metadata({ examples: [{ id: 1, name: 'Buddy', tag: 'dog' }] }),
)

export type Pet = v.InferOutput<typeof PetSchema>

export const CreatePetSchema = v.pipe(
  v.object({ name: v.string(), tag: v.optional(v.string()) }),
  v.description('Data for creating a new pet'),
)

export type CreatePet = v.InferOutput<typeof CreatePetSchema>
`)
    })

    it.concurrent(
      'handlers/pets.ts: sValidator, query coerce with pipe',
      { timeout: 30000 },
      async () => {
        const d = tmpDir('valibot_standard_pets')
        const result = await hono({
          input: petstoreYaml,
          schema: 'valibot',
          'takibi-hono': {
            handlers: { output: path.join(d, 'handlers') },
            components: { schemas: { output: path.join(d, 'schemas.ts'), exportTypes: true } },
          },
        })
        expect(result).toStrictEqual({ ok: true, value: undefined })

        const pets = await fsp.readFile(path.join(d, 'handlers/pets.ts'), 'utf-8')
        expect(pets).toBe(`import { Hono } from 'hono'
import { sValidator } from '@hono/standard-validator'
import * as v from 'valibot'
import { CreatePetSchema } from '../schemas'

export const petsHandler = new Hono()
  .get(
    '/pets',
    sValidator(
      'query',
      v.object({ limit: v.optional(v.pipe(v.string(), v.toNumber(), v.integer())) }),
    ),
    (c) => {},
  )
  .post('/pets', sValidator('json', CreatePetSchema), (c) => {})
  .get('/pets/:petId', sValidator('param', v.object({ petId: v.string() })), (c) => {})
  .delete('/pets/:petId', sValidator('param', v.object({ petId: v.string() })), (c) => {})
`)
      },
    )
  })

  describe('typebox: standard mode (openapi unset)', () => {
    it.concurrent('schemas.ts', { timeout: 30000 }, async () => {
      const d = tmpDir('typebox_standard_schemas')
      const result = await hono({
        input: petstoreYaml,
        schema: 'typebox',
        'takibi-hono': {
          handlers: { output: path.join(d, 'handlers') },
          components: { schemas: { output: path.join(d, 'schemas.ts'), exportTypes: true } },
        },
      })
      expect(result).toStrictEqual({ ok: true, value: undefined })

      const schemas = await fsp.readFile(path.join(d, 'schemas.ts'), 'utf-8')
      expect(schemas).toBe(`import Type from 'typebox'
import type { Static } from 'typebox'

export const PetSchema = Type.Object(
  { id: Type.Integer(), name: Type.String(), tag: Type.Optional(Type.String()) },
  { description: 'A pet in the store', examples: [{ id: 1, name: 'Buddy', tag: 'dog' }] },
)

export type Pet = Static<typeof PetSchema>

export const CreatePetSchema = Type.Object(
  { name: Type.String(), tag: Type.Optional(Type.String()) },
  { description: 'Data for creating a new pet' },
)

export type CreatePet = Static<typeof CreatePetSchema>
`)
    })

    it.concurrent(
      'handlers/pets.ts: typebox path/query uses inline validator + Value.Convert',
      { timeout: 30000 },
      async () => {
        const d = tmpDir('typebox_standard_pets')
        const result = await hono({
          input: petstoreYaml,
          schema: 'typebox',
          'takibi-hono': {
            handlers: { output: path.join(d, 'handlers') },
            components: { schemas: { output: path.join(d, 'schemas.ts'), exportTypes: true } },
          },
        })
        expect(result).toStrictEqual({ ok: true, value: undefined })

        const pets = await fsp.readFile(path.join(d, 'handlers/pets.ts'), 'utf-8')
        expect(pets).toBe(`import { Hono } from 'hono'
import { tbValidator } from '@hono/typebox-validator'
import { validator } from 'hono/validator'
import { Value } from 'typebox/value'
import Type from 'typebox'
import { CreatePetSchema } from '../schemas'

export const petsHandler = new Hono()
  .get(
    '/pets',
    validator('query', (_v, _c) => {
      const _s = Type.Object({ limit: Type.Optional(Type.Integer()) })
      const _x = Value.Convert(_s, _v)
      return Value.Check(_s, _x)
        ? _x
        : _c.json({ success: false, errors: [...Value.Errors(_s, _x)] }, 400)
    }),
    (c) => {},
  )
  .post('/pets', tbValidator('json', CreatePetSchema), (c) => {})
  .get(
    '/pets/:petId',
    validator('param', (_v, _c) => {
      const _s = Type.Object({ petId: Type.String() })
      const _x = Value.Convert(_s, _v)
      return Value.Check(_s, _x)
        ? _x
        : _c.json({ success: false, errors: [...Value.Errors(_s, _x)] }, 400)
    }),
    (c) => {},
  )
  .delete(
    '/pets/:petId',
    validator('param', (_v, _c) => {
      const _s = Type.Object({ petId: Type.String() })
      const _x = Value.Convert(_s, _v)
      return Value.Check(_s, _x)
        ? _x
        : _c.json({ success: false, errors: [...Value.Errors(_s, _x)] }, 400)
    }),
    (c) => {},
  )
`)
      },
    )
  })

  describe('arktype: standard mode (openapi unset)', () => {
    it.concurrent('schemas.ts', { timeout: 30000 }, async () => {
      const d = tmpDir('arktype_standard_schemas')
      const result = await hono({
        input: petstoreYaml,
        schema: 'arktype',
        'takibi-hono': {
          handlers: { output: path.join(d, 'handlers') },
          components: { schemas: { output: path.join(d, 'schemas.ts'), exportTypes: true } },
        },
      })
      expect(result).toStrictEqual({ ok: true, value: undefined })

      const schemas = await fsp.readFile(path.join(d, 'schemas.ts'), 'utf-8')
      expect(schemas).toBe(`import { type } from 'arktype'

export const PetSchema = type({ id: 'number.integer', name: 'string', 'tag?': 'string' }).describe(
  'A pet in the store',
)

export type Pet = typeof PetSchema.infer

export const CreatePetSchema = type({ name: 'string', 'tag?': 'string' }).describe(
  'Data for creating a new pet',
)

export type CreatePet = typeof CreatePetSchema.infer
`)
    })

    it.concurrent(
      'handlers/pets.ts: sValidator, query coerce with parse',
      { timeout: 30000 },
      async () => {
        const d = tmpDir('arktype_standard_pets')
        const result = await hono({
          input: petstoreYaml,
          schema: 'arktype',
          'takibi-hono': {
            handlers: { output: path.join(d, 'handlers') },
            components: { schemas: { output: path.join(d, 'schemas.ts'), exportTypes: true } },
          },
        })
        expect(result).toStrictEqual({ ok: true, value: undefined })

        const pets = await fsp.readFile(path.join(d, 'handlers/pets.ts'), 'utf-8')
        expect(pets).toBe(`import { Hono } from 'hono'
import { sValidator } from '@hono/standard-validator'
import { type } from 'arktype'
import { CreatePetSchema } from '../schemas'

export const petsHandler = new Hono()
  .get(
    '/pets',
    sValidator('query', type({ limit: type('string.integer.parse').optional() })),
    (c) => {},
  )
  .post('/pets', sValidator('json', CreatePetSchema), (c) => {})
  .get('/pets/:petId', sValidator('param', type({ petId: type('string') })), (c) => {})
  .delete('/pets/:petId', sValidator('param', type({ petId: type('string') })), (c) => {})
`)
      },
    )
  })

  describe('effect: standard mode (openapi unset)', () => {
    it.concurrent('schemas.ts', { timeout: 30000 }, async () => {
      const d = tmpDir('effect_standard_schemas')
      const result = await hono({
        input: petstoreYaml,
        schema: 'effect',
        'takibi-hono': {
          handlers: { output: path.join(d, 'handlers') },
          components: { schemas: { output: path.join(d, 'schemas.ts'), exportTypes: true } },
        },
      })
      expect(result).toStrictEqual({ ok: true, value: undefined })

      const schemas = await fsp.readFile(path.join(d, 'schemas.ts'), 'utf-8')
      expect(schemas).toBe(`import { Schema } from 'effect'

export const PetSchema = Schema.Struct({
  id: Schema.Number.pipe(Schema.int()),
  name: Schema.String,
  tag: Schema.optional(Schema.String),
}).annotations({
  description: 'A pet in the store',
  examples: [{ id: 1, name: 'Buddy', tag: 'dog' }],
})

export type Pet = typeof PetSchema.Encoded

export const CreatePetSchema = Schema.Struct({
  name: Schema.String,
  tag: Schema.optional(Schema.String),
}).annotations({ description: 'Data for creating a new pet' })

export type CreatePet = typeof CreatePetSchema.Encoded
`)
    })

    it.concurrent(
      'handlers/pets.ts: effectValidator, query coerce with compose',
      { timeout: 30000 },
      async () => {
        const d = tmpDir('effect_standard_pets')
        const result = await hono({
          input: petstoreYaml,
          schema: 'effect',
          'takibi-hono': {
            handlers: { output: path.join(d, 'handlers') },
            components: { schemas: { output: path.join(d, 'schemas.ts'), exportTypes: true } },
          },
        })
        expect(result).toStrictEqual({ ok: true, value: undefined })

        const pets = await fsp.readFile(path.join(d, 'handlers/pets.ts'), 'utf-8')
        expect(pets).toBe(`import { Hono } from 'hono'
import { effectValidator } from '@hono/effect-validator'
import { Schema } from 'effect'
import { CreatePetSchema } from '../schemas'

export const petsHandler = new Hono()
  .get(
    '/pets',
    effectValidator(
      'query',
      Schema.Struct({
        limit: Schema.optional(Schema.compose(Schema.NumberFromString, Schema.Int)),
      }),
    ),
    (c) => {},
  )
  .post('/pets', effectValidator('json', CreatePetSchema), (c) => {})
  .get('/pets/:petId', effectValidator('param', Schema.Struct({ petId: Schema.String })), (c) => {})
  .delete(
    '/pets/:petId',
    effectValidator('param', Schema.Struct({ petId: Schema.String })),
    (c) => {},
  )
`)
      },
    )
  })

  describe('openapi mode', () => {
    it.concurrent('zod: schemas.ts with openapi: true', { timeout: 30000 }, async () => {
      const d = tmpDir('zod_openapi_schemas')
      const result = await hono({
        input: petstoreYaml,
        schema: 'zod',
        openapi: true,
        'takibi-hono': {
          handlers: { output: path.join(d, 'handlers') },
          components: { schemas: { output: path.join(d, 'schemas.ts'), exportTypes: true } },
        },
      })
      expect(result).toStrictEqual({ ok: true, value: undefined })

      const schemas = await fsp.readFile(path.join(d, 'schemas.ts'), 'utf-8')
      expect(schemas).toBe(`import * as z from 'zod'

export const PetSchema = z
  .object({ id: z.int(), name: z.string(), tag: z.string().optional() })
  .meta({
    ref: 'Pet',
    description: 'A pet in the store',
    examples: [{ id: 1, name: 'Buddy', tag: 'dog' }],
  })

export type Pet = z.infer<typeof PetSchema>

export const CreatePetSchema = z
  .object({ name: z.string(), tag: z.string().optional() })
  .meta({ ref: 'CreatePet', description: 'Data for creating a new pet' })

export type CreatePet = z.infer<typeof CreatePetSchema>
`)
    })

    it.concurrent(
      'zod: handlers/pets.ts uses describeRoute + resolver + validator',
      { timeout: 30000 },
      async () => {
        const d = tmpDir('zod_openapi_pets')
        const result = await hono({
          input: petstoreYaml,
          schema: 'zod',
          openapi: true,
          'takibi-hono': {
            handlers: { output: path.join(d, 'handlers') },
            components: { schemas: { output: path.join(d, 'schemas.ts'), exportTypes: true } },
          },
        })
        expect(result).toStrictEqual({ ok: true, value: undefined })

        const pets = await fsp.readFile(path.join(d, 'handlers/pets.ts'), 'utf-8')
        expect(pets).toBe(`import { Hono } from 'hono'
import { describeRoute, resolver, validator } from 'hono-openapi'
import * as z from 'zod'
import { CreatePetSchema, PetSchema } from '../schemas'

export const petsHandler = new Hono()
  .get(
    '/pets',
    describeRoute({
      summary: 'List all pets',
      responses: {
        200: {
          description: 'A list of pets',
          content: { 'application/json': { schema: resolver(z.array(PetSchema)) } },
        },
      },
    }),
    validator('query', z.object({ limit: z.int().optional() })),
    (c) => {},
  )
  .post(
    '/pets',
    describeRoute({
      summary: 'Create a pet',
      responses: {
        201: {
          description: 'Created',
          content: { 'application/json': { schema: resolver(PetSchema) } },
        },
      },
    }),
    validator('json', CreatePetSchema),
    (c) => {},
  )
  .get(
    '/pets/:petId',
    describeRoute({
      summary: 'Get a pet by ID',
      responses: {
        200: {
          description: 'A pet',
          content: { 'application/json': { schema: resolver(PetSchema) } },
        },
      },
    }),
    validator('param', z.object({ petId: z.string() })),
    (c) => {},
  )
  .delete(
    '/pets/:petId',
    describeRoute({ summary: 'Delete a pet', responses: { 204: { description: 'Deleted' } } }),
    validator('param', z.object({ petId: z.string() })),
    (c) => {},
  )
`)
      },
    )

    it.concurrent('zod: handler files list', { timeout: 30000 }, async () => {
      const d = tmpDir('zod_openapi_files')
      const result = await hono({
        input: petstoreYaml,
        schema: 'zod',
        openapi: true,
        'takibi-hono': {
          handlers: { output: path.join(d, 'handlers') },
          components: { schemas: { output: path.join(d, 'schemas.ts'), exportTypes: true } },
        },
      })
      expect(result).toStrictEqual({ ok: true, value: undefined })

      const files = await fsp.readdir(path.join(d, 'handlers'))
      expect(files.sort()).toStrictEqual(['__root.ts', 'index.ts', 'pets.ts'])
    })
  })

  describe('basePath', () => {
    it.concurrent('index.ts includes basePath', { timeout: 30000 }, async () => {
      const d = tmpDir('basepath')
      const result = await hono({
        input: petstoreYaml,
        schema: 'zod',
        openapi: true,
        basePath: '/api',
        'takibi-hono': {
          handlers: { output: path.join(d, 'handlers') },
          components: { schemas: { output: path.join(d, 'schemas.ts') } },
        },
      })
      expect(result).toStrictEqual({ ok: true, value: undefined })

      const app = await fsp.readFile(path.join(d, 'index.ts'), 'utf-8')
      expect(app).toBe(`import { Hono } from 'hono'
import { rootHandler, petsHandler } from './handlers'

const app = new Hono().basePath('/api')

export const api = app.route('/', rootHandler).route('/', petsHandler)

export default app
`)
    })
  })

  describe('error handling', () => {
    it.concurrent(
      'returns ok: false with error string for invalid input path',
      { timeout: 30000 },
      async () => {
        const result = await hono({
          input: nonexistentYaml,
          schema: 'zod',
          'takibi-hono': {
            handlers: { output: path.join(os.tmpdir(), '__test_error/handlers') },
            components: {
              schemas: { output: path.join(os.tmpdir(), '__test_error/schemas.ts') },
            },
          },
        })
        expect(result.ok).toBe(false)
        if (!result.ok) {
          expect(typeof result.error).toBe('string')
          expect(result.error).toBe(
            `Error opening file ${path.resolve(nonexistentYaml)}: ENOENT: no such file or directory, open '${path.resolve(nonexistentYaml)}'`,
          )
        }
      },
    )
  })

  describe('split schemas mode (openapi: true, schemas split)', () => {
    it.concurrent('schemas/pet.ts: individual schema file', { timeout: 30000 }, async () => {
      const d = tmpDir('split_schemas_pet')
      const result = await hono({
        input: petstoreYaml,
        schema: 'zod',
        openapi: true,
        'takibi-hono': {
          handlers: { output: path.join(d, 'handlers') },
          components: {
            schemas: { output: path.join(d, 'schemas'), split: true, exportTypes: true },
          },
        },
      })
      expect(result).toStrictEqual({ ok: true, value: undefined })

      const pet = await fsp.readFile(path.join(d, 'schemas/pet.ts'), 'utf-8')
      expect(pet).toBe(`import * as z from 'zod'

export const PetSchema = z
  .object({ id: z.int(), name: z.string(), tag: z.string().optional() })
  .meta({
    ref: 'Pet',
    description: 'A pet in the store',
    examples: [{ id: 1, name: 'Buddy', tag: 'dog' }],
  })

export type Pet = z.infer<typeof PetSchema>
`)
    })

    it.concurrent('schemas/createPet.ts: individual schema file', { timeout: 30000 }, async () => {
      const d = tmpDir('split_schemas_createpet')
      const result = await hono({
        input: petstoreYaml,
        schema: 'zod',
        openapi: true,
        'takibi-hono': {
          handlers: { output: path.join(d, 'handlers') },
          components: {
            schemas: { output: path.join(d, 'schemas'), split: true, exportTypes: true },
          },
        },
      })
      expect(result).toStrictEqual({ ok: true, value: undefined })

      const createPet = await fsp.readFile(path.join(d, 'schemas/createPet.ts'), 'utf-8')
      expect(createPet).toBe(`import * as z from 'zod'

export const CreatePetSchema = z
  .object({ name: z.string(), tag: z.string().optional() })
  .meta({ ref: 'CreatePet', description: 'Data for creating a new pet' })

export type CreatePet = z.infer<typeof CreatePetSchema>
`)
    })

    it.concurrent(
      'schemas/index.ts: barrel file re-exports all schemas',
      { timeout: 30000 },
      async () => {
        const d = tmpDir('split_schemas_barrel')
        const result = await hono({
          input: petstoreYaml,
          schema: 'zod',
          openapi: true,
          'takibi-hono': {
            handlers: { output: path.join(d, 'handlers') },
            components: {
              schemas: { output: path.join(d, 'schemas'), split: true, exportTypes: true },
            },
          },
        })
        expect(result).toStrictEqual({ ok: true, value: undefined })

        const barrel = await fsp.readFile(path.join(d, 'schemas/index.ts'), 'utf-8')
        expect(barrel).toBe(`export * from './createPet'
export * from './pet'
`)
      },
    )

    it.concurrent(
      'schemas directory contains exactly the expected files',
      { timeout: 30000 },
      async () => {
        const d = tmpDir('split_schemas_files')
        const result = await hono({
          input: petstoreYaml,
          schema: 'zod',
          openapi: true,
          'takibi-hono': {
            handlers: { output: path.join(d, 'handlers') },
            components: {
              schemas: { output: path.join(d, 'schemas'), split: true, exportTypes: true },
            },
          },
        })
        expect(result).toStrictEqual({ ok: true, value: undefined })

        const files = await fsp.readdir(path.join(d, 'schemas'))
        expect(files.sort()).toStrictEqual(['createPet.ts', 'index.ts', 'pet.ts'])
      },
    )
  })

  describe('handlers always use split mode', () => {
    it.concurrent('handlers/index.ts: barrel exports', { timeout: 30000 }, async () => {
      const d = tmpDir('always_split_barrel')
      const result = await hono({
        input: petstoreYaml,
        schema: 'zod',
        'takibi-hono': {
          handlers: { output: path.join(d, 'handlers') },
          components: { schemas: { output: path.join(d, 'schemas.ts'), exportTypes: true } },
        },
      })
      expect(result).toStrictEqual({ ok: true, value: undefined })

      const barrel = await fsp.readFile(path.join(d, 'handlers/index.ts'), 'utf-8')
      expect(barrel).toBe(`export * from './__root'
export * from './pets'
`)
    })

    it.concurrent('index.ts: app routes split handlers', { timeout: 30000 }, async () => {
      const d = tmpDir('always_split_app')
      const result = await hono({
        input: petstoreYaml,
        schema: 'zod',
        'takibi-hono': {
          handlers: { output: path.join(d, 'handlers') },
          components: { schemas: { output: path.join(d, 'schemas.ts'), exportTypes: true } },
        },
      })
      expect(result).toStrictEqual({ ok: true, value: undefined })

      const app = await fsp.readFile(path.join(d, 'index.ts'), 'utf-8')
      expect(app).toBe(`import { Hono } from 'hono'
import { rootHandler, petsHandler } from './handlers'

const app = new Hono()

export const api = app.route('/', rootHandler).route('/', petsHandler)

export default app
`)
    })

    it.concurrent('handlers dir has split files', { timeout: 30000 }, async () => {
      const d = tmpDir('always_split_dirlist')
      const result = await hono({
        input: petstoreYaml,
        schema: 'zod',
        'takibi-hono': {
          handlers: { output: path.join(d, 'handlers') },
          components: { schemas: { output: path.join(d, 'schemas.ts'), exportTypes: true } },
        },
      })
      expect(result).toStrictEqual({ ok: true, value: undefined })

      const files = await fsp.readdir(path.join(d, 'handlers'))
      expect(files.sort()).toStrictEqual(['__root.ts', 'index.ts', 'pets.ts'])
    })
  })

  describe('component file generation (components API fixture)', () => {
    it.concurrent(
      'responses.ts: response objects with resolver and schema imports',
      { timeout: 30000 },
      async () => {
        const d = tmpDir('comp_responses')
        const result = await hono({
          input: componentsYaml,
          schema: 'zod',
          openapi: true,
          'takibi-hono': {
            handlers: { output: path.join(d, 'handlers') },
            components: {
              schemas: { output: path.join(d, 'schemas.ts'), exportTypes: true },
              responses: { output: path.join(d, 'responses.ts') },
              parameters: { output: path.join(d, 'parameters.ts') },
              headers: { output: path.join(d, 'headers.ts') },
              examples: { output: path.join(d, 'examples.ts') },
              securitySchemes: { output: path.join(d, 'security-schemes.ts') },
              requestBodies: { output: path.join(d, 'request-bodies.ts') },
              links: { output: path.join(d, 'links.ts') },
            },
          },
        })
        expect(result).toStrictEqual({ ok: true, value: undefined })

        const responses = await fsp.readFile(path.join(d, 'responses.ts'), 'utf-8')
        expect(responses).toBe(`import { resolver } from 'hono-openapi'
import * as z from 'zod'
import { ErrorSchema, UserSchema } from './schemas'

export const UserListResponseResponse = {
  description: 'A list of users',
  content: { 'application/json': { schema: resolver(z.array(UserSchema)) } },
  headers: {
    'X-Total-Count': { description: 'Total number of users', schema: { type: 'integer' } as const },
  },
}

export const UnauthorizedResponseResponse = {
  description: 'Authentication required',
  content: { 'application/json': { schema: resolver(ErrorSchema) } },
}
`)
      },
    )

    it.concurrent('parameters.ts: parameter schemas', { timeout: 30000 }, async () => {
      const d = tmpDir('comp_parameters')
      const result = await hono({
        input: componentsYaml,
        schema: 'zod',
        openapi: true,
        'takibi-hono': {
          handlers: { output: path.join(d, 'handlers') },
          components: {
            schemas: { output: path.join(d, 'schemas.ts'), exportTypes: true },
            parameters: { output: path.join(d, 'parameters.ts') },
          },
        },
      })
      expect(result).toStrictEqual({ ok: true, value: undefined })

      const parameters = await fsp.readFile(path.join(d, 'parameters.ts'), 'utf-8')
      expect(parameters).toBe(`import * as z from 'zod'

export const PageParamParamsSchema = z.int().optional()

export const LimitParamParamsSchema = z.int().optional()
`)
    })

    it.concurrent('headers.ts: header schemas', { timeout: 30000 }, async () => {
      const d = tmpDir('comp_headers')
      const result = await hono({
        input: componentsYaml,
        schema: 'zod',
        openapi: true,
        'takibi-hono': {
          handlers: { output: path.join(d, 'handlers') },
          components: {
            schemas: { output: path.join(d, 'schemas.ts'), exportTypes: true },
            headers: { output: path.join(d, 'headers.ts') },
          },
        },
      })
      expect(result).toStrictEqual({ ok: true, value: undefined })

      const headers = await fsp.readFile(path.join(d, 'headers.ts'), 'utf-8')
      expect(headers).toBe(`import * as z from 'zod'

export const XRequestIdHeaderSchema = z.string()

export const XRateLimitHeaderSchema = z.int().optional()
`)
    })

    it.concurrent('examples.ts: example objects', { timeout: 30000 }, async () => {
      const d = tmpDir('comp_examples')
      const result = await hono({
        input: componentsYaml,
        schema: 'zod',
        openapi: true,
        'takibi-hono': {
          handlers: { output: path.join(d, 'handlers') },
          components: {
            schemas: { output: path.join(d, 'schemas.ts'), exportTypes: true },
            examples: { output: path.join(d, 'examples.ts') },
          },
        },
      })
      expect(result).toStrictEqual({ ok: true, value: undefined })

      const examples = await fsp.readFile(path.join(d, 'examples.ts'), 'utf-8')
      expect(examples).toBe(`export const UserExampleExample = {
  summary: 'A sample user',
  value: { id: 1, name: 'John Doe', email: 'john@example.com', role: 'admin' },
}

export const ErrorExampleExample = {
  summary: 'A sample error',
  value: { code: 404, message: 'Not found' },
}
`)
    })

    it.concurrent('security-schemes.ts: security scheme objects', { timeout: 30000 }, async () => {
      const d = tmpDir('comp_security')
      const result = await hono({
        input: componentsYaml,
        schema: 'zod',
        openapi: true,
        'takibi-hono': {
          handlers: { output: path.join(d, 'handlers') },
          components: {
            schemas: { output: path.join(d, 'schemas.ts'), exportTypes: true },
            securitySchemes: { output: path.join(d, 'security-schemes.ts') },
          },
        },
      })
      expect(result).toStrictEqual({ ok: true, value: undefined })

      const securitySchemes = await fsp.readFile(path.join(d, 'security-schemes.ts'), 'utf-8')
      expect(securitySchemes).toBe(`export const BearerAuthSecurityScheme = {
  type: 'http',
  description: 'JWT Bearer token',
  scheme: 'bearer',
  bearerFormat: 'JWT',
}

export const ApiKeySecurityScheme = {
  type: 'apiKey',
  description: 'API key authentication',
  name: 'X-API-Key',
  in: 'header',
}
`)
    })

    it.concurrent(
      'request-bodies.ts: request body objects with schema imports',
      { timeout: 30000 },
      async () => {
        const d = tmpDir('comp_reqbodies')
        const result = await hono({
          input: componentsYaml,
          schema: 'zod',
          openapi: true,
          'takibi-hono': {
            handlers: { output: path.join(d, 'handlers') },
            components: {
              schemas: { output: path.join(d, 'schemas.ts'), exportTypes: true },
              requestBodies: { output: path.join(d, 'request-bodies.ts') },
            },
          },
        })
        expect(result).toStrictEqual({ ok: true, value: undefined })

        const requestBodies = await fsp.readFile(path.join(d, 'request-bodies.ts'), 'utf-8')
        expect(requestBodies).toBe(`import { CreateUserSchema } from './schemas'

export const CreateUserBodyRequestBody = {
  description: 'User to create',
  required: true,
  content: { 'application/json': { schema: CreateUserSchema } },
}
`)
      },
    )

    it.concurrent('links.ts: link objects', { timeout: 30000 }, async () => {
      const d = tmpDir('comp_links')
      const result = await hono({
        input: componentsYaml,
        schema: 'zod',
        openapi: true,
        'takibi-hono': {
          handlers: { output: path.join(d, 'handlers') },
          components: {
            schemas: { output: path.join(d, 'schemas.ts'), exportTypes: true },
            links: { output: path.join(d, 'links.ts') },
          },
        },
      })
      expect(result).toStrictEqual({ ok: true, value: undefined })

      const links = await fsp.readFile(path.join(d, 'links.ts'), 'utf-8')
      expect(links).toBe(`export const GetUserByIdLink = {
  operationId: 'getUserById',
  parameters: { userId: '$response.body#/id' },
  description: 'Get user by the ID returned in the response',
}
`)
    })

    it.concurrent(
      'schemas.ts: component schemas for components API',
      { timeout: 30000 },
      async () => {
        const d = tmpDir('comp_schemas')
        const result = await hono({
          input: componentsYaml,
          schema: 'zod',
          openapi: true,
          'takibi-hono': {
            handlers: { output: path.join(d, 'handlers') },
            components: {
              schemas: { output: path.join(d, 'schemas.ts'), exportTypes: true },
            },
          },
        })
        expect(result).toStrictEqual({ ok: true, value: undefined })

        const schemas = await fsp.readFile(path.join(d, 'schemas.ts'), 'utf-8')
        expect(schemas).toBe(`import * as z from 'zod'

export const UserSchema = z
  .object({
    id: z.int(),
    name: z.string(),
    email: z.string(),
    role: z.enum(['admin', 'user', 'guest']).optional(),
    tags: z.array(z.string()).optional(),
    address: z.object({ city: z.string(), country: z.string() }).partial().optional(),
  })
  .meta({ ref: 'User' })

export type User = z.infer<typeof UserSchema>

export const CreateUserSchema = z
  .object({
    name: z.string(),
    email: z.string(),
    role: z.enum(['admin', 'user', 'guest']).optional(),
  })
  .meta({ ref: 'CreateUser' })

export type CreateUser = z.infer<typeof CreateUserSchema>

export const ErrorSchema = z.object({ code: z.int(), message: z.string() }).meta({ ref: 'Error' })

export type Error = z.infer<typeof ErrorSchema>
`)
      },
    )

    it.concurrent(
      'handlers/users.ts: handler with component imports (responses, headers)',
      { timeout: 30000 },
      async () => {
        const d = tmpDir('comp_handler_users')
        const result = await hono({
          input: componentsYaml,
          schema: 'zod',
          openapi: true,
          'takibi-hono': {
            handlers: { output: path.join(d, 'handlers') },
            components: {
              schemas: { output: path.join(d, 'schemas.ts'), exportTypes: true },
              responses: { output: path.join(d, 'responses.ts') },
              headers: { output: path.join(d, 'headers.ts') },
            },
          },
        })
        expect(result).toStrictEqual({ ok: true, value: undefined })

        const users = await fsp.readFile(path.join(d, 'handlers/users.ts'), 'utf-8')
        expect(users).toBe(`import { Hono } from 'hono'
import { describeRoute, resolver, validator } from 'hono-openapi'
import * as z from 'zod'
import { UserSchema } from '../schemas'
import { UnauthorizedResponseResponse, UserListResponseResponse } from '../responses'
import { XRateLimitHeaderSchema, XRequestIdHeaderSchema } from '../headers'

export const usersHandler = new Hono()
  .get(
    '/users',
    describeRoute({
      summary: 'List users',
      tags: ['users'],
      operationId: 'listUsers',
      responses: { 200: UserListResponseResponse, 401: UnauthorizedResponseResponse },
    }),
    (c) => {},
  )
  .post(
    '/users',
    describeRoute({
      summary: 'Create user',
      tags: ['users'],
      operationId: 'createUser',
      responses: {
        201: {
          description: 'Created',
          content: { 'application/json': { schema: resolver(UserSchema) } },
          headers: { 'X-Request-Id': XRequestIdHeaderSchema },
        },
      },
    }),
    (c) => {},
  )
  .get(
    '/users/:userId',
    describeRoute({
      summary: 'Get user by ID',
      tags: ['users'],
      operationId: 'getUserById',
      deprecated: true,
      security: [{ bearerAuth: [] }],
      externalDocs: { url: 'https://example.com/docs/users', description: 'User documentation' },
      responses: {
        200: {
          description: 'User found',
          content: { 'application/json': { schema: resolver(UserSchema) } },
          headers: { 'X-Rate-Limit': XRateLimitHeaderSchema },
        },
        404: { description: 'Not found' },
      },
    }),
    validator('param', z.object({ userId: z.string() })),
    (c) => {},
  )
`)
      },
    )
  })

  describe('shared output', () => {
    it.concurrent(
      '__root.ts is identical across all schema libraries',
      { timeout: 30000 },
      async () => {
        const expected = `import { Hono } from 'hono'

export const rootHandler = new Hono().get('/', (c) => {})
`
        for (const schema of ['zod', 'valibot', 'typebox', 'arktype', 'effect'] as const) {
          const d = tmpDir(`shared_root_${schema}`)
          const result = await hono({
            input: petstoreYaml,
            schema,
            'takibi-hono': {
              handlers: { output: path.join(d, 'handlers') },
              components: { schemas: { output: path.join(d, 'schemas.ts'), exportTypes: true } },
            },
          })
          expect(result).toStrictEqual({ ok: true, value: undefined })
          const root = await fsp.readFile(path.join(d, 'handlers/__root.ts'), 'utf-8')
          expect(root).toBe(expected)
        }
      },
    )

    it.concurrent(
      'barrel index.ts is identical across all schema libraries',
      { timeout: 30000 },
      async () => {
        const expected = `export * from './__root'
export * from './pets'
`
        for (const schema of ['zod', 'valibot', 'typebox', 'arktype', 'effect'] as const) {
          const d = tmpDir(`shared_barrel_${schema}`)
          const result = await hono({
            input: petstoreYaml,
            schema,
            'takibi-hono': {
              handlers: { output: path.join(d, 'handlers') },
              components: { schemas: { output: path.join(d, 'schemas.ts'), exportTypes: true } },
            },
          })
          expect(result).toStrictEqual({ ok: true, value: undefined })
          const barrel = await fsp.readFile(path.join(d, 'handlers/index.ts'), 'utf-8')
          expect(barrel).toBe(expected)
        }
      },
    )

    it.concurrent(
      'app index.ts is identical across all schema libraries',
      { timeout: 30000 },
      async () => {
        const expected = `import { Hono } from 'hono'
import { rootHandler, petsHandler } from './handlers'

const app = new Hono()

export const api = app.route('/', rootHandler).route('/', petsHandler)

export default app
`
        for (const schema of ['zod', 'valibot', 'typebox', 'arktype', 'effect'] as const) {
          const d = tmpDir(`shared_app_${schema}`)
          const result = await hono({
            input: petstoreYaml,
            schema,
            'takibi-hono': {
              handlers: { output: path.join(d, 'handlers') },
              components: { schemas: { output: path.join(d, 'schemas.ts'), exportTypes: true } },
            },
          })
          expect(result).toStrictEqual({ ok: true, value: undefined })
          const app = await fsp.readFile(path.join(d, 'index.ts'), 'utf-8')
          expect(app).toBe(expected)
        }
      },
    )
  })

  describe('valibot: split schemas mode (schemas.split: true)', () => {
    it.concurrent(
      'schemas/pet.ts: individual valibot schema file',
      { timeout: 30000 },
      async () => {
        const d = tmpDir('valibot_split_schemas_pet')
        const result = await hono({
          input: petstoreYaml,
          schema: 'valibot',
          openapi: true,
          'takibi-hono': {
            handlers: { output: path.join(d, 'handlers') },
            components: {
              schemas: { output: path.join(d, 'schemas'), split: true, exportTypes: true },
            },
          },
        })
        expect(result).toStrictEqual({ ok: true, value: undefined })

        const pet = await fsp.readFile(path.join(d, 'schemas/pet.ts'), 'utf-8')
        expect(pet).toBe(`import * as v from 'valibot'

export const PetSchema = v.pipe(
  v.object({ id: v.pipe(v.number(), v.integer()), name: v.string(), tag: v.optional(v.string()) }),
  v.description('A pet in the store'),
  v.metadata({ ref: 'Pet', examples: [{ id: 1, name: 'Buddy', tag: 'dog' }] }),
)

export type Pet = v.InferOutput<typeof PetSchema>
`)
      },
    )

    it.concurrent(
      'schemas/createPet.ts: individual valibot schema file',
      { timeout: 30000 },
      async () => {
        const d = tmpDir('valibot_split_schemas_createpet')
        const result = await hono({
          input: petstoreYaml,
          schema: 'valibot',
          openapi: true,
          'takibi-hono': {
            handlers: { output: path.join(d, 'handlers') },
            components: {
              schemas: { output: path.join(d, 'schemas'), split: true, exportTypes: true },
            },
          },
        })
        expect(result).toStrictEqual({ ok: true, value: undefined })

        const createPet = await fsp.readFile(path.join(d, 'schemas/createPet.ts'), 'utf-8')
        expect(createPet).toBe(`import * as v from 'valibot'

export const CreatePetSchema = v.pipe(
  v.object({ name: v.string(), tag: v.optional(v.string()) }),
  v.description('Data for creating a new pet'),
  v.metadata({ ref: 'CreatePet' }),
)

export type CreatePet = v.InferOutput<typeof CreatePetSchema>
`)
      },
    )

    it.concurrent(
      'schemas/index.ts: barrel re-exports all valibot schemas',
      { timeout: 30000 },
      async () => {
        const d = tmpDir('valibot_split_schemas_barrel')
        const result = await hono({
          input: petstoreYaml,
          schema: 'valibot',
          openapi: true,
          'takibi-hono': {
            handlers: { output: path.join(d, 'handlers') },
            components: {
              schemas: { output: path.join(d, 'schemas'), split: true, exportTypes: true },
            },
          },
        })
        expect(result).toStrictEqual({ ok: true, value: undefined })

        const barrel = await fsp.readFile(path.join(d, 'schemas/index.ts'), 'utf-8')
        expect(barrel).toBe(`export * from './createPet'
export * from './pet'
`)
      },
    )
  })

  describe('effect: split schemas mode (schemas.split: true)', () => {
    it.concurrent(
      'schemas/pet.ts: individual effect schema with Encoded type',
      { timeout: 30000 },
      async () => {
        const d = tmpDir('effect_split_schemas_pet')
        const result = await hono({
          input: petstoreYaml,
          schema: 'effect',
          openapi: true,
          'takibi-hono': {
            handlers: { output: path.join(d, 'handlers') },
            components: {
              schemas: { output: path.join(d, 'schemas'), split: true, exportTypes: true },
            },
          },
        })
        expect(result).toStrictEqual({ ok: true, value: undefined })

        const pet = await fsp.readFile(path.join(d, 'schemas/pet.ts'), 'utf-8')
        expect(pet).toBe(`import { Schema } from 'effect'

export const PetSchema = Schema.Struct({
  id: Schema.Number.pipe(Schema.int()),
  name: Schema.String,
  tag: Schema.optional(Schema.String),
}).annotations({
  identifier: 'Pet',
  description: 'A pet in the store',
  examples: [{ id: 1, name: 'Buddy', tag: 'dog' }],
})

export type Pet = typeof PetSchema.Encoded
`)
      },
    )

    it.concurrent(
      'schemas/createPet.ts: individual effect schema with Encoded type',
      { timeout: 30000 },
      async () => {
        const d = tmpDir('effect_split_schemas_createpet')
        const result = await hono({
          input: petstoreYaml,
          schema: 'effect',
          openapi: true,
          'takibi-hono': {
            handlers: { output: path.join(d, 'handlers') },
            components: {
              schemas: { output: path.join(d, 'schemas'), split: true, exportTypes: true },
            },
          },
        })
        expect(result).toStrictEqual({ ok: true, value: undefined })

        const createPet = await fsp.readFile(path.join(d, 'schemas/createPet.ts'), 'utf-8')
        expect(createPet).toBe(`import { Schema } from 'effect'

export const CreatePetSchema = Schema.Struct({
  name: Schema.String,
  tag: Schema.optional(Schema.String),
}).annotations({ identifier: 'CreatePet', description: 'Data for creating a new pet' })

export type CreatePet = typeof CreatePetSchema.Encoded
`)
      },
    )

    it.concurrent(
      'schemas/index.ts: barrel re-exports all effect schemas',
      { timeout: 30000 },
      async () => {
        const d = tmpDir('effect_split_schemas_barrel')
        const result = await hono({
          input: petstoreYaml,
          schema: 'effect',
          openapi: true,
          'takibi-hono': {
            handlers: { output: path.join(d, 'handlers') },
            components: {
              schemas: { output: path.join(d, 'schemas'), split: true, exportTypes: true },
            },
          },
        })
        expect(result).toStrictEqual({ ok: true, value: undefined })

        const barrel = await fsp.readFile(path.join(d, 'schemas/index.ts'), 'utf-8')
        expect(barrel).toBe(`export * from './createPet'
export * from './pet'
`)
      },
    )
  })

  describe('valibot: handlers always use split mode', () => {
    it.concurrent('handlers/index.ts: barrel exports for valibot', { timeout: 30000 }, async () => {
      const d = tmpDir('valibot_always_split_barrel')
      const result = await hono({
        input: petstoreYaml,
        schema: 'valibot',
        'takibi-hono': {
          handlers: { output: path.join(d, 'handlers') },
          components: { schemas: { output: path.join(d, 'schemas.ts'), exportTypes: true } },
        },
      })
      expect(result).toStrictEqual({ ok: true, value: undefined })

      const barrel = await fsp.readFile(path.join(d, 'handlers/index.ts'), 'utf-8')
      expect(barrel).toBe(`export * from './__root'
export * from './pets'
`)
    })

    it.concurrent('index.ts: app routes split valibot handlers', { timeout: 30000 }, async () => {
      const d = tmpDir('valibot_always_split_app')
      const result = await hono({
        input: petstoreYaml,
        schema: 'valibot',
        'takibi-hono': {
          handlers: { output: path.join(d, 'handlers') },
          components: { schemas: { output: path.join(d, 'schemas.ts'), exportTypes: true } },
        },
      })
      expect(result).toStrictEqual({ ok: true, value: undefined })

      const app = await fsp.readFile(path.join(d, 'index.ts'), 'utf-8')
      expect(app).toBe(`import { Hono } from 'hono'
import { rootHandler, petsHandler } from './handlers'

const app = new Hono()

export const api = app.route('/', rootHandler).route('/', petsHandler)

export default app
`)
    })

    it.concurrent('handlers dir has split files', { timeout: 30000 }, async () => {
      const d = tmpDir('valibot_always_split_dirlist')
      const result = await hono({
        input: petstoreYaml,
        schema: 'valibot',
        'takibi-hono': {
          handlers: { output: path.join(d, 'handlers') },
          components: { schemas: { output: path.join(d, 'schemas.ts'), exportTypes: true } },
        },
      })
      expect(result).toStrictEqual({ ok: true, value: undefined })

      const files = await fsp.readdir(path.join(d, 'handlers'))
      expect(files.sort()).toStrictEqual(['__root.ts', 'index.ts', 'pets.ts'])
    })
  })

  describe('component responses with split (responses.split: true)', () => {
    it.concurrent('individual response files and barrel', { timeout: 30000 }, async () => {
      const d = tmpDir('comp_responses_split')
      const result = await hono({
        input: componentsYaml,
        schema: 'zod',
        openapi: true,
        'takibi-hono': {
          handlers: { output: path.join(d, 'handlers') },
          components: {
            schemas: { output: path.join(d, 'schemas.ts'), exportTypes: true },
            responses: { output: path.join(d, 'responses'), split: true },
          },
        },
      })
      expect(result).toStrictEqual({ ok: true, value: undefined })

      const files = await fsp.readdir(path.join(d, 'responses'))
      expect(files.sort()).toStrictEqual([
        'index.ts',
        'unauthorizedResponseResponse.ts',
        'userListResponseResponse.ts',
      ])

      const userListResp = await fsp.readFile(
        path.join(d, 'responses/userListResponseResponse.ts'),
        'utf-8',
      )
      expect(userListResp).toBe(`import { resolver } from 'hono-openapi'
import * as z from 'zod'
import { UserSchema } from '../schemas'

export const UserListResponseResponse = {
  description: 'A list of users',
  content: { 'application/json': { schema: resolver(z.array(UserSchema)) } },
  headers: {
    'X-Total-Count': { description: 'Total number of users', schema: { type: 'integer' } as const },
  },
}
`)

      const unauthorizedResp = await fsp.readFile(
        path.join(d, 'responses/unauthorizedResponseResponse.ts'),
        'utf-8',
      )
      expect(unauthorizedResp).toBe(`import { resolver } from 'hono-openapi'
import { ErrorSchema } from '../schemas'

export const UnauthorizedResponseResponse = {
  description: 'Authentication required',
  content: { 'application/json': { schema: resolver(ErrorSchema) } },
}
`)

      const barrel = await fsp.readFile(path.join(d, 'responses/index.ts'), 'utf-8')
      expect(barrel).toBe(`export * from './unauthorizedResponseResponse'
export * from './userListResponseResponse'
`)
    })
  })

  describe('multiple component types together', () => {
    it.concurrent(
      'schemas + parameters + responses all configured with cross-component imports',
      { timeout: 30000 },
      async () => {
        const d = tmpDir('multi_components')
        const result = await hono({
          input: componentsYaml,
          schema: 'zod',
          openapi: true,
          'takibi-hono': {
            handlers: { output: path.join(d, 'handlers') },
            components: {
              schemas: { output: path.join(d, 'schemas.ts'), exportTypes: true },
              parameters: { output: path.join(d, 'parameters.ts') },
              responses: { output: path.join(d, 'responses.ts') },
              headers: { output: path.join(d, 'headers.ts') },
            },
          },
        })
        expect(result).toStrictEqual({ ok: true, value: undefined })

        // schemas.ts should exist
        const schemas = await fsp.readFile(path.join(d, 'schemas.ts'), 'utf-8')
        expect(schemas).toBe(`import * as z from 'zod'

export const UserSchema = z
  .object({
    id: z.int(),
    name: z.string(),
    email: z.string(),
    role: z.enum(['admin', 'user', 'guest']).optional(),
    tags: z.array(z.string()).optional(),
    address: z.object({ city: z.string(), country: z.string() }).partial().optional(),
  })
  .meta({ ref: 'User' })

export type User = z.infer<typeof UserSchema>

export const CreateUserSchema = z
  .object({
    name: z.string(),
    email: z.string(),
    role: z.enum(['admin', 'user', 'guest']).optional(),
  })
  .meta({ ref: 'CreateUser' })

export type CreateUser = z.infer<typeof CreateUserSchema>

export const ErrorSchema = z.object({ code: z.int(), message: z.string() }).meta({ ref: 'Error' })

export type Error = z.infer<typeof ErrorSchema>
`)

        // parameters.ts should exist
        const parameters = await fsp.readFile(path.join(d, 'parameters.ts'), 'utf-8')
        expect(parameters).toBe(`import * as z from 'zod'

export const PageParamParamsSchema = z.int().optional()

export const LimitParamParamsSchema = z.int().optional()
`)

        // responses.ts should import from schemas
        const responses = await fsp.readFile(path.join(d, 'responses.ts'), 'utf-8')
        expect(responses).toBe(`import { resolver } from 'hono-openapi'
import * as z from 'zod'
import { ErrorSchema, UserSchema } from './schemas'

export const UserListResponseResponse = {
  description: 'A list of users',
  content: { 'application/json': { schema: resolver(z.array(UserSchema)) } },
  headers: {
    'X-Total-Count': { description: 'Total number of users', schema: { type: 'integer' } as const },
  },
}

export const UnauthorizedResponseResponse = {
  description: 'Authentication required',
  content: { 'application/json': { schema: resolver(ErrorSchema) } },
}
`)

        // headers.ts
        const headers = await fsp.readFile(path.join(d, 'headers.ts'), 'utf-8')
        expect(headers).toBe(`import * as z from 'zod'

export const XRequestIdHeaderSchema = z.string()

export const XRateLimitHeaderSchema = z.int().optional()
`)

        // handler should import from all components
        const users = await fsp.readFile(path.join(d, 'handlers/users.ts'), 'utf-8')
        expect(users).toBe(`import { Hono } from 'hono'
import { describeRoute, resolver, validator } from 'hono-openapi'
import * as z from 'zod'
import { UserSchema } from '../schemas'
import { UnauthorizedResponseResponse, UserListResponseResponse } from '../responses'
import { XRateLimitHeaderSchema, XRequestIdHeaderSchema } from '../headers'

export const usersHandler = new Hono()
  .get(
    '/users',
    describeRoute({
      summary: 'List users',
      tags: ['users'],
      operationId: 'listUsers',
      responses: { 200: UserListResponseResponse, 401: UnauthorizedResponseResponse },
    }),
    (c) => {},
  )
  .post(
    '/users',
    describeRoute({
      summary: 'Create user',
      tags: ['users'],
      operationId: 'createUser',
      responses: {
        201: {
          description: 'Created',
          content: { 'application/json': { schema: resolver(UserSchema) } },
          headers: { 'X-Request-Id': XRequestIdHeaderSchema },
        },
      },
    }),
    (c) => {},
  )
  .get(
    '/users/:userId',
    describeRoute({
      summary: 'Get user by ID',
      tags: ['users'],
      operationId: 'getUserById',
      deprecated: true,
      security: [{ bearerAuth: [] }],
      externalDocs: { url: 'https://example.com/docs/users', description: 'User documentation' },
      responses: {
        200: {
          description: 'User found',
          content: { 'application/json': { schema: resolver(UserSchema) } },
          headers: { 'X-Rate-Limit': XRateLimitHeaderSchema },
        },
        404: { description: 'Not found' },
      },
    }),
    validator('param', z.object({ userId: z.string() })),
    (c) => {},
  )
`)
      },
    )
  })

  describe('webhooks generation', () => {
    it.concurrent(
      'generates webhooks handler file from spec with webhooks',
      { timeout: 30000 },
      async () => {
        const d = tmpDir('webhooks_gen')
        // Create a minimal spec with webhooks
        const webhookSpec = path.join(d, 'openapi.yaml')
        await fsp.mkdir(d, { recursive: true })
        await fsp.writeFile(
          webhookSpec,
          `openapi: '3.1.0'
info:
  title: Webhook API
  version: '1.0.0'
paths:
  /ping:
    get:
      summary: Ping
      responses:
        '200':
          description: OK
webhooks:
  newOrder:
    post:
      operationId: onNewOrder
      summary: New order webhook
      tags:
        - Webhooks
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - orderId
              properties:
                orderId:
                  type: string
      responses:
        '200':
          description: Acknowledged
          content:
            application/json:
              schema:
                type: object
                properties:
                  received:
                    type: boolean
components:
  schemas:
    Order:
      type: object
      required:
        - id
      properties:
        id:
          type: string
        total:
          type: number
`,
        )

        const result = await hono({
          input: webhookSpec,
          schema: 'zod',
          openapi: true,
          'takibi-hono': {
            handlers: { output: path.join(d, 'handlers') },
            components: {
              schemas: { output: path.join(d, 'schemas.ts'), exportTypes: true },
            },
          },
        })
        expect(result).toStrictEqual({ ok: true, value: undefined })

        const webhooksFile = await fsp.readFile(path.join(d, 'handlers/webhooks.ts'), 'utf-8')
        expect(webhooksFile).toBe(`import { Hono } from 'hono'
import { describeRoute, resolver, validator } from 'hono-openapi'
import * as z from 'zod'

export const webhooksHandler = new Hono().post(
  '/newOrder',
  describeRoute({
    summary: 'New order webhook',
    tags: ['Webhooks'],
    operationId: 'onNewOrder',
    responses: {
      200: {
        description: 'Acknowledged',
        content: {
          'application/json': { schema: resolver(z.object({ received: z.boolean().optional() })) },
        },
      },
    },
  }),
  validator('json', z.object({ orderId: z.string() })),
  (c) => {},
)
`)
      },
    )
  })

  describe('stale handler cleanup', () => {
    it.concurrent(
      'deletes handler files removed from OpenAPI spec',
      { timeout: 30000 },
      async () => {
        const d = tmpDir('stale_handler_cleanup')

        // First generation: petstore has /pets and / (root)
        const result1 = await hono({
          input: petstoreYaml,
          schema: 'zod',
          'takibi-hono': {
            handlers: { output: path.join(d, 'handlers') },
            components: {
              schemas: { output: path.join(d, 'schemas.ts') },
            },
          },
        })
        expect(result1).toStrictEqual({ ok: true, value: undefined })

        // Verify handler files exist
        const handlersDir = path.join(d, 'handlers')
        const filesBefore = await fsp.readdir(handlersDir)
        expect(filesBefore.filter((f) => f.endsWith('.ts')).sort()).toStrictEqual([
          '__root.ts',
          'index.ts',
          'pets.ts',
        ])

        // Create a fake stale handler file (simulates a path removed from spec)
        const staleFile = path.join(handlersDir, 'orders.ts')
        await fsp.writeFile(staleFile, 'export const ordersHandler = "stale"')

        // Verify stale file exists
        const filesWithStale = await fsp.readdir(handlersDir)
        expect(filesWithStale).toContain('orders.ts')

        // Second generation: same spec, stale file should be deleted
        const result2 = await hono({
          input: petstoreYaml,
          schema: 'zod',
          'takibi-hono': {
            handlers: { output: path.join(d, 'handlers') },
            components: {
              schemas: { output: path.join(d, 'schemas.ts') },
            },
          },
        })
        expect(result2).toStrictEqual({ ok: true, value: undefined })

        // Stale file should be gone
        const filesAfter = await fsp.readdir(handlersDir)
        expect(filesAfter.filter((f) => f.endsWith('.ts')).sort()).toStrictEqual([
          '__root.ts',
          'index.ts',
          'pets.ts',
        ])
        expect(filesAfter).not.toContain('orders.ts')
      },
    )
  })

  describe('exportSchemasTypes: top-level flag', () => {
    it.concurrent(
      'should export types when exportSchemasTypes is true (without components.schemas.exportTypes)',
      { timeout: 30000 },
      async () => {
        const d = tmpDir('export_schemas_types_toplevel')
        const result = await hono({
          input: petstoreYaml,
          schema: 'zod',
          'takibi-hono': {
            exportSchemasTypes: true,
            handlers: { output: path.join(d, 'handlers') },
            components: { schemas: { output: path.join(d, 'schemas.ts') } },
          },
        })
        expect(result).toStrictEqual({ ok: true, value: undefined })

        const schemas = await fsp.readFile(path.join(d, 'schemas.ts'), 'utf-8')
        expect(schemas).toBe(`import * as z from 'zod'

export const PetSchema = z
  .object({ id: z.int(), name: z.string(), tag: z.string().optional() })
  .meta({ description: 'A pet in the store', examples: [{ id: 1, name: 'Buddy', tag: 'dog' }] })

export type Pet = z.infer<typeof PetSchema>

export const CreatePetSchema = z
  .object({ name: z.string(), tag: z.string().optional() })
  .meta({ description: 'Data for creating a new pet' })

export type CreatePet = z.infer<typeof CreatePetSchema>
`)
      },
    )

    it.concurrent(
      'should not export types by default (no exportSchemasTypes, no components.schemas.exportTypes)',
      { timeout: 30000 },
      async () => {
        const d = tmpDir('no_export_types_default')
        const result = await hono({
          input: petstoreYaml,
          schema: 'zod',
          'takibi-hono': {
            handlers: { output: path.join(d, 'handlers') },
            components: { schemas: { output: path.join(d, 'schemas.ts') } },
          },
        })
        expect(result).toStrictEqual({ ok: true, value: undefined })

        const schemas = await fsp.readFile(path.join(d, 'schemas.ts'), 'utf-8')
        expect(schemas).toBe(`import * as z from 'zod'

export const PetSchema = z
  .object({ id: z.int(), name: z.string(), tag: z.string().optional() })
  .meta({ description: 'A pet in the store', examples: [{ id: 1, name: 'Buddy', tag: 'dog' }] })

export const CreatePetSchema = z
  .object({ name: z.string(), tag: z.string().optional() })
  .meta({ description: 'Data for creating a new pet' })
`)
      },
    )

    it.concurrent(
      'components.schemas.exportTypes takes priority over exportSchemasTypes',
      { timeout: 30000 },
      async () => {
        const d = tmpDir('export_types_priority')
        const result = await hono({
          input: petstoreYaml,
          schema: 'zod',
          'takibi-hono': {
            exportSchemasTypes: true,
            handlers: { output: path.join(d, 'handlers') },
            components: { schemas: { output: path.join(d, 'schemas.ts'), exportTypes: false } },
          },
        })
        expect(result).toStrictEqual({ ok: true, value: undefined })

        const schemas = await fsp.readFile(path.join(d, 'schemas.ts'), 'utf-8')
        expect(schemas).toBe(`import * as z from 'zod'

export const PetSchema = z
  .object({ id: z.int(), name: z.string(), tag: z.string().optional() })
  .meta({ description: 'A pet in the store', examples: [{ id: 1, name: 'Buddy', tag: 'dog' }] })

export const CreatePetSchema = z
  .object({ name: z.string(), tag: z.string().optional() })
  .meta({ description: 'Data for creating a new pet' })
`)
      },
    )

    it.concurrent(
      'should export Encoded type only for effect with exportSchemasTypes',
      { timeout: 30000 },
      async () => {
        const d = tmpDir('export_schemas_types_effect')
        const result = await hono({
          input: petstoreYaml,
          schema: 'effect',
          'takibi-hono': {
            exportSchemasTypes: true,
            handlers: { output: path.join(d, 'handlers') },
            components: { schemas: { output: path.join(d, 'schemas.ts') } },
          },
        })
        expect(result).toStrictEqual({ ok: true, value: undefined })

        const schemas = await fsp.readFile(path.join(d, 'schemas.ts'), 'utf-8')
        expect(schemas).toBe(`import { Schema } from 'effect'

export const PetSchema = Schema.Struct({
  id: Schema.Number.pipe(Schema.int()),
  name: Schema.String,
  tag: Schema.optional(Schema.String),
}).annotations({
  description: 'A pet in the store',
  examples: [{ id: 1, name: 'Buddy', tag: 'dog' }],
})

export type Pet = typeof PetSchema.Encoded

export const CreatePetSchema = Schema.Struct({
  name: Schema.String,
  tag: Schema.optional(Schema.String),
}).annotations({ description: 'Data for creating a new pet' })

export type CreatePet = typeof CreatePetSchema.Encoded
`)
      },
    )
  })

  describe('components.output base directory', () => {
    it.concurrent(
      'generates schemas to components.output/index.ts when no schemas config',
      { timeout: 30000 },
      async () => {
        const d = tmpDir('components_output_schemas')
        const result = await hono({
          input: petstoreYaml,
          schema: 'zod',
          'takibi-hono': {
            handlers: { output: path.join(d, 'src/handlers') },
            components: {
              output: path.join(d, 'src/openapi'),
            },
          },
        })
        expect(result).toStrictEqual({ ok: true, value: undefined })

        const schemas = await fsp.readFile(path.join(d, 'src/openapi/index.ts'), 'utf-8')
        expect(schemas).toBe(`import * as z from 'zod'

export const PetSchema = z
  .object({ id: z.int(), name: z.string(), tag: z.string().optional() })
  .meta({ description: 'A pet in the store', examples: [{ id: 1, name: 'Buddy', tag: 'dog' }] })

export const CreatePetSchema = z
  .object({ name: z.string(), tag: z.string().optional() })
  .meta({ description: 'Data for creating a new pet' })
`)
      },
    )

    it.concurrent(
      'individual schemas config overrides components.output for schemas',
      { timeout: 30000 },
      async () => {
        const d = tmpDir('components_output_override')
        const result = await hono({
          input: petstoreYaml,
          schema: 'zod',
          'takibi-hono': {
            handlers: { output: path.join(d, 'src/handlers') },
            components: {
              output: path.join(d, 'src/openapi'),
              schemas: { output: path.join(d, 'src/custom/schemas.ts') },
            },
          },
        })
        expect(result).toStrictEqual({ ok: true, value: undefined })

        const schemas = await fsp.readFile(path.join(d, 'src/custom/schemas.ts'), 'utf-8')
        expect(schemas).toBe(`import * as z from 'zod'

export const PetSchema = z
  .object({ id: z.int(), name: z.string(), tag: z.string().optional() })
  .meta({ description: 'A pet in the store', examples: [{ id: 1, name: 'Buddy', tag: 'dog' }] })

export const CreatePetSchema = z
  .object({ name: z.string(), tag: z.string().optional() })
  .meta({ description: 'Data for creating a new pet' })
`)
      },
    )

    it.concurrent(
      'generates component files to base directory subdirectories',
      { timeout: 30000 },
      async () => {
        const d = tmpDir('components_output_all')
        const result = await hono({
          input: componentsYaml,
          schema: 'zod',
          openapi: true,
          'takibi-hono': {
            handlers: { output: path.join(d, 'src/handlers') },
            components: {
              output: path.join(d, 'src/openapi'),
            },
          },
        })
        expect(result).toStrictEqual({ ok: true, value: undefined })

        const schemas = await fsp.readFile(path.join(d, 'src/openapi/index.ts'), 'utf-8')
        expect(schemas).toBe(`import * as z from 'zod'

export const UserSchema = z
  .object({
    id: z.int(),
    name: z.string(),
    email: z.string(),
    role: z.enum(['admin', 'user', 'guest']).optional(),
    tags: z.array(z.string()).optional(),
    address: z.object({ city: z.string(), country: z.string() }).partial().optional(),
  })
  .meta({ ref: 'User' })

export const CreateUserSchema = z
  .object({
    name: z.string(),
    email: z.string(),
    role: z.enum(['admin', 'user', 'guest']).optional(),
  })
  .meta({ ref: 'CreateUser' })

export const ErrorSchema = z.object({ code: z.int(), message: z.string() }).meta({ ref: 'Error' })
`)

        const responses = await fsp.readFile(
          path.join(d, 'src/openapi/responses/index.ts'),
          'utf-8',
        )
        expect(responses).toBe(`import { resolver } from 'hono-openapi'
import * as z from 'zod'
import { ErrorSchema, UserSchema } from '..'

export const UserListResponseResponse = {
  description: 'A list of users',
  content: { 'application/json': { schema: resolver(z.array(UserSchema)) } },
  headers: {
    'X-Total-Count': { description: 'Total number of users', schema: { type: 'integer' } as const },
  },
}

export const UnauthorizedResponseResponse = {
  description: 'Authentication required',
  content: { 'application/json': { schema: resolver(ErrorSchema) } },
}
`)

        const parameters = await fsp.readFile(
          path.join(d, 'src/openapi/parameters/index.ts'),
          'utf-8',
        )
        expect(parameters).toBe(`import * as z from 'zod'

export const PageParamParamsSchema = z.int().optional()

export const LimitParamParamsSchema = z.int().optional()
`)

        const headers = await fsp.readFile(path.join(d, 'src/openapi/headers/index.ts'), 'utf-8')
        expect(headers).toBe(`import * as z from 'zod'

export const XRequestIdHeaderSchema = z.string()

export const XRateLimitHeaderSchema = z.int().optional()
`)

        const examples = await fsp.readFile(path.join(d, 'src/openapi/examples/index.ts'), 'utf-8')
        expect(examples).toBe(`export const UserExampleExample = {
  summary: 'A sample user',
  value: { id: 1, name: 'John Doe', email: 'john@example.com', role: 'admin' },
}

export const ErrorExampleExample = {
  summary: 'A sample error',
  value: { code: 404, message: 'Not found' },
}
`)

        const securitySchemes = await fsp.readFile(
          path.join(d, 'src/openapi/securitySchemes/index.ts'),
          'utf-8',
        )
        expect(securitySchemes).toBe(`export const BearerAuthSecurityScheme = {
  type: 'http',
  description: 'JWT Bearer token',
  scheme: 'bearer',
  bearerFormat: 'JWT',
}

export const ApiKeySecurityScheme = {
  type: 'apiKey',
  description: 'API key authentication',
  name: 'X-API-Key',
  in: 'header',
}
`)

        const requestBodies = await fsp.readFile(
          path.join(d, 'src/openapi/requestBodies/index.ts'),
          'utf-8',
        )
        expect(requestBodies).toBe(`import { CreateUserSchema } from '..'

export const CreateUserBodyRequestBody = {
  description: 'User to create',
  required: true,
  content: { 'application/json': { schema: CreateUserSchema } },
}
`)

        const links = await fsp.readFile(path.join(d, 'src/openapi/links/index.ts'), 'utf-8')
        expect(links).toBe(`export const GetUserByIdLink = {
  operationId: 'getUserById',
  parameters: { userId: '$response.body#/id' },
  description: 'Get user by the ID returned in the response',
}
`)
      },
    )

    it.concurrent('components.output with exportSchemasTypes', { timeout: 30000 }, async () => {
      const d = tmpDir('components_output_export_types')
      const result = await hono({
        input: petstoreYaml,
        schema: 'zod',
        'takibi-hono': {
          handlers: { output: path.join(d, 'src/handlers') },
          components: {
            output: path.join(d, 'src/openapi'),
          },
          exportSchemasTypes: true,
        },
      })
      expect(result).toStrictEqual({ ok: true, value: undefined })

      const schemas = await fsp.readFile(path.join(d, 'src/openapi/index.ts'), 'utf-8')
      expect(schemas).toBe(`import * as z from 'zod'

export const PetSchema = z
  .object({ id: z.int(), name: z.string(), tag: z.string().optional() })
  .meta({ description: 'A pet in the store', examples: [{ id: 1, name: 'Buddy', tag: 'dog' }] })

export type Pet = z.infer<typeof PetSchema>

export const CreatePetSchema = z
  .object({ name: z.string(), tag: z.string().optional() })
  .meta({ description: 'Data for creating a new pet' })

export type CreatePet = z.infer<typeof CreatePetSchema>
`)
    })

    it.concurrent(
      'handler imports schemas from components.output base path',
      { timeout: 30000 },
      async () => {
        const d = tmpDir('components_output_handler_import')
        const result = await hono({
          input: petstoreYaml,
          schema: 'zod',
          'takibi-hono': {
            handlers: { output: path.join(d, 'src/handlers') },
            components: {
              output: path.join(d, 'src/openapi'),
            },
          },
        })
        expect(result).toStrictEqual({ ok: true, value: undefined })

        const handlers = await fsp.readFile(path.join(d, 'src/handlers/pets.ts'), 'utf-8')
        expect(handlers).toBe(`import { Hono } from 'hono'
import { sValidator } from '@hono/standard-validator'
import * as z from 'zod'
import { CreatePetSchema } from '../openapi'

export const petsHandler = new Hono()
  .get(
    '/pets',
    sValidator('query', z.object({ limit: z.coerce.number().pipe(z.int()).optional() })),
    (c) => {},
  )
  .post('/pets', sValidator('json', CreatePetSchema), (c) => {})
  .get('/pets/:petId', sValidator('param', z.object({ petId: z.string() })), (c) => {})
  .delete('/pets/:petId', sValidator('param', z.object({ petId: z.string() })), (c) => {})
`)
      },
    )

    it.concurrent(
      'components.output only generates components that exist in spec',
      { timeout: 30000 },
      async () => {
        const d = tmpDir('components_output_only_existing')
        const result = await hono({
          input: petstoreYaml,
          schema: 'zod',
          openapi: true,
          'takibi-hono': {
            handlers: { output: path.join(d, 'src/handlers') },
            components: {
              output: path.join(d, 'src/openapi'),
            },
          },
        })
        expect(result).toStrictEqual({ ok: true, value: undefined })

        expect(fs.existsSync(path.join(d, 'src/openapi/index.ts'))).toBe(true)
        expect(fs.existsSync(path.join(d, 'src/openapi/responses'))).toBe(false)
        expect(fs.existsSync(path.join(d, 'src/openapi/parameters'))).toBe(false)
        expect(fs.existsSync(path.join(d, 'src/openapi/headers'))).toBe(false)
        expect(fs.existsSync(path.join(d, 'src/openapi/examples'))).toBe(false)
        expect(fs.existsSync(path.join(d, 'src/openapi/securitySchemes'))).toBe(false)
        expect(fs.existsSync(path.join(d, 'src/openapi/requestBodies'))).toBe(false)
        expect(fs.existsSync(path.join(d, 'src/openapi/links'))).toBe(false)
      },
    )

    it.concurrent(
      'components.output with individual override uses override path',
      { timeout: 30000 },
      async () => {
        const d = tmpDir('components_output_partial_override')
        const result = await hono({
          input: componentsYaml,
          schema: 'zod',
          openapi: true,
          'takibi-hono': {
            handlers: { output: path.join(d, 'src/handlers') },
            components: {
              output: path.join(d, 'src/openapi'),
              responses: { output: path.join(d, 'src/custom/responses.ts') },
            },
          },
        })
        expect(result).toStrictEqual({ ok: true, value: undefined })

        expect(fs.existsSync(path.join(d, 'src/openapi/index.ts'))).toBe(true)
        expect(fs.existsSync(path.join(d, 'src/custom/responses.ts'))).toBe(true)
        expect(fs.existsSync(path.join(d, 'src/openapi/responses'))).toBe(false)
        expect(fs.existsSync(path.join(d, 'src/openapi/parameters/index.ts'))).toBe(true)
        expect(fs.existsSync(path.join(d, 'src/openapi/headers/index.ts'))).toBe(true)
      },
    )

    it.concurrent('components.output with schemas split: true', { timeout: 30000 }, async () => {
      const d = tmpDir('components_output_split')
      const result = await hono({
        input: petstoreYaml,
        schema: 'zod',
        'takibi-hono': {
          handlers: { output: path.join(d, 'src/handlers') },
          components: {
            output: path.join(d, 'src/openapi'),
            schemas: { output: path.join(d, 'src/openapi/schemas'), split: true },
          },
        },
      })
      expect(result).toStrictEqual({ ok: true, value: undefined })

      expect(fs.existsSync(path.join(d, 'src/openapi/schemas/pet.ts'))).toBe(true)
      expect(fs.existsSync(path.join(d, 'src/openapi/schemas/createPet.ts'))).toBe(true)
      expect(fs.existsSync(path.join(d, 'src/openapi/schemas/index.ts'))).toBe(true)

      const barrel = await fsp.readFile(path.join(d, 'src/openapi/schemas/index.ts'), 'utf-8')
      expect(barrel).toBe(`export * from './createPet'
export * from './pet'
`)
    })
  })

  describe('readonly flag', () => {
    it.concurrent(
      'readonly: true adds .readonly() to zod object schemas',
      { timeout: 30000 },
      async () => {
        const d = tmpDir('readonly_zod')
        const result = await hono({
          input: petstoreYaml,
          schema: 'zod',
          'takibi-hono': {
            readonly: true,
            handlers: { output: path.join(d, 'handlers') },
            components: { schemas: { output: path.join(d, 'schemas.ts') } },
          },
        })
        expect(result).toStrictEqual({ ok: true, value: undefined })

        const schemas = await fsp.readFile(path.join(d, 'schemas.ts'), 'utf-8')
        expect(schemas).toBe(`import * as z from 'zod'

export const PetSchema = z
  .object({ id: z.int(), name: z.string(), tag: z.string().optional() })
  .meta({ description: 'A pet in the store', examples: [{ id: 1, name: 'Buddy', tag: 'dog' }] })
  .readonly()

export const CreatePetSchema = z
  .object({ name: z.string(), tag: z.string().optional() })
  .meta({ description: 'Data for creating a new pet' })
  .readonly()
`)
      },
    )

    it.concurrent(
      'readonly: false does not add .readonly() to schemas',
      { timeout: 30000 },
      async () => {
        const d = tmpDir('readonly_false_zod')
        const result = await hono({
          input: petstoreYaml,
          schema: 'zod',
          'takibi-hono': {
            readonly: false,
            handlers: { output: path.join(d, 'handlers') },
            components: { schemas: { output: path.join(d, 'schemas.ts') } },
          },
        })
        expect(result).toStrictEqual({ ok: true, value: undefined })

        const schemas = await fsp.readFile(path.join(d, 'schemas.ts'), 'utf-8')
        expect(schemas).toBe(`import * as z from 'zod'

export const PetSchema = z
  .object({ id: z.int(), name: z.string(), tag: z.string().optional() })
  .meta({ description: 'A pet in the store', examples: [{ id: 1, name: 'Buddy', tag: 'dog' }] })

export const CreatePetSchema = z
  .object({ name: z.string(), tag: z.string().optional() })
  .meta({ description: 'Data for creating a new pet' })
`)
      },
    )

    it.concurrent('readonly with components.output', { timeout: 30000 }, async () => {
      const d = tmpDir('readonly_components_output')
      const result = await hono({
        input: petstoreYaml,
        schema: 'zod',
        'takibi-hono': {
          readonly: true,
          handlers: { output: path.join(d, 'src/handlers') },
          components: {
            output: path.join(d, 'src/openapi'),
          },
        },
      })
      expect(result).toStrictEqual({ ok: true, value: undefined })

      const schemas = await fsp.readFile(path.join(d, 'src/openapi/index.ts'), 'utf-8')
      expect(schemas).toBe(`import * as z from 'zod'

export const PetSchema = z
  .object({ id: z.int(), name: z.string(), tag: z.string().optional() })
  .meta({ description: 'A pet in the store', examples: [{ id: 1, name: 'Buddy', tag: 'dog' }] })
  .readonly()

export const CreatePetSchema = z
  .object({ name: z.string(), tag: z.string().optional() })
  .meta({ description: 'Data for creating a new pet' })
  .readonly()
`)
    })

    it.concurrent(
      'readonly with exportTypes generates readonly type',
      { timeout: 30000 },
      async () => {
        const d = tmpDir('readonly_export_types')
        const result = await hono({
          input: petstoreYaml,
          schema: 'zod',
          'takibi-hono': {
            readonly: true,
            handlers: { output: path.join(d, 'handlers') },
            components: { schemas: { output: path.join(d, 'schemas.ts'), exportTypes: true } },
          },
        })
        expect(result).toStrictEqual({ ok: true, value: undefined })

        const schemas = await fsp.readFile(path.join(d, 'schemas.ts'), 'utf-8')
        expect(schemas).toBe(`import * as z from 'zod'

export const PetSchema = z
  .object({ id: z.int(), name: z.string(), tag: z.string().optional() })
  .meta({ description: 'A pet in the store', examples: [{ id: 1, name: 'Buddy', tag: 'dog' }] })
  .readonly()

export type Pet = z.infer<typeof PetSchema>

export const CreatePetSchema = z
  .object({ name: z.string(), tag: z.string().optional() })
  .meta({ description: 'Data for creating a new pet' })
  .readonly()

export type CreatePet = z.infer<typeof CreatePetSchema>
`)
      },
    )

    it.concurrent(
      'readonly: undefined (default) does not add .readonly()',
      { timeout: 30000 },
      async () => {
        const d = tmpDir('readonly_undefined')
        const result = await hono({
          input: petstoreYaml,
          schema: 'zod',
          'takibi-hono': {
            handlers: { output: path.join(d, 'handlers') },
            components: { schemas: { output: path.join(d, 'schemas.ts') } },
          },
        })
        expect(result).toStrictEqual({ ok: true, value: undefined })

        const schemas = await fsp.readFile(path.join(d, 'schemas.ts'), 'utf-8')
        expect(schemas).toBe(`import * as z from 'zod'

export const PetSchema = z
  .object({ id: z.int(), name: z.string(), tag: z.string().optional() })
  .meta({ description: 'A pet in the store', examples: [{ id: 1, name: 'Buddy', tag: 'dog' }] })

export const CreatePetSchema = z
  .object({ name: z.string(), tag: z.string().optional() })
  .meta({ description: 'Data for creating a new pet' })
`)
      },
    )

    it.concurrent('readonly with effect schema library', { timeout: 30000 }, async () => {
      const d = tmpDir('readonly_effect')
      const result = await hono({
        input: petstoreYaml,
        schema: 'effect',
        'takibi-hono': {
          readonly: true,
          handlers: { output: path.join(d, 'handlers') },
          components: { schemas: { output: path.join(d, 'schemas.ts') } },
        },
      })
      expect(result).toStrictEqual({ ok: true, value: undefined })

      const schemas = await fsp.readFile(path.join(d, 'schemas.ts'), 'utf-8')
      expect(schemas).toBe(`import { Schema } from 'effect'

export const PetSchema = Schema.Struct({
  id: Schema.Number.pipe(Schema.int()),
  name: Schema.String,
  tag: Schema.optional(Schema.String),
}).annotations({
  description: 'A pet in the store',
  examples: [{ id: 1, name: 'Buddy', tag: 'dog' }],
})

export const CreatePetSchema = Schema.Struct({
  name: Schema.String,
  tag: Schema.optional(Schema.String),
}).annotations({ description: 'Data for creating a new pet' })
`)
    })
  })

  describe('uncovered branches', () => {
    it.concurrent(
      'generates components/pathItems/index.ts when pathItems component is present',
      { timeout: 30000 },
      async () => {
        const d = tmpDir('path_items_branch')
        const yamlPath = path.join(d, 'spec.yaml')
        await fsp.mkdir(d, { recursive: true })
        await fsp.writeFile(
          yamlPath,
          `openapi: 3.1.0
info:
  title: PathItems
  version: 1.0.0
paths:
  /pets:
    get:
      summary: list
      responses:
        '200':
          description: OK
components:
  pathItems:
    PingPath:
      get:
        summary: ping
        responses:
          '200':
            description: OK
`,
        )
        const result = await hono({
          input: yamlPath,
          schema: 'zod',
          openapi: true,
          'takibi-hono': {
            handlers: { output: path.join(d, 'handlers') },
            components: { output: path.join(d, 'openapi') },
          },
        })
        expect(result).toStrictEqual({ ok: true, value: undefined })
        const pathItems = await fsp.readFile(path.join(d, 'openapi/pathItems/index.ts'), 'utf-8')
        expect(pathItems).toBe(`export const PingPathPathItem = {
  get: { summary: 'ping', responses: { '200': { description: 'OK' } } },
}
`)
      },
    )

    it.concurrent(
      'tolerates a missing handlers directory (empty paths spec)',
      { timeout: 30000 },
      async () => {
        const d = tmpDir('handlers_empty')
        const yamlPath = path.join(d, 'spec.yaml')
        await fsp.mkdir(d, { recursive: true })
        await fsp.writeFile(
          yamlPath,
          `openapi: 3.0.3
info:
  title: Empty
  version: 1.0.0
paths: {}
`,
        )
        const result = await hono({
          input: yamlPath,
          schema: 'zod',
          'takibi-hono': {
            handlers: { output: path.join(d, 'handlers') },
            components: { schemas: { output: path.join(d, 'schemas.ts') } },
          },
        })
        expect(result).toStrictEqual({ ok: true, value: undefined })
        expect(fs.existsSync(path.join(d, 'handlers'))).toBe(false)
      },
    )

    it.concurrent(
      'uses componentConfig.import override for handler import path',
      { timeout: 30000 },
      async () => {
        const d = tmpDir('component_import_override')
        const yamlPath = path.join(d, 'spec.yaml')
        await fsp.mkdir(d, { recursive: true })
        await fsp.writeFile(
          yamlPath,
          `openapi: 3.0.3
info:
  title: Override
  version: 1.0.0
paths:
  /users:
    get:
      summary: List users
      tags: [users]
      operationId: listUsers
      responses:
        '200':
          $ref: '#/components/responses/UserList'
components:
  schemas:
    User:
      type: object
      required: [id]
      properties:
        id: { type: integer }
  responses:
    UserList:
      description: list
      content:
        application/json:
          schema:
            type: array
            items:
              $ref: '#/components/schemas/User'
`,
        )
        const result = await hono({
          input: yamlPath,
          schema: 'zod',
          openapi: true,
          'takibi-hono': {
            handlers: { output: path.join(d, 'handlers') },
            components: {
              schemas: { output: path.join(d, 'schemas.ts'), import: '@app/schemas' },
              responses: {
                output: path.join(d, 'responses.ts'),
                import: '@app/responses',
              },
            },
          },
        })
        expect(result).toStrictEqual({ ok: true, value: undefined })
        const handler = await fsp.readFile(path.join(d, 'handlers/users.ts'), 'utf-8')
        expect(handler).toBe(`import { Hono } from 'hono'
import { describeRoute } from 'hono-openapi'
import { UserListResponse } from '@app/responses'

export const usersHandler = new Hono().get(
  '/users',
  describeRoute({
    summary: 'List users',
    tags: ['users'],
    operationId: 'listUsers',
    responses: { 200: UserListResponse },
  }),
  (c) => {},
)
`)
      },
    )
  })
})
