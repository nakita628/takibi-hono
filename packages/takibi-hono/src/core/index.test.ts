import fs from 'node:fs'
import fsp from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test'

import { runGenerator, runGeneratorError } from '../testing/index.js'
import { hono } from './index.js'

const SPEC = `openapi: 3.1.0
info: { title: Pets, version: 1.0.0 }
paths:
  /pets:
    get:
      summary: List pets
      parameters:
        - { name: limit, in: query, schema: { type: integer } }
      responses:
        '200':
          description: ok
          content:
            application/json:
              schema: { type: array, items: { $ref: '#/components/schemas/Pet' } }
        '404':
          $ref: '#/components/responses/NotFound'
    post:
      requestBody:
        content:
          application/json:
            schema: { $ref: '#/components/schemas/Pet' }
      responses:
        '201': { description: created }
  /users/{id}:
    get:
      parameters:
        - { name: id, in: path, required: true, schema: { type: string } }
      responses:
        '200': { description: ok }
webhooks:
  petAdded:
    post:
      requestBody:
        content:
          application/json:
            schema: { $ref: '#/components/schemas/Pet' }
      responses:
        '200': { description: ok }
components:
  schemas:
    Pet:
      type: object
      required: [name]
      properties:
        name: { type: string }
  responses:
    NotFound:
      description: not found
`

const cwd = process.cwd()

beforeEach(async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'takibi-hono-core-'))
  await fsp.writeFile(path.join(dir, 'openapi.yaml'), SPEC)
  process.chdir(dir)
})

afterEach(async () => {
  const dir = process.cwd()
  process.chdir(cwd)
  await fsp.rm(dir, { recursive: true, force: true })
})

function read(file: string) {
  return fs.readFileSync(file, 'utf8')
}

function list(dir: string) {
  return fs
    .readdirSync(dir, { recursive: true, encoding: 'utf8' })
    .filter((file) => file.endsWith('.ts'))
    .sort()
}

describe('hono', () => {
  it('hono-openapi mode: components, handlers, webhooks and the app', async () => {
    await runGenerator(
      hono({ input: 'openapi.yaml', schema: 'zod', openapi: true, basePath: '/api' }),
    )
    expect(list('src')).toStrictEqual([
      'components/index.ts',
      'handlers/index.ts',
      'handlers/pets.ts',
      'handlers/users.ts',
      'handlers/webhooks.ts',
      'index.ts',
    ])
    expect(read('src/components/index.ts')).toBe(`import * as z from 'zod'

export const PetSchema = z.object({ name: z.string() }).meta({ ref: 'Pet' })

export type Pet = z.infer<typeof PetSchema>

export const NotFoundResponse = { description: 'not found' }
`)
    expect(read('src/handlers/pets.ts')).toBe(`import { Hono } from 'hono'
import { describeRoute, resolver, validator } from 'hono-openapi'
import * as z from 'zod'
import { PetSchema, NotFoundResponse } from '../components'

export const petsHandler = new Hono()
  .get(
    '/pets',
    describeRoute({
      summary: 'List pets',
      responses: {
        '200': {
          description: 'ok',
          content: { 'application/json': { schema: resolver(z.array(PetSchema)) } },
        },
        '404': NotFoundResponse,
      },
    }),
    validator('query', z.object({ limit: z.coerce.number().int().exactOptional() })),
    (c) => {},
  )
  .post(
    '/pets',
    describeRoute({ responses: { '201': { description: 'created' } } }),
    validator('json', PetSchema),
    (c) => {},
  )
`)
    expect(read('src/handlers/webhooks.ts')).toBe(`import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { PetSchema } from '../components'

export const webhooksHandler = new Hono().post(
  '/petAdded',
  describeRoute({ responses: { '200': { description: 'ok' } } }),
  validator('json', PetSchema),
  (c) => {},
)
`)
    expect(read('src/handlers/index.ts')).toBe(`export * from './pets'
export * from './users'
`)
    expect(read('src/index.ts')).toBe(`import { Hono } from 'hono'
import { petsHandler, usersHandler } from './handlers'

const app = new Hono().basePath('/api')

export const api = app.route('/', petsHandler).route('/', usersHandler)

export default app
`)
  })

  it('per-kind layout: split schemas and a responses file, plain validators', async () => {
    await runGenerator(
      hono({
        input: 'openapi.yaml',
        schema: 'valibot',
        components: {
          schemas: { output: 'src/schemas', split: true, exportTypes: true },
          responses: { output: 'src/responses.ts' },
        },
      }),
    )
    expect(list('src')).toStrictEqual([
      'handlers/index.ts',
      'handlers/pets.ts',
      'handlers/users.ts',
      'index.ts',
      'responses.ts',
      'schemas/index.ts',
      'schemas/pet.ts',
    ])
    expect(read('src/schemas/pet.ts')).toBe(`import * as v from 'valibot'

export const PetSchema = v.object({ name: v.string() })

export type Pet = v.InferOutput<typeof PetSchema>
`)
    expect(read('src/schemas/index.ts')).toBe(`export * from './pet'
`)
    expect(read('src/responses.ts'))
      .toBe(`export const NotFoundResponse = { description: 'not found' }
`)
    expect(read('src/handlers/pets.ts')).toBe(`import { Hono } from 'hono'
import { sValidator } from '@hono/standard-validator'
import * as v from 'valibot'
import { PetSchema } from '../schemas'

export const petsHandler = new Hono()
  .get(
    '/pets',
    sValidator(
      'query',
      v.partial(
        v.object({ limit: v.pipe(v.string(), v.transform(Number), v.number(), v.integer()) }),
      ),
    ),
    (c) => {},
  )
  .post('/pets', sValidator('json', PetSchema), (c) => {})
`)
  })

  it('regeneration keeps hand-written code and deletes handlers no path maps to', async () => {
    const config = { input: 'openapi.yaml', schema: 'zod' } as const
    await runGenerator(hono(config))
    await fsp.writeFile(
      'src/handlers/pets.ts',
      read('src/handlers/pets.ts')
        .replace(
          "import { Hono } from 'hono'",
          "import { Hono } from 'hono'\nimport { cache } from 'hono/cache'",
        )
        .replace('export const petsHandler', 'const LIMIT = 10\n\nexport const petsHandler')
        .replace('(c) => {},', '(c) => c.json([], 200),'),
    )
    await fsp.writeFile(
      'src/index.ts',
      read('src/index.ts')
        .replace(
          'import { petsHandler',
          "import { logger } from 'hono/logger'\nimport { petsHandler",
        )
        .replace('export const api', 'app.use(logger())\n\nexport const api'),
    )
    await fsp.writeFile('src/handlers/old.ts', 'export const oldHandler = 1\n')

    await runGenerator(hono(config))
    expect(list('src/handlers')).toStrictEqual(['index.ts', 'pets.ts', 'users.ts'])
    expect(read('src/handlers/pets.ts')).toBe(`import { Hono } from 'hono'
import { sValidator } from '@hono/standard-validator'
import * as z from 'zod'
import { PetSchema } from '../components'
import { cache } from 'hono/cache'

const LIMIT = 10

export const petsHandler = new Hono()
  .get(
    '/pets',
    sValidator('query', z.object({ limit: z.coerce.number().int().exactOptional() })),
    (c) => c.json([], 200),
  )
  .post('/pets', sValidator('json', PetSchema), (c) => {})
`)
    expect(read('src/index.ts')).toBe(`import { Hono } from 'hono'
import { petsHandler, usersHandler } from './handlers'
import { logger } from 'hono/logger'

const app = new Hono()

app.use(logger())

export const api = app.route('/', petsHandler).route('/', usersHandler)

export default app
`)
  })

  it('fails with OpenAPIError for a missing input and writes nothing', async () => {
    const error = await runGeneratorError(hono({ input: 'missing.yaml', schema: 'zod' }))
    expect(error._tag).toBe('OpenAPIError')
    expect(list('.')).toStrictEqual([])
  })

  it('formats with the config format block', async () => {
    await runGenerator(hono({ input: 'openapi.yaml', schema: 'zod', format: { semi: true } }))
    expect(read('src/index.ts')).toBe(`import { Hono } from 'hono';
import { petsHandler, usersHandler } from './handlers';

const app = new Hono();

export const api = app.route('/', petsHandler).route('/', usersHandler);

export default app;
`)
  })
})
