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

/** Gives the handler of `route` in `file` a body, and puts `prologue` after the imports. */
async function fill(file: string, route: string, body: string, prologue = '') {
  const code = read(file)
  const at = code.indexOf(route)
  const filled = `${code.slice(0, at)}${code.slice(at).replace('(c) => {}', body)}`
  const end = filled.indexOf('\n\n')
  await fsp.writeFile(file, `${filled.slice(0, end)}\n${prologue}${filled.slice(end)}`)
}

function indexSpec(routes: readonly string[]) {
  return `openapi: 3.1.0
info: { title: Index, version: 1.0.0 }
paths:
${routes.map((route) => `  ${route}:\n    get: { responses: { '200': { description: ok } } }`).join('\n')}
`
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
    const kebab = { input: 'events.yaml', schema: 'zod' } as const
    const lowercase = { ...kebab, fileNameCase: 'lowercase' } as const

    beforeEach(async () => {
      await fsp.writeFile('events.yaml', KEBAB_SPEC)
    })

    it('names a fresh handler file in kebab case by default and keeps camelCase exports', async () => {
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

    it("names a fresh handler file the same with 'kebab-case' spelled out", async () => {
      await runGenerator(hono({ ...kebab, fileNameCase: 'kebab-case' }))
      expect(list('src/handlers')).toStrictEqual([
        'index.ts',
        'real-time-events.ts',
        'user-profiles.ts',
      ])
    })

    it("lowercases the name of a fresh handler file with 'lowercase'", async () => {
      await runGenerator(hono(lowercase))
      expect(list('src/handlers')).toStrictEqual([
        'index.ts',
        'realtimeevents.ts',
        'user_profiles.ts',
      ])
      expect(read('src/handlers/realtimeevents.ts')).toBe(`import { Hono } from 'hono'

export const realtimeeventsHandler = new Hono().get('/realTimeEvents', (c) => {})
`)
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
      await runGenerator(hono(lowercase))
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

      await runGenerator(hono(lowercase))
      await fsp.rename('src/handlers/realtimeevents.ts', 'src/handlers/real-time-events.ts')
      await fsp.rename('src/handlers/user_profiles.ts', 'src/handlers/user-profiles.ts')
      await runGenerator(hono(lowercase))
      expect(list('src/handlers')).toStrictEqual([
        'index.ts',
        'real-time-events.ts',
        'user-profiles.ts',
      ])
      expect(read('src/handlers/real-time-events.ts')).toContain("(c) => c.text('live'))")
    })

    it('regenerates a file renamed by hand in place', async () => {
      await runGenerator(hono(lowercase))
      await implement('src/handlers/realtimeevents.ts')
      await fsp.rename('src/handlers/realtimeevents.ts', 'src/handlers/realTimeEvents.ts')
      await runGenerator(hono(lowercase))
      expect(list('src/handlers')).toStrictEqual([
        'index.ts',
        'realTimeEvents.ts',
        'user_profiles.ts',
      ])
      expect(read('src/handlers/realTimeEvents.ts')).toContain("(c) => c.text('live'))")
      expect(read('src/handlers/realTimeEvents.ts')).toContain('export const realTimeEventsHandler')
      expect(read('src/handlers/index.ts')).toContain("export * from './realTimeEvents'")
    })

    const MOVED_SPEC = `openapi: 3.1.0
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
  /{org_id}/items:
    get:
      parameters:
        - { name: org_id, in: path, required: true, schema: { type: string } }
      responses:
        '200': { description: ok }
`
    const movedKebab = { input: 'moved.yaml', schema: 'zod' } as const
    const moved = { ...movedKebab, fileNameCase: 'lowercase' } as const

    it('carries handlers, with their imports and helpers, to the file their route moved to', async () => {
      await fsp.writeFile('moved.yaml', MOVED_SPEC)
      await runGenerator(hono(moved))
      expect(list('src/handlers')).toStrictEqual([
        'index.ts',
        'user-profiles.ts',
        'user_profiles.ts',
        'userprofiles.ts',
        '{org_id}.ts',
      ])
      await fill(
        'src/handlers/user_profiles.ts',
        "'/user_profiles'",
        '(c) => c.text(greet(A))',
        "import { greet } from '../greet'\n\nexport const A = 'a'\n",
      )
      await fill('src/handlers/user-profiles.ts', "'/user-profiles'", "(c) => c.text('b')")
      await fill(
        'src/handlers/userprofiles.ts',
        "'/userProfiles'",
        '(c) => c.text(C)',
        "\nconst C = 'c'\n",
      )
      await fill('src/handlers/{org_id}.ts', "'/:org_id/items'", "(c) => c.text('org')")

      await runGenerator(hono(movedKebab))
      expect(list('src/handlers')).toStrictEqual([
        'index.ts',
        'org-id.ts',
        'user-profiles.ts',
        'userprofiles.ts',
      ])
      const kebabFile = read('src/handlers/user-profiles.ts')
      expect(kebabFile).toContain("import { greet } from '../greet'")
      expect(kebabFile).toContain("const A = 'a'")
      expect(kebabFile).toContain("const C = 'c'")
      expect(kebabFile).toContain('(c) => c.text(greet(A))')
      expect(kebabFile).toContain("(c) => c.text('b')")
      expect(kebabFile).toContain('(c) => c.text(C)')
      expect(read('src/handlers/userprofiles.ts')).not.toContain("'/userProfiles'")
      expect(read('src/handlers/org-id.ts')).toContain("(c) => c.text('org')")
    })

    it('keeps a file no group takes while something of it is not carried', async () => {
      await fsp.writeFile('moved.yaml', MOVED_SPEC)
      await runGenerator(hono(moved))
      await fill(
        'src/handlers/user_profiles.ts',
        "'/user_profiles'",
        "(c) => c.text('a')",
        'const LIMIT = 10\n',
      )
      await fill(
        'src/handlers/user-profiles.ts',
        "'/user-profiles'",
        '(c) => c.text(String(LIMIT))',
        'const LIMIT = 50\n',
      )
      await runGenerator(hono(movedKebab))
      expect(list('src/handlers')).toContain('user_profiles.ts')
      const kebabFile = read('src/handlers/user-profiles.ts')
      expect(kebabFile).toContain('const LIMIT = 50')
      expect(kebabFile).not.toContain('const LIMIT = 10')
      expect(kebabFile).toContain("(c) => c.text('a')")
    })

    it('keeps the file a handler moves from while the file it moves to does not parse', async () => {
      await fsp.writeFile('moved.yaml', MOVED_SPEC)
      await runGenerator(hono(moved))
      await fill('src/handlers/user_profiles.ts', "'/user_profiles'", "(c) => c.text('a')")
      await fsp.writeFile(
        'src/handlers/user-profiles.ts',
        `${read('src/handlers/user-profiles.ts')}\nconst broken = (\n`,
      )
      await runGeneratorError(hono(movedKebab))
      expect(read('src/handlers/user_profiles.ts')).toContain("(c) => c.text('a')")
      expect(read('src/handlers/user-profiles.ts')).toContain('const broken = (')
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

    it('registers a group that starts at a path parameter after the static ones', async () => {
      await fsp.writeFile(
        'slug.yaml',
        `openapi: 3.1.0
info: { title: Slug, version: 1.0.0 }
paths:
  /users:
    get: { responses: { '200': { description: ok } } }
  /{slug}:
    get:
      parameters:
        - { name: slug, in: path, required: true, schema: { type: string } }
      responses: { '200': { description: ok } }
  /{org_id}/items:
    get:
      parameters:
        - { name: org_id, in: path, required: true, schema: { type: string } }
      responses: { '200': { description: ok } }
`,
      )
      const slug = { input: 'slug.yaml', schema: 'zod' } as const
      await runGenerator(hono({ ...slug, fileNameCase: 'lowercase' }))
      await fill('src/handlers/{org_id}.ts', "'/:org_id/items'", "(c) => c.text('org')")
      expect(read('src/index.ts')).toContain(
        "app.route('/', usersHandler).route('/', orgIdHandler).route('/', slugHandler)",
      )
      await runGenerator(hono(slug))
      expect(list('src/handlers')).toStrictEqual(['index.ts', 'org-id.ts', 'slug.ts', 'users.ts'])
      expect(read('src/handlers/org-id.ts')).toContain("(c) => c.text('org')")
      expect(read('src/index.ts')).toBe(`import { Hono } from 'hono'
import { orgIdHandler, slugHandler, usersHandler } from './handlers'

const app = new Hono()

export const api = app.route('/', usersHandler).route('/', orgIdHandler).route('/', slugHandler)

export default app
`)
    })

    it('keeps a parameter route out of the file of a static route of its name', async () => {
      await fsp.writeFile(
        'tenant.yaml',
        `openapi: 3.1.0
info: { title: Tenant, version: 1.0.0 }
paths:
  /{tenant}/items:
    get:
      parameters:
        - { name: tenant, in: path, required: true, schema: { type: string } }
      responses: { '200': { description: ok } }
  /tenant:
    get: { responses: { '200': { description: ok } } }
  /{org}:
    get:
      parameters:
        - { name: org, in: path, required: true, schema: { type: string } }
      responses: { '200': { description: ok } }
  /zebra:
    get: { responses: { '200': { description: ok } } }
`,
      )
      await runGenerator(hono({ input: 'tenant.yaml', schema: 'zod' }))
      expect(list('src/handlers')).toStrictEqual([
        'index.ts',
        'org.ts',
        'tenant.ts',
        'zebra.ts',
        '{tenant}.ts',
      ])
      expect(read('src/handlers/tenant.ts')).toBe(`import { Hono } from 'hono'

export const tenantHandler = new Hono().get('/tenant', (c) => {})
`)
      expect(read('src/index.ts')).toContain(`export const api = app
  .route('/', tenantHandler)
  .route('/', zebraHandler)
  .route('/', orgHandler)
  .route('/', tenantHandler2)
`)
    })

    it('keeps a group named as the barrel out of index.ts', async () => {
      await fsp.writeFile(
        'index.yaml',
        `openapi: 3.1.0
info: { title: Index, version: 1.0.0 }
paths:
  /pets:
    get: { responses: { '200': { description: ok } } }
  /{index}/docs:
    get:
      parameters:
        - { name: index, in: path, required: true, schema: { type: string } }
      responses: { '200': { description: ok } }
`,
      )
      const index = { input: 'index.yaml', schema: 'zod' } as const
      await runGenerator(hono({ ...index, fileNameCase: 'lowercase' }))
      expect(list('src/handlers')).toStrictEqual(['index.ts', 'pets.ts', '{index}.ts'])
      await fill('src/handlers/{index}.ts', "'/:index/docs'", "(c) => c.text('docs')")

      await runGenerator(hono(index))
      expect(list('src/handlers')).toStrictEqual(['__index.ts', 'index.ts', 'pets.ts'])
      expect(read('src/handlers/__index.ts')).toContain('export const indexHandler = new Hono()')
      expect(read('src/handlers/__index.ts')).toContain("(c) => c.text('docs')")
      expect(read('src/handlers/index.ts')).toBe(
        "export * from './__index'\nexport * from './pets'\n",
      )
      expect(read('src/index.ts')).toContain(
        "import { indexHandler, petsHandler } from './handlers'",
      )

      await runGenerator(hono(index))
      expect(list('src/handlers')).toStrictEqual(['__index.ts', 'index.ts', 'pets.ts'])
      expect(read('src/handlers/__index.ts')).toContain("(c) => c.text('docs')")
    })

    it('leaves the file of a reserved name to its group when a group of a like name is added', async () => {
      const index = { input: 'index.yaml', schema: 'zod', fileNameCase: 'lowercase' } as const
      await fsp.writeFile('index.yaml', indexSpec(['/index']))
      await runGenerator(hono(index))
      await fill('src/handlers/__index.ts', "'/index'", "(c) => c.text('index')")
      await fsp.writeFile('index.yaml', indexSpec(['/_index', '/index']))
      await runGenerator(hono(index))
      expect(list('src/handlers')).toStrictEqual(['__index.ts', '_index.ts', 'index.ts'])
      expect(read('src/handlers/__index.ts')).toContain("'/index', (c) => c.text('index')")
      expect(read('src/handlers/_index.ts')).toContain("'/_index'")
    })

    it('keeps a group named as the webhooks file out of webhooks.ts', async () => {
      await fsp.writeFile(
        'hooks.yaml',
        `openapi: 3.1.0
info: { title: Hooks, version: 1.0.0 }
paths:
  /webhooks:
    get: { responses: { '200': { description: ok } } }
  /index:
    get: { responses: { '200': { description: ok } } }
  /__index:
    get: { responses: { '200': { description: ok } } }
webhooks:
  newUser:
    post: { responses: { '200': { description: ok } } }
`,
      )
      await runGenerator(
        hono({ input: 'hooks.yaml', schema: 'zod', openapi: true, fileNameCase: 'lowercase' }),
      )
      expect(list('src/handlers')).toStrictEqual([
        '___index.ts',
        '__index.ts',
        '__webhooks.ts',
        'index.ts',
        'webhooks.ts',
      ])
      expect(read('src/handlers/webhooks.ts')).toContain("'/newUser'")
      expect(read('src/handlers/__webhooks.ts')).toContain("'/webhooks'")
      expect(read('src/handlers/__index.ts')).toContain("'/__index'")
      expect(read('src/handlers/___index.ts')).toContain("'/index'")
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

  describe('handler files of one export name', () => {
    const config = { input: 'profiles.yaml', schema: 'zod', fileNameCase: 'lowercase' } as const

    beforeEach(async () => {
      await fsp.writeFile(
        'profiles.yaml',
        `openapi: 3.1.0
info: { title: Profiles, version: 1.0.0 }
paths:
  /user_profiles:
    get: { responses: { '200': { description: ok } } }
  /user-profiles:
    get: { responses: { '200': { description: ok } } }
  /:
    get: { responses: { '200': { description: ok } } }
  /root:
    get: { responses: { '200': { description: ok } } }
`,
      )
    })

    it('numbers the export of the later file', async () => {
      await runGenerator(hono(config))
      expect(list('src/handlers')).toStrictEqual([
        '__root.ts',
        'index.ts',
        'root.ts',
        'user-profiles.ts',
        'user_profiles.ts',
      ])
      expect(read('src/handlers/user-profiles.ts')).toBe(`import { Hono } from 'hono'

export const userProfilesHandler = new Hono().get('/user-profiles', (c) => {})
`)
      expect(read('src/handlers/user_profiles.ts')).toBe(`import { Hono } from 'hono'

export const userProfilesHandler2 = new Hono().get('/user_profiles', (c) => {})
`)
      expect(read('src/handlers/root.ts')).toBe(`import { Hono } from 'hono'

export const rootHandler2 = new Hono().get('/root', (c) => {})
`)
      expect(read('src/index.ts')).toBe(`import { Hono } from 'hono'
import { rootHandler, rootHandler2, userProfilesHandler, userProfilesHandler2 } from './handlers'

const app = new Hono()

export const api = app
  .route('/', rootHandler)
  .route('/', rootHandler2)
  .route('/', userProfilesHandler)
  .route('/', userProfilesHandler2)

export default app
`)
    })

    it('keeps the handlers of both files when run again', async () => {
      await runGenerator(hono(config))
      await fill('src/handlers/user-profiles.ts', "'/user-profiles'", "(c) => c.text('kebab')")
      await fill('src/handlers/user_profiles.ts', "'/user_profiles'", "(c) => c.text('snake')")
      await runGenerator(hono(config))
      expect(read('src/handlers/user-profiles.ts')).toBe(`import { Hono } from 'hono'

export const userProfilesHandler = new Hono().get('/user-profiles', (c) => c.text('kebab'))
`)
      expect(read('src/handlers/user_profiles.ts')).toBe(`import { Hono } from 'hono'

export const userProfilesHandler2 = new Hono().get('/user_profiles', (c) => c.text('snake'))
`)
    })

    it('numbers the export past the definitions of defineHandler, which keep their names', async () => {
      await fsp.writeFile(
        'definitions.yaml',
        `openapi: 3.1.0
info: { title: Definitions, version: 1.0.0 }
paths:
  /pets:
    get: { responses: { '200': { description: ok } } }
  /get_pets:
    get: { responses: { '200': { description: ok } } }
  /get-pets:
    get: { responses: { '200': { description: ok } } }
`,
      )
      await runGenerator(
        hono({
          input: 'definitions.yaml',
          schema: 'zod',
          fileNameCase: 'lowercase',
          defineHandler: { output: 'src/definitions.ts', template: true },
        }),
      )
      expect(read('src/definitions.ts')).toBe(`import { defineHandler } from 'hono/factory'

export const getPetsHandler2 = defineHandler({})

export const getGetPetsHandler = defineHandler({})

export const getGetPetsHandler2 = defineHandler({})
`)
      expect(read('src/handlers/get_pets.ts')).toBe(`import { Hono } from 'hono'
import { getGetPetsHandler } from '../definitions'

export const getPetsHandler3 = new Hono().get(
  '/get_pets',
  getGetPetsHandler(async (c) => {}),
)
`)
      expect(read('src/handlers/pets.ts')).toBe(`import { Hono } from 'hono'
import { getPetsHandler2 } from '../definitions'

export const petsHandler = new Hono().get(
  '/pets',
  getPetsHandler2(async (c) => {}),
)
`)
      expect(read('src/index.ts')).toBe(`import { Hono } from 'hono'
import { getPetsHandler, getPetsHandler3, petsHandler } from './handlers'

const app = new Hono()

export const api = app
  .route('/', getPetsHandler)
  .route('/', getPetsHandler3)
  .route('/', petsHandler)

export default app
`)
    })

    it('writes split definitions whose names read as one file to files of their own names', async () => {
      await fsp.writeFile(
        'definitions.yaml',
        `openapi: 3.1.0
info: { title: Definitions, version: 1.0.0 }
paths:
  /get-pets:
    get: { responses: { '200': { description: ok } } }
  /pets:
    get: { responses: { '200': { description: ok } } }
  /pets2:
    get: { responses: { '200': { description: ok } } }
`,
      )
      await runGenerator(
        hono({
          input: 'definitions.yaml',
          schema: 'zod',
          defineHandler: { output: 'src/definitions', split: true, template: true },
        }),
      )
      expect(list('src/definitions')).toStrictEqual([
        'getGetPets.ts',
        'getPets2Handler.ts',
        'getPetsHandler2.ts',
        'index.ts',
      ])
      expect(read('src/definitions/getPetsHandler2.ts'))
        .toBe(`import { defineHandler } from 'hono/factory'

export const getPetsHandler2 = defineHandler({})
`)
      expect(read('src/definitions/getPets2Handler.ts'))
        .toBe(`import { defineHandler } from 'hono/factory'

export const getPets2Handler = defineHandler({})
`)
      expect(read('src/definitions/index.ts')).toBe(`export * from './getGetPets'
export * from './getPets2Handler'
export * from './getPetsHandler2'
`)
    })

    it('numbers the group of a split app, in the app entry, the client and rpc', async () => {
      await runGenerator(
        hono({
          ...config,
          split: true,
          client: { output: 'src/client.ts', baseUrl: '/' },
          rpc: { output: 'src/rpc.ts' },
        }),
      )
      expect(read('src/index.ts')).toBe(`import { Hono } from 'hono'
import { rootHandler, rootHandler2, userProfilesHandler, userProfilesHandler2 } from './handlers'

const app = new Hono()

export const __root = app.route('/', rootHandler)

export const root = app.route('/', rootHandler2)

export const userProfiles = app.route('/', userProfilesHandler)

export const userProfiles2 = app.route('/', userProfilesHandler2)

export default app
`)
      expect(read('src/client.ts')).toBe(`import { hc } from 'hono/client'
import type { __root, root, userProfiles, userProfiles2 } from '.'

type __RootClient = ReturnType<typeof hc<typeof __root>>

const hc__RootWithType = (...args: Parameters<typeof hc>): __RootClient =>
  hc<typeof __root>(...args)

export const __rootClient = hc__RootWithType('/')

type RootClient = ReturnType<typeof hc<typeof root>>

const hcRootWithType = (...args: Parameters<typeof hc>): RootClient => hc<typeof root>(...args)

export const rootClient = hcRootWithType('/')

type UserProfilesClient = ReturnType<typeof hc<typeof userProfiles>>

const hcUserProfilesWithType = (...args: Parameters<typeof hc>): UserProfilesClient =>
  hc<typeof userProfiles>(...args)

export const userProfilesClient = hcUserProfilesWithType('/')

type UserProfiles2Client = ReturnType<typeof hc<typeof userProfiles2>>

const hcUserProfiles2WithType = (...args: Parameters<typeof hc>): UserProfiles2Client =>
  hc<typeof userProfiles2>(...args)

export const userProfiles2Client = hcUserProfiles2WithType('/')
`)
      // hono-takibi numbers the functions in document order and the groups are numbered in
      // file name order, so `getUserProfiles` (`/user_profiles`) calls `userProfiles2Client`.
      expect(read('src/rpc.ts')).toBe(`import type { ClientRequestOptions } from 'hono/client'
import { userProfiles2Client, userProfilesClient, __rootClient, rootClient } from './client'

export async function getUserProfiles(options?: ClientRequestOptions) {
  return await userProfiles2Client.user_profiles.$get(undefined, options)
}

export async function getUserProfiles2(options?: ClientRequestOptions) {
  return await userProfilesClient['user-profiles'].$get(undefined, options)
}

export async function get(options?: ClientRequestOptions) {
  return await __rootClient.index.$get(undefined, options)
}

export async function getRoot(options?: ClientRequestOptions) {
  return await rootClient.root.$get(undefined, options)
}
`)
    })

    it('swaps the numbered groups for api when split is turned on and off', async () => {
      const api = `import { Hono } from 'hono'
import { rootHandler, rootHandler2, userProfilesHandler, userProfilesHandler2 } from './handlers'

const app = new Hono()

export const api = app
  .route('/', rootHandler)
  .route('/', rootHandler2)
  .route('/', userProfilesHandler)
  .route('/', userProfilesHandler2)

export default app
`
      await runGenerator(hono(config))
      await runGenerator(hono({ ...config, split: true }))
      expect(read('src/index.ts')).toBe(`import { Hono } from 'hono'
import { rootHandler, rootHandler2, userProfilesHandler, userProfilesHandler2 } from './handlers'

const app = new Hono()

export const __root = app.route('/', rootHandler)

export const root = app.route('/', rootHandler2)

export const userProfiles = app.route('/', userProfilesHandler)

export const userProfiles2 = app.route('/', userProfilesHandler2)

export default app
`)
      await runGenerator(hono(config))
      expect(read('src/index.ts')).toBe(api)
    })

    it('drops the numbered group of a deleted path from a split app', async () => {
      await runGenerator(hono({ ...config, split: true }))
      await fsp.writeFile(
        'profiles.yaml',
        `openapi: 3.1.0
info: { title: Profiles, version: 1.0.0 }
paths:
  /user-profiles:
    get: { responses: { '200': { description: ok } } }
  /:
    get: { responses: { '200': { description: ok } } }
`,
      )
      await runGenerator(hono({ ...config, split: true }))
      expect(read('src/index.ts')).toBe(`import { Hono } from 'hono'
import { rootHandler, userProfilesHandler } from './handlers'

const app = new Hono()

export const __root = app.route('/', rootHandler)

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
