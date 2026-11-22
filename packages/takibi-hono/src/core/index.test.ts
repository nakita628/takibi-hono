import fs from 'node:fs'
import fsp from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test'

import { runGenerator, runGeneratorError } from '../testing/index.js'
import { hono } from './index.js'
import { LayoutError } from './layout.js'

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

/** Gives the handler of `/realTimeEvents` a body, whatever file it is in. */
async function implement(file: string) {
  await fsp.writeFile(file, read(file).replace('(c) => {})', "(c) => c.text('live'))"))
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
    validator(
      'query',
      z.object({
        limit: z
          .string()
          .regex(/^-?(?:0|[1-9]\\d*)$/)
          .transform((val) => Number(val))
          .pipe(z.number().int())
          .exactOptional(),
      }),
    ),
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
        v.object({
          limit: v.pipe(
            v.string(),
            v.regex(/^-?(?:0|[1-9]\\d*)$/),
            v.transform((input) => Number(input)),
            v.number(),
            v.safeInteger(),
          ),
        }),
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
    sValidator(
      'query',
      z.object({
        limit: z
          .string()
          .regex(/^-?(?:0|[1-9]\\d*)$/)
          .transform((val) => Number(val))
          .pipe(z.number().int())
          .exactOptional(),
      }),
    ),
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

  describe('fileNameCase', () => {
    const KEBAB_SPEC = `openapi: 3.1.0
info: { title: Events, version: 1.0.0 }
paths:
  /realTimeEvents:
    get:
      responses:
        '200': { description: ok }
  /user_profiles/{id}:
    get:
      parameters:
        - { name: id, in: path, required: true, schema: { type: string } }
      responses:
        '200': { description: ok }
`
    const config = { input: 'events.yaml', schema: 'zod' } as const
    const kebab = { ...config, fileNameCase: 'kebab-case' } as const

    beforeEach(async () => {
      await fsp.writeFile('events.yaml', KEBAB_SPEC)
    })

    it('names a fresh handler file in kebab case and keeps camelCase exports', async () => {
      await runGenerator(hono(kebab))
      expect(list('src/handlers')).toStrictEqual([
        'index.ts',
        'real-time-events.ts',
        'user-profiles.ts',
      ])
      expect(read('src/handlers/real-time-events.ts')).toBe(`import { Hono } from 'hono'

export const realTimeEventsHandler = new Hono().get('/realTimeEvents', (c) => {})
`)
      expect(read('src/handlers/index.ts')).toBe(
        "export * from './real-time-events'\nexport * from './user-profiles'\n",
      )
      expect(read('src/index.ts')).toContain(
        "import { realTimeEventsHandler, userProfilesHandler } from './handlers'",
      )
    })

    it('keeps an implementation when it runs again', async () => {
      await runGenerator(hono(kebab))
      await implement('src/handlers/real-time-events.ts')
      await runGenerator(hono(kebab))
      expect(list('src/handlers')).toStrictEqual([
        'index.ts',
        'real-time-events.ts',
        'user-profiles.ts',
      ])
      expect(read('src/handlers/real-time-events.ts')).toContain("(c) => c.text('live'))")
    })

    it('keeps the files of a project generated in the other case', async () => {
      await runGenerator(hono(config))
      expect(list('src/handlers')).toStrictEqual([
        'index.ts',
        'realtimeevents.ts',
        'user_profiles.ts',
      ])
      await implement('src/handlers/realtimeevents.ts')
      await runGenerator(hono(kebab))
      expect(list('src/handlers')).toStrictEqual([
        'index.ts',
        'realtimeevents.ts',
        'user_profiles.ts',
      ])
      expect(read('src/handlers/realtimeevents.ts')).toContain("(c) => c.text('live'))")

      await runGenerator(hono(config))
      await fsp.rename('src/handlers/realtimeevents.ts', 'src/handlers/real-time-events.ts')
      await fsp.rename('src/handlers/user_profiles.ts', 'src/handlers/user-profiles.ts')
      await runGenerator(hono(config))
      expect(list('src/handlers')).toStrictEqual([
        'index.ts',
        'real-time-events.ts',
        'user-profiles.ts',
      ])
      expect(read('src/handlers/real-time-events.ts')).toContain("(c) => c.text('live'))")
    })

    it('regenerates a file renamed by hand in place', async () => {
      await runGenerator(hono(config))
      await implement('src/handlers/realtimeevents.ts')
      await fsp.rename('src/handlers/realtimeevents.ts', 'src/handlers/realTimeEvents.ts')
      await runGenerator(hono(config))
      expect(list('src/handlers')).toStrictEqual([
        'index.ts',
        'realTimeEvents.ts',
        'user_profiles.ts',
      ])
      expect(read('src/handlers/realTimeEvents.ts')).toContain("(c) => c.text('live'))")
      expect(read('src/handlers/realTimeEvents.ts')).toContain('export const realTimeEventsHandler')
      expect(read('src/handlers/index.ts')).toContain("export * from './realTimeEvents'")
    })

    it('carries the handlers of routes that move between files when the option is switched', async () => {
      await fsp.writeFile(
        'moved.yaml',
        `openapi: 3.1.0
info: { title: Moved, version: 1.0.0 }
paths:
  /user_profiles:
    get:
      responses:
        '200': { description: ok }
  /user-profiles:
    get:
      responses:
        '200': { description: ok }
  /userProfiles:
    post:
      responses:
        '200': { description: ok }
  /userprofiles:
    post:
      responses:
        '200': { description: ok }
`,
      )
      const moved = { input: 'moved.yaml', schema: 'zod' } as const
      await runGenerator(hono(moved))
      expect(list('src/handlers')).toStrictEqual([
        'index.ts',
        'user-profiles.ts',
        'user_profiles.ts',
        'userprofiles.ts',
      ])
      const fill = async (file: string, route: string, body: string) => {
        const code = read(file)
        const at = code.indexOf(route)
        await fsp.writeFile(
          file,
          `${code.slice(0, at)}${code.slice(at).replace('(c) => {}', body)}`.replace(
            "import { Hono } from 'hono'",
            "import { Hono } from 'hono'\n\nconst KEPT = 1",
          ),
        )
      }
      await fill('src/handlers/user_profiles.ts', "'/user_profiles'", "(c) => c.text('a')")
      await fill('src/handlers/user-profiles.ts', "'/user-profiles'", "(c) => c.text('b')")
      await fill('src/handlers/userprofiles.ts', "'/userProfiles'", "(c) => c.text('c')")

      await runGenerator(hono({ ...moved, fileNameCase: 'kebab-case' }))
      expect(list('src/handlers')).toStrictEqual([
        'index.ts',
        'user-profiles.ts',
        'userprofiles.ts',
      ])
      const kebabFile = read('src/handlers/user-profiles.ts')
      expect(kebabFile).toContain("(c) => c.text('a')")
      expect(kebabFile).toContain("(c) => c.text('b')")
      expect(kebabFile).toContain("(c) => c.text('c')")
      expect(read('src/handlers/userprofiles.ts')).not.toContain("c.text('c')")
    })

    it('reserves the export of a renamed file against the definitions', async () => {
      await fsp.writeFile(
        'comments.yaml',
        `openapi: 3.1.0
info: { title: Comments, version: 1.0.0 }
paths:
  /postcomments:
    get:
      responses:
        '200': { description: ok }
  /comments:
    post:
      responses:
        '200': { description: ok }
`,
      )
      const withDefinitions = {
        input: 'comments.yaml',
        schema: 'zod',
        defineHandler: { output: 'src/routes.ts', template: true },
      } as const
      await runGenerator(hono(withDefinitions))
      await fsp.rename('src/handlers/postcomments.ts', 'src/handlers/postComments.ts')
      await runGenerator(hono(withDefinitions))
      expect(read('src/handlers/postComments.ts')).toContain('export const postCommentsHandler')
      expect(read('src/routes.ts')).not.toMatch(/export const postCommentsHandler\b/u)
    })

    it('does not give the root a file named root', async () => {
      await fsp.writeFile(
        'root.yaml',
        `openapi: 3.1.0
info: { title: Root, version: 1.0.0 }
paths:
  /:
    get:
      responses:
        '200': { description: ok }
`,
      )
      await fsp.mkdir('src/handlers', { recursive: true })
      await fsp.writeFile('src/handlers/root.ts', 'export const rootHandler = 1\n')
      await runGenerator(hono({ input: 'root.yaml', schema: 'zod' }))
      expect(list('src/handlers')).toStrictEqual(['__root.ts', 'index.ts'])
    })

    it('exports each group of a split app under its camelCase name', async () => {
      await runGenerator(
        hono({
          ...kebab,
          split: true,
          client: { output: 'src/client.ts', baseUrl: '/' },
          rpc: { output: 'src/rpc.ts' },
        }),
      )
      expect(read('src/client.ts')).toContain('export const realTimeEventsClient')
      expect(read('src/client.ts')).toContain('export const userProfilesClient')
      expect(read('src/rpc.ts')).toContain('realTimeEventsClient.realTimeEvents.$get')
      expect(read('src/index.ts')).toBe(`import { Hono } from 'hono'
import { realTimeEventsHandler, userProfilesHandler } from './handlers'

const app = new Hono()

export const realTimeEvents = app.route('/', realTimeEventsHandler)

export const userProfiles = app.route('/', userProfilesHandler)

export default app
`)
    })
  })

  it('imports components of another package by its package name', async () => {
    await fsp.mkdir('apps/api', { recursive: true })
    await fsp.mkdir('packages/components', { recursive: true })
    await fsp.writeFile('apps/api/package.json', '{ "name": "api" }\n')
    await fsp.writeFile('packages/components/package.json', '{ "name": "@acme/components" }\n')
    const config = {
      input: 'openapi.yaml',
      schema: 'zod',
      output: 'apps/api/src/handlers',
      components: { output: 'packages/components/src/index.ts', package: '@acme/components' },
    } as const
    await runGenerator(hono(config))
    expect(read('apps/api/src/handlers/pets.ts').split('\n\n')[0]).toBe(`import { Hono } from 'hono'
import { sValidator } from '@hono/standard-validator'
import * as z from 'zod'
import { PetSchema } from '@acme/components'`)

    // The same layout without the package name has no way to write that import, and
    // nothing is written before that is known.
    await fsp.rm('apps', { recursive: true })
    await fsp.rm('packages/components/src', { recursive: true })
    const error = await runGeneratorError(
      hono({ ...config, components: { output: config.components.output } }),
    )
    expect(error).toStrictEqual(
      new LayoutError({
        message:
          'handlers imports components.schemas from another package: set components.schemas.package to the name of the package packages/components/src/index.ts is written into.',
      }),
    )
    expect(list('.')).toStrictEqual([])
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
