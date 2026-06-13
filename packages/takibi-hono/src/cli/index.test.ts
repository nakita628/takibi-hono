import fs from 'node:fs'
import fsp from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import { afterAll, beforeAll, describe, expect, it } from 'vite-plus/test'

import { readConfig } from '../config/index.js'
import { hono } from '../core/hono.js'

async function runCli(dir: string) {
  const originalCwd = process.cwd()
  process.chdir(dir)
  try {
    const configResult = await readConfig()
    if (!configResult.ok) return configResult
    const config = configResult.value
    const honoResult = await hono(config)
    if (!honoResult.ok) return honoResult
    return {
      ok: true as const,
      value: `🔥 takibi-hono: ${config.input} (${config.schema}) ✅`,
    }
  } finally {
    process.chdir(originalCwd)
  }
}

const PETSTORE_YAML = `openapi: 3.0.3
info:
  title: Petstore
  version: 1.0.0
paths:
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
components:
  schemas:
    Pet:
      type: object
      required:
        - id
        - name
      description: A pet in the store
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
  examples:
    UserExample:
      summary: A sample user
      value:
        id: 1
        name: John Doe
        email: john@example.com
        role: admin
  securitySchemes:
    BearerAuth:
      type: http
      description: JWT Bearer token
      scheme: bearer
      bearerFormat: JWT
  requestBodies:
    CreateUserBody:
      description: User to create
      required: true
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/User'
  links:
    GetUserById:
      operationId: getUserById
      parameters:
        userId: '$response.body#/id'
      description: Get user by the ID returned in the response
`

let tempBase: string

beforeAll(async () => {
  tempBase = fs.mkdtempSync(path.join(os.tmpdir(), 'takibi-hono-cli-test-'))
})

const tmpDirs: string[] = []
afterAll(async () => {
  for (const d of tmpDirs) await fsp.rm(d, { recursive: true, force: true }).catch(() => {})
  if (tempBase) await fsp.rm(tempBase, { recursive: true, force: true }).catch(() => {})
})

function tmpDir(label: string): string {
  const d = path.join(os.tmpdir(), `takibi-hono-cli-__test_${label}_${Date.now()}`)
  tmpDirs.push(d)
  return d
}

async function setupProject(
  dir: string,
  config: Record<string, unknown>,
  specFileName: string,
  specContent: string,
): Promise<void> {
  await fsp.mkdir(dir, { recursive: true })
  await fsp.writeFile(path.join(dir, specFileName), specContent)
  const configContent = `export default ${JSON.stringify(config, null, 2)}\n`
  await fsp.writeFile(path.join(dir, 'takibi-hono.config.ts'), configContent)
}

describe('takibiHono CLI integration', () => {
  describe('basic generation with config file', () => {
    it(
      'zod: generates schemas, handlers, barrel, and app from config file',
      { timeout: 30000 },
      async () => {
        const d = tmpDir('cli_zod_full')
        await setupProject(
          d,
          {
            input: 'petstore.yaml',
            schema: 'zod',

            output: 'src/handlers',
            components: { schemas: { output: 'src/schemas.ts' } },
          },
          'petstore.yaml',
          PETSTORE_YAML,
        )

        const result = await runCli(d)
        expect(result).toStrictEqual({
          ok: true,
          value: '🔥 takibi-hono: petstore.yaml (zod) ✅',
        })

        const schemas = await fsp.readFile(path.join(d, 'src/schemas.ts'), 'utf-8')
        expect(schemas).toBe(`import * as z from 'zod'

export const PetSchema = z
  .object({ id: z.int(), name: z.string(), tag: z.string().exactOptional() })
  .meta({ description: 'A pet in the store' })

export const CreatePetSchema = z
  .object({ name: z.string(), tag: z.string().exactOptional() })
  .meta({ description: 'Data for creating a new pet' })
`)

        const handlers = await fsp.readFile(path.join(d, 'src/handlers/pets.ts'), 'utf-8')
        expect(handlers).toBe(`import { Hono } from 'hono'
import { sValidator } from '@hono/standard-validator'
import * as z from 'zod'
import { CreatePetSchema } from '../schemas'

export const petsHandler = new Hono()
  .get(
    '/pets',
    sValidator('query', z.object({ limit: z.coerce.number().int().exactOptional() })),
    (c) => {},
  )
  .post('/pets', sValidator('json', CreatePetSchema), (c) => {})
`)

        const barrel = await fsp.readFile(path.join(d, 'src/handlers/index.ts'), 'utf-8')
        expect(barrel).toBe(`export * from './pets'
`)

        const app = await fsp.readFile(path.join(d, 'src/index.ts'), 'utf-8')
        expect(app).toBe(`import { Hono } from 'hono'
import { petsHandler } from './handlers'

const app = new Hono()

export const api = app.route('/', petsHandler)

export default app
`)
      },
    )

    it('effect: generates schemas and handlers from config file', { timeout: 30000 }, async () => {
      const d = tmpDir('cli_effect_full')
      await setupProject(
        d,
        {
          input: 'petstore.yaml',
          schema: 'effect',

          output: 'src/handlers',
          components: { schemas: { output: 'src/schemas.ts', exportTypes: true } },
        },
        'petstore.yaml',
        PETSTORE_YAML,
      )

      const result = await runCli(d)
      expect(result).toStrictEqual({
        ok: true,
        value: '🔥 takibi-hono: petstore.yaml (effect) ✅',
      })

      const schemas = await fsp.readFile(path.join(d, 'src/schemas.ts'), 'utf-8')
      expect(schemas).toBe(`import { Schema } from 'effect'

export const PetSchema = Schema.Struct({
  id: Schema.Number.pipe(Schema.int()),
  name: Schema.String,
  tag: Schema.optional(Schema.String),
}).annotations({ description: 'A pet in the store' })

export type PetSchema = typeof PetSchema.Type

export const CreatePetSchema = Schema.Struct({
  name: Schema.String,
  tag: Schema.optional(Schema.String),
}).annotations({ description: 'Data for creating a new pet' })

export type CreatePetSchema = typeof CreatePetSchema.Type
`)
    })

    it('valibot: generates schemas from config file', { timeout: 30000 }, async () => {
      const d = tmpDir('cli_valibot_full')
      await setupProject(
        d,
        {
          input: 'petstore.yaml',
          schema: 'valibot',

          output: 'src/handlers',
          components: { schemas: { output: 'src/schemas.ts' } },
        },
        'petstore.yaml',
        PETSTORE_YAML,
      )

      const result = await runCli(d)
      expect(result).toStrictEqual({
        ok: true,
        value: '🔥 takibi-hono: petstore.yaml (valibot) ✅',
      })

      const schemas = await fsp.readFile(path.join(d, 'src/schemas.ts'), 'utf-8')
      expect(schemas).toBe(`import * as v from 'valibot'

export const PetSchema = v.pipe(
  v.object({ id: v.pipe(v.number(), v.integer()), name: v.string(), tag: v.optional(v.string()) }),
  v.description('A pet in the store'),
)

export const CreatePetSchema = v.pipe(
  v.object({ name: v.string(), tag: v.optional(v.string()) }),
  v.description('Data for creating a new pet'),
)
`)
    })

    it('typebox: generates schemas from config file', { timeout: 30000 }, async () => {
      const d = tmpDir('cli_typebox_full')
      await setupProject(
        d,
        {
          input: 'petstore.yaml',
          schema: 'typebox',

          output: 'src/handlers',
          components: { schemas: { output: 'src/schemas.ts' } },
        },
        'petstore.yaml',
        PETSTORE_YAML,
      )

      const result = await runCli(d)
      expect(result).toStrictEqual({
        ok: true,
        value: '🔥 takibi-hono: petstore.yaml (typebox) ✅',
      })

      const schemas = await fsp.readFile(path.join(d, 'src/schemas.ts'), 'utf-8')
      expect(schemas).toBe(`import Type from 'typebox'

export const PetSchema = Type.Object(
  { id: Type.Integer(), name: Type.String(), tag: Type.Optional(Type.String()) },
  { description: 'A pet in the store' },
)

export const CreatePetSchema = Type.Object(
  { name: Type.String(), tag: Type.Optional(Type.String()) },
  { description: 'Data for creating a new pet' },
)
`)
    })

    it('arktype: generates schemas from config file', { timeout: 30000 }, async () => {
      const d = tmpDir('cli_arktype_full')
      await setupProject(
        d,
        {
          input: 'petstore.yaml',
          schema: 'arktype',

          output: 'src/handlers',
          components: { schemas: { output: 'src/schemas.ts' } },
        },
        'petstore.yaml',
        PETSTORE_YAML,
      )

      const result = await runCli(d)
      expect(result).toStrictEqual({
        ok: true,
        value: '🔥 takibi-hono: petstore.yaml (arktype) ✅',
      })

      const schemas = await fsp.readFile(path.join(d, 'src/schemas.ts'), 'utf-8')
      expect(schemas).toBe(`import { type } from 'arktype'

export const PetSchema = type({ id: 'number.integer', name: 'string', 'tag?': 'string' }).describe(
  'A pet in the store',
)

export const CreatePetSchema = type({ name: 'string', 'tag?': 'string' }).describe(
  'Data for creating a new pet',
)
`)
    })
  })

  describe('components.output base directory via CLI', () => {
    it('generates schemas to components.output/index.ts', { timeout: 30000 }, async () => {
      const d = tmpDir('cli_co_schemas')
      await setupProject(
        d,
        {
          input: 'petstore.yaml',
          schema: 'zod',

          output: 'src/handlers',
          components: { output: 'src/openapi' },
        },
        'petstore.yaml',
        PETSTORE_YAML,
      )

      const result = await runCli(d)
      expect(result.ok).toBe(true)

      const schemas = await fsp.readFile(path.join(d, 'src/openapi/index.ts'), 'utf-8')
      expect(schemas).toBe(`import * as z from 'zod'

export const PetSchema = z
  .object({ id: z.int(), name: z.string(), tag: z.string().exactOptional() })
  .meta({ description: 'A pet in the store' })

export type Pet = z.infer<typeof PetSchema>

export const CreatePetSchema = z
  .object({ name: z.string(), tag: z.string().exactOptional() })
  .meta({ description: 'Data for creating a new pet' })

export type CreatePet = z.infer<typeof CreatePetSchema>
`)

      const handlersDir = await fsp.readdir(path.join(d, 'src/handlers'))
      expect(handlersDir.sort()).toStrictEqual(['index.ts', 'pets.ts'])

      const handlers = await fsp.readFile(path.join(d, 'src/handlers/pets.ts'), 'utf-8')
      expect(handlers).toBe(`import { Hono } from 'hono'
import { sValidator } from '@hono/standard-validator'
import * as z from 'zod'
import { CreatePetSchema } from '../openapi'

export const petsHandler = new Hono()
  .get(
    '/pets',
    sValidator('query', z.object({ limit: z.coerce.number().int().exactOptional() })),
    (c) => {},
  )
  .post('/pets', sValidator('json', CreatePetSchema), (c) => {})
`)
    })

    it(
      'generates all component subdirectories with openapi: true',
      { timeout: 30000 },
      async () => {
        const d = tmpDir('cli_co_openapi')
        await setupProject(
          d,
          {
            input: 'components.yaml',
            schema: 'zod',
            openapi: true,

            output: 'src/handlers',
            components: { output: 'src/openapi' },
          },
          'components.yaml',
          COMPONENTS_YAML,
        )

        const result = await runCli(d)
        expect(result.ok).toBe(true)

        const schemas = await fsp.readFile(path.join(d, 'src/openapi/index.ts'), 'utf-8')
        expect(schemas).toBe(`import * as z from 'zod'

export const UserSchema = z
  .object({
    id: z.int(),
    name: z.string(),
    email: z.string(),
    role: z.enum(['admin', 'user', 'guest']).exactOptional(),
    tags: z.array(z.string()).exactOptional(),
    address: z
      .object({ city: z.string().exactOptional(), country: z.string().exactOptional() })
      .exactOptional(),
  })
  .meta({ ref: 'User' })

export type User = z.infer<typeof UserSchema>

export const ErrorSchema = z.object({ code: z.int(), message: z.string() }).meta({ ref: 'Error' })

export type Error = z.infer<typeof ErrorSchema>
`)

        const responses = await fsp.readFile(
          path.join(d, 'src/openapi/responses/index.ts'),
          'utf-8',
        )
        expect(responses).toBe(`import { resolver } from 'hono-openapi'
import * as z from 'zod'
import { UserSchema } from '..'

export const UserListResponseResponse = {
  description: 'A list of users',
  content: { 'application/json': { schema: resolver(z.array(UserSchema)) } },
}
`)

        const parameters = await fsp.readFile(
          path.join(d, 'src/openapi/parameters/index.ts'),
          'utf-8',
        )
        expect(parameters).toBe(`import * as z from 'zod'

export const PageParamParamsSchema = z.int().exactOptional()

export const LimitParamParamsSchema = z.int().exactOptional()
`)

        const headers = await fsp.readFile(path.join(d, 'src/openapi/headers/index.ts'), 'utf-8')
        expect(headers)
          .toBe(`export const XRequestIdHeaderSchema = { required: true, schema: { type: 'string' } as const }
`)

        const examples = await fsp.readFile(path.join(d, 'src/openapi/examples/index.ts'), 'utf-8')
        expect(examples).toBe(`export const UserExampleExample = {
  summary: 'A sample user',
  value: { id: 1, name: 'John Doe', email: 'john@example.com', role: 'admin' },
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
`)

        const requestBodies = await fsp.readFile(
          path.join(d, 'src/openapi/requestBodies/index.ts'),
          'utf-8',
        )
        expect(requestBodies).toBe(`import { UserSchema } from '..'

export const CreateUserBodyRequestBody = {
  description: 'User to create',
  content: { 'application/json': { schema: UserSchema } },
  required: true,
}
`)

        const links = await fsp.readFile(path.join(d, 'src/openapi/links/index.ts'), 'utf-8')
        expect(links).toBe(`export const GetUserByIdLink = {
  operationId: 'getUserById',
  parameters: { userId: '$response.body#/id' },
  description: 'Get user by the ID returned in the response',
}
`)

        const handlers = await fsp.readFile(path.join(d, 'src/handlers/users.ts'), 'utf-8')
        expect(handlers).toBe(`import { Hono } from 'hono'
import { describeRoute, resolver } from 'hono-openapi'
import { UserSchema } from '../openapi'
import { UserListResponseResponse } from '../openapi/responses'

export const usersHandler = new Hono()
  .get(
    '/users',
    describeRoute({
      tags: ['users'],
      summary: 'List users',
      operationId: 'listUsers',
      responses: { 200: UserListResponseResponse },
    }),
    (c) => {},
  )
  .post(
    '/users',
    describeRoute({
      tags: ['users'],
      summary: 'Create user',
      operationId: 'createUser',
      responses: {
        201: {
          description: 'Created',
          content: { 'application/json': { schema: resolver(UserSchema) } },
        },
      },
    }),
    (c) => {},
  )
`)
      },
    )

    it('components.output emits the inferred schema types', { timeout: 30000 }, async () => {
      const d = tmpDir('cli_co_export_types')
      await setupProject(
        d,
        {
          input: 'petstore.yaml',
          schema: 'zod',

          output: 'src/handlers',
          components: { output: 'src/openapi' },
        },
        'petstore.yaml',
        PETSTORE_YAML,
      )

      const result = await runCli(d)
      expect(result.ok).toBe(true)

      const schemas = await fsp.readFile(path.join(d, 'src/openapi/index.ts'), 'utf-8')
      expect(schemas).toBe(`import * as z from 'zod'

export const PetSchema = z
  .object({ id: z.int(), name: z.string(), tag: z.string().exactOptional() })
  .meta({ description: 'A pet in the store' })

export type Pet = z.infer<typeof PetSchema>

export const CreatePetSchema = z
  .object({ name: z.string(), tag: z.string().exactOptional() })
  .meta({ description: 'Data for creating a new pet' })

export type CreatePet = z.infer<typeof CreatePetSchema>
`)
    })

    it(
      'components.output (.ts) aggregates schemas into a single file',
      { timeout: 30000 },
      async () => {
        const d = tmpDir('cli_co_single')
        await setupProject(
          d,
          {
            input: 'petstore.yaml',
            schema: 'zod',

            output: 'src/handlers',
            components: {
              output: 'src/openapi.ts',
            },
          },
          'petstore.yaml',
          PETSTORE_YAML,
        )

        const result = await runCli(d)
        expect(result.ok).toBe(true)

        const aggregated = await fsp.readFile(path.join(d, 'src/openapi.ts'), 'utf-8')
        expect(aggregated).toBe(`import * as z from 'zod'

export const PetSchema = z
  .object({ id: z.int(), name: z.string(), tag: z.string().exactOptional() })
  .meta({ description: 'A pet in the store' })

export type Pet = z.infer<typeof PetSchema>

export const CreatePetSchema = z
  .object({ name: z.string(), tag: z.string().exactOptional() })
  .meta({ description: 'Data for creating a new pet' })

export type CreatePet = z.infer<typeof CreatePetSchema>
`)

        expect(fs.existsSync(path.join(d, 'src/components/index.ts'))).toBe(false)
      },
    )
  })

  describe('readonly via CLI', () => {
    it('readonly: true adds .readonly() to zod schemas', { timeout: 30000 }, async () => {
      const d = tmpDir('cli_ro_true')
      await setupProject(
        d,
        {
          input: 'petstore.yaml',
          schema: 'zod',

          readonly: true,
          output: 'src/handlers',
          components: { schemas: { output: 'src/schemas.ts' } },
        },
        'petstore.yaml',
        PETSTORE_YAML,
      )

      const result = await runCli(d)
      expect(result.ok).toBe(true)

      const schemas = await fsp.readFile(path.join(d, 'src/schemas.ts'), 'utf-8')
      expect(schemas).toBe(`import * as z from 'zod'

export const PetSchema = z
  .object({ id: z.int(), name: z.string(), tag: z.string().exactOptional() })
  .meta({ description: 'A pet in the store' })
  .readonly()

export const CreatePetSchema = z
  .object({ name: z.string(), tag: z.string().exactOptional() })
  .meta({ description: 'Data for creating a new pet' })
  .readonly()
`)
    })

    it('readonly: false does not add .readonly()', { timeout: 30000 }, async () => {
      const d = tmpDir('cli_ro_false')
      await setupProject(
        d,
        {
          input: 'petstore.yaml',
          schema: 'zod',

          readonly: false,
          output: 'src/handlers',
          components: { schemas: { output: 'src/schemas.ts' } },
        },
        'petstore.yaml',
        PETSTORE_YAML,
      )

      const result = await runCli(d)
      expect(result.ok).toBe(true)

      const schemas = await fsp.readFile(path.join(d, 'src/schemas.ts'), 'utf-8')
      expect(schemas).toBe(`import * as z from 'zod'

export const PetSchema = z
  .object({ id: z.int(), name: z.string(), tag: z.string().exactOptional() })
  .meta({ description: 'A pet in the store' })

export const CreatePetSchema = z
  .object({ name: z.string(), tag: z.string().exactOptional() })
  .meta({ description: 'Data for creating a new pet' })
`)
    })

    it('readonly with components.output', { timeout: 30000 }, async () => {
      const d = tmpDir('cli_ro_co')
      await setupProject(
        d,
        {
          input: 'petstore.yaml',
          schema: 'zod',

          readonly: true,
          output: 'src/handlers',
          components: { output: 'src/openapi' },
        },
        'petstore.yaml',
        PETSTORE_YAML,
      )

      const result = await runCli(d)
      expect(result.ok).toBe(true)

      const schemas = await fsp.readFile(path.join(d, 'src/openapi/index.ts'), 'utf-8')
      expect(schemas).toBe(`import * as z from 'zod'

export const PetSchema = z
  .object({ id: z.int(), name: z.string(), tag: z.string().exactOptional() })
  .meta({ description: 'A pet in the store' })
  .readonly()

export type Pet = z.infer<typeof PetSchema>

export const CreatePetSchema = z
  .object({ name: z.string(), tag: z.string().exactOptional() })
  .meta({ description: 'Data for creating a new pet' })
  .readonly()

export type CreatePet = z.infer<typeof CreatePetSchema>
`)
    })

    it('readonly with exportTypes', { timeout: 30000 }, async () => {
      const d = tmpDir('cli_ro_types')
      await setupProject(
        d,
        {
          input: 'petstore.yaml',
          schema: 'zod',

          readonly: true,
          output: 'src/handlers',
          components: { schemas: { output: 'src/schemas.ts', exportTypes: true } },
        },
        'petstore.yaml',
        PETSTORE_YAML,
      )

      const result = await runCli(d)
      expect(result.ok).toBe(true)

      const schemas = await fsp.readFile(path.join(d, 'src/schemas.ts'), 'utf-8')
      expect(schemas).toBe(`import * as z from 'zod'

export const PetSchema = z
  .object({ id: z.int(), name: z.string(), tag: z.string().exactOptional() })
  .meta({ description: 'A pet in the store' })
  .readonly()

export type Pet = z.infer<typeof PetSchema>

export const CreatePetSchema = z
  .object({ name: z.string(), tag: z.string().exactOptional() })
  .meta({ description: 'Data for creating a new pet' })
  .readonly()

export type CreatePet = z.infer<typeof CreatePetSchema>
`)
    })

    it('readonly with effect schema', { timeout: 30000 }, async () => {
      const d = tmpDir('cli_ro_effect')
      await setupProject(
        d,
        {
          input: 'petstore.yaml',
          schema: 'effect',

          readonly: true,
          output: 'src/handlers',
          components: { schemas: { output: 'src/schemas.ts', exportTypes: true } },
        },
        'petstore.yaml',
        PETSTORE_YAML,
      )

      const result = await runCli(d)
      expect(result.ok).toBe(true)

      const schemas = await fsp.readFile(path.join(d, 'src/schemas.ts'), 'utf-8')
      expect(schemas).toBe(`import { Schema } from 'effect'

export const PetSchema = Schema.Struct({
  id: Schema.Number.pipe(Schema.int()),
  name: Schema.String,
  tag: Schema.optional(Schema.String),
}).annotations({ description: 'A pet in the store' })

export type PetSchema = typeof PetSchema.Type

export const CreatePetSchema = Schema.Struct({
  name: Schema.String,
  tag: Schema.optional(Schema.String),
}).annotations({ description: 'Data for creating a new pet' })

export type CreatePetSchema = typeof CreatePetSchema.Type
`)
    })
  })

  describe('openapi mode via CLI', () => {
    it('generates describeRoute handlers with openapi: true', { timeout: 30000 }, async () => {
      const d = tmpDir('cli_openapi')
      await setupProject(
        d,
        {
          input: 'petstore.yaml',
          schema: 'zod',
          openapi: true,

          output: 'src/handlers',
          components: { schemas: { output: 'src/schemas.ts', exportTypes: true } },
        },
        'petstore.yaml',
        PETSTORE_YAML,
      )

      const result = await runCli(d)
      expect(result.ok).toBe(true)

      const handlers = await fsp.readFile(path.join(d, 'src/handlers/pets.ts'), 'utf-8')
      expect(handlers).toBe(`import { Hono } from 'hono'
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
    validator('query', z.object({ limit: z.coerce.number().int().exactOptional() })),
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
`)
    })
  })

  describe('basePath via CLI', () => {
    it('basePath is applied to app', { timeout: 30000 }, async () => {
      const d = tmpDir('cli_basepath')
      await setupProject(
        d,
        {
          input: 'petstore.yaml',
          schema: 'zod',
          basePath: '/api/v1',

          output: 'src/handlers',
          components: { schemas: { output: 'src/schemas.ts' } },
        },
        'petstore.yaml',
        PETSTORE_YAML,
      )

      const result = await runCli(d)
      expect(result.ok).toBe(true)

      const app = await fsp.readFile(path.join(d, 'src/index.ts'), 'utf-8')
      expect(app).toBe(`import { Hono } from 'hono'
import { petsHandler } from './handlers'

const app = new Hono().basePath('/api/v1')

export const api = app.route('/', petsHandler)

export default app
`)
    })
  })

  describe('error handling', () => {
    it('returns error when no config file exists', { timeout: 30000 }, async () => {
      const d = tmpDir('cli_no_config')
      await fsp.mkdir(d, { recursive: true })

      const result = await runCli(d)
      expect(result).toStrictEqual({
        ok: false,
        error: `Config not found: ${path.resolve(d, 'takibi-hono.config.ts')}\nCreate takibi-hono.config.ts in the current directory. See https://github.com/nakita628/takibi-hono#configuration for an example.`,
      })
    })

    it('returns error when input file does not exist', { timeout: 30000 }, async () => {
      const d = tmpDir('cli_missing_input')
      await setupProject(
        d,
        {
          input: 'nonexistent.yaml',
          schema: 'zod',
        },
        'placeholder.yaml',
        '',
      )
      await fsp.unlink(path.join(d, 'placeholder.yaml'))

      const result = await runCli(d)
      expect(result.ok).toBe(false)
    })

    it('returns error when config has invalid schema', { timeout: 30000 }, async () => {
      const d = tmpDir('cli_invalid_schema')
      await fsp.mkdir(d, { recursive: true })
      const configContent = `export default { input: 'api.yaml', schema: 'invalid' }\n`
      await fsp.writeFile(path.join(d, 'takibi-hono.config.ts'), configContent)

      const result = await runCli(d)
      expect(result).toStrictEqual({
        ok: false,
        error:
          'Invalid config: schema: schema must be "zod" | "valibot" | "typebox" | "arktype" | "effect"',
      })
    })
  })
})
