// The Vite plugin, against a real dev server.
//
// A dev server started with `takibiHonoVite()` reads takibi-hono.config.ts from its working
// directory and generates on startup. The test deletes the generated output, starts a
// server, and waits for the output to come back with the routes of openapi.yaml in it.
//
// The plugin finds its config through `process.cwd()`, so the test has to change directory.
// That is why the vitest pool is 'forks' in vite.config.ts: each test file runs in a process
// of its own, and the change cannot leak into another file.
import { existsSync, readFileSync, rmSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { takibiHonoVite } from 'takibi-hono/vite-plugin'
import { createServer } from 'vite'
import { afterAll, expect, it, vi } from 'vite-plus/test'

const caseDir = path.dirname(fileURLToPath(import.meta.url))
const generated = path.join(caseDir, '__generated__')
const originalCwd = process.cwd()

// Back to the directory the run started in, whatever the test did.
afterAll(() => {
  process.chdir(originalCwd)
})

// The output directory is removed first, so the files that appear can only have been written
// by the plugin. The wait is on the content, not on the path: `writeFile` opens the file
// before it writes, so for a moment the file exists and is empty.
it('generates from the config in the working directory when the dev server starts', async () => {
  process.chdir(caseDir)
  rmSync(generated, { recursive: true, force: true })
  expect(existsSync(generated)).toBe(false)

  const server = await createServer({
    root: caseDir,
    logLevel: 'silent',
    server: { middlewareMode: true },
    plugins: [takibiHonoVite()],
  })
  const app = path.join(generated, 'src', 'index.ts')
  await vi.waitFor(
    () => {
      expect(existsSync(app)).toBe(true)
      expect(readFileSync(app, 'utf8')).toBe(`import { Hono } from 'hono'
import { healthHandler, todosHandler } from './handlers'

const app = new Hono()

export const api = app.route('/', healthHandler).route('/', todosHandler)

export default app
`)
    },
    { timeout: 30_000 },
  )
  await server.close()

  // Every path of the document is there, and the components module it validates with.
  expect(readFileSync(path.join(generated, 'src', 'handlers', 'todos.ts'), 'utf8'))
    .toBe(`import { Hono } from 'hono'
import { describeRoute, resolver } from 'hono-openapi'
import * as z from 'zod'
import { TodoSchema } from '../components'

export const todosHandler = new Hono().get(
  '/todos',
  describeRoute({
    operationId: 'listTodos',
    responses: {
      '200': {
        description: 'The todos',
        content: { 'application/json': { schema: resolver(z.array(TodoSchema)) } },
      },
    },
  }),
  (c) => {},
)
`)
  expect(readFileSync(path.join(generated, 'src', 'components', 'index.ts'), 'utf8'))
    .toBe(`import * as z from 'zod'

export const TodoSchema = z.object({ id: z.int(), title: z.string() }).meta({ ref: 'Todo' })

export type Todo = z.infer<typeof TodoSchema>
`)
}, 60_000)
