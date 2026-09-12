import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { Effect } from 'effect'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'

import { hono } from '../core/index.js'
import { OpenAPIError } from '../openapi/index.js'
import { takibiHonoVite } from './index.js'

// The generators have their own suites; here they only need to be observable.
vi.mock('../core/index.js', async () => {
  const { Effect: E } = await import('effect')
  return {
    hono: vi.fn<(config: unknown) => Effect.Effect<void, { message: string }>>(() => E.void),
  }
})

type MockServer = {
  watcher: {
    add: (paths: string | readonly string[]) => void
    on: (event: 'all', callback: (eventType: string, filePath: string) => void) => void
  }
  ws: { send: (payload: { type: string }) => void }
  pluginContainer: { resolveId: (moduleId: string) => Promise<{ id: string } | null> }
  moduleGraph: {
    invalidateModule: (module: { id?: string } | null) => void
    invalidateAll: () => void
    getModuleById: (moduleId: string) => { id?: string } | null
  }
  ssrLoadModule: (moduleId: string) => Promise<{ [k: string]: unknown }>
}

function createMockServer(config?: unknown) {
  const addedPaths: string[] = []
  const sentMessages: unknown[] = []
  const watcherCallbacks: ((eventType: string, filePath: string) => void)[] = []
  const state = { config: config ?? { input: 'openapi.yaml', schema: 'zod' } }
  const server: MockServer = {
    watcher: {
      add: (paths) => {
        addedPaths.push(...[paths].flat())
      },
      on: (_event, callback) => {
        watcherCallbacks.push(callback)
      },
    },
    ws: {
      send: (payload) => {
        sentMessages.push(payload)
      },
    },
    pluginContainer: { resolveId: () => Promise.resolve(null) },
    moduleGraph: {
      getModuleById: () => null,
      invalidateAll: () => undefined,
      invalidateModule: () => undefined,
    },
    ssrLoadModule: () => Promise.resolve({ default: state.config }),
  }
  return { server, addedPaths, sentMessages, watcherCallbacks, state }
}

const originalCwd = process.cwd()
const dirs: string[] = []

beforeEach(() => {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'takibi-hono-vite-')))
  dirs.push(dir)
  process.chdir(dir)
  vi.mocked(hono).mockClear()
})

afterEach(() => {
  process.chdir(originalCwd)
  vi.restoreAllMocks()
  for (const dir of dirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true })
})

function write(file: string, content = '') {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, content)
}

describe('takibiHonoVite', () => {
  it('is a dev-only plugin whose buildStart does nothing', async () => {
    const plugin = takibiHonoVite()
    expect(plugin.name).toBe('takibi-hono-vite')
    await expect(plugin.buildStart()).resolves.toBe(undefined)
  })

  it('loads the config, watches it and its input documents, generates and reloads', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    const plugin = takibiHonoVite()
    const { server, addedPaths, sentMessages } = createMockServer()
    plugin.configureServer(server)

    await vi.waitFor(() => {
      expect(sentMessages).toStrictEqual([{ type: 'full-reload' }])
    })
    const cwd = process.cwd()
    expect(addedPaths).toStrictEqual([
      path.join(cwd, 'openapi.yaml'),
      path.join(cwd, '**/*.yaml'),
      path.join(cwd, '**/*.json'),
      path.join(cwd, '**/*.tsp'),
      path.join(cwd, 'takibi-hono.config.ts'),
    ])
    expect(vi.mocked(hono).mock.calls).toStrictEqual([[{ input: 'openapi.yaml', schema: 'zod' }]])
    expect(log.mock.calls).toStrictEqual([
      ['🔥 takibi-hono'],
      ['✅ takibi-hono: generated successfully'],
    ])
  })

  it.each([
    [
      'an invalid config',
      { ssrLoadModule: () => Promise.resolve({ default: { input: 'a.yaml', schema: 'yup' } }) },
      '❌ config: Invalid config: schema: Expected "zod" | "valibot" | "typebox" | "arktype" | "effect"',
    ],
    [
      'a config without a default export object',
      { ssrLoadModule: () => Promise.resolve({ default: 'x' }) },
      '❌ config: Config must export default object',
    ],
    [
      'a config that fails to load',
      { ssrLoadModule: () => Promise.reject(new Error('boom')) },
      '❌ config: boom',
    ],
  ])('reports %s and does not generate', async (_, override, message) => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const plugin = takibiHonoVite()
    const { server } = createMockServer()
    plugin.configureServer({ ...server, ...override })

    await vi.waitFor(() => {
      expect(error.mock.calls).toStrictEqual([[message]])
    })
    expect(vi.mocked(hono)).not.toHaveBeenCalled()
  })

  it('reports a generation failure as a log line', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    vi.mocked(hono).mockReturnValueOnce(Effect.fail(new OpenAPIError({ message: 'parse failed' })))
    const plugin = takibiHonoVite()
    const { server, sentMessages } = createMockServer()
    plugin.configureServer(server)

    await vi.waitFor(() => {
      expect(sentMessages.length).toBe(1)
    })
    expect(log.mock.calls.at(-1)).toStrictEqual(['❌ takibi-hono: parse failed'])
  })

  it('invalidates the cached config module before loading it', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined)
    const invalidated: unknown[] = []
    const plugin = takibiHonoVite()
    const { server, sentMessages } = createMockServer()
    const node = { id: 'config-module' }
    plugin.configureServer({
      ...server,
      pluginContainer: { resolveId: () => Promise.resolve({ id: 'config-module' }) },
      moduleGraph: {
        ...server.moduleGraph,
        getModuleById: (id: string) => (id === 'config-module' ? node : null),
        invalidateModule: (module: unknown) => {
          invalidated.push(module)
        },
      },
    })

    await vi.waitFor(() => {
      expect(sentMessages.length).toBe(1)
    })
    expect(invalidated).toStrictEqual([node])
  })

  it('regenerates once for a burst of input changes and ignores other files', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined)
    const plugin = takibiHonoVite()
    const { server, watcherCallbacks, sentMessages } = createMockServer()
    plugin.configureServer(server)
    await vi.waitFor(() => {
      expect(sentMessages.length).toBe(1)
    })
    const [onChange] = watcherCallbacks
    onChange?.('change', path.join(process.cwd(), 'src', 'handler.ts'))
    onChange?.('change', path.join(process.cwd(), 'openapi.yaml'))
    onChange?.('change', path.join(process.cwd(), 'spec', 'models.tsp'))

    await vi.waitFor(() => {
      expect(sentMessages.length).toBe(2)
    })
    expect(vi.mocked(hono)).toHaveBeenCalledTimes(2)
  })

  it('reloads the config when it changes, removing generated outputs it no longer names', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    const plugin = takibiHonoVite()
    const { server, sentMessages, state } = createMockServer({
      input: 'openapi.yaml',
      schema: 'zod',
      output: 'old/handlers',
      components: { output: 'old/components.ts' },
    })
    const cwd = process.cwd()
    write(path.join(cwd, 'old/handlers/users.ts'), 'handler body')
    write(path.join(cwd, 'old/components.ts'))
    plugin.configureServer(server)
    await vi.waitFor(() => {
      expect(sentMessages.length).toBe(1)
    })

    const next = {
      input: 'openapi.yaml',
      schema: 'valibot',
      output: 'new/handlers',
      components: { output: 'new/components.ts' },
    }
    state.config = next
    const configFile = path.join(cwd, 'takibi-hono.config.ts')
    expect(plugin.handleHotUpdate({ file: configFile, server })).toStrictEqual([])
    expect(plugin.handleHotUpdate({ file: 'src/other.ts', server })).toBe(undefined)

    await vi.waitFor(() => {
      expect(sentMessages.length).toBe(2)
    })
    expect(fs.existsSync(path.join(cwd, 'old/components.ts'))).toBe(false)
    expect(fs.readFileSync(path.join(cwd, 'old/handlers/users.ts'), 'utf8')).toBe('handler body')
    expect(log.mock.calls).toStrictEqual([
      ['🔥 takibi-hono'],
      ['✅ takibi-hono: generated successfully'],
      [`🧹 cleanup: ${path.join(cwd, 'old/components.ts')}`],
      ['🔥 takibi-hono'],
      ['✅ takibi-hono: generated successfully'],
    ])
    expect(vi.mocked(hono).mock.calls.at(-1)).toStrictEqual([next])
  })

  it('empties split directories before generating, leaving handlers and other files alone', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    const cwd = process.cwd()
    write(path.join(cwd, 'src/handlers/users.ts'), 'users handler body')
    write(path.join(cwd, 'src/handlers/pets.ts'), 'pets handler body')
    write(path.join(cwd, 'src/handlers/README.md'))
    write(path.join(cwd, 'src/schemas/user.ts'))
    write(path.join(cwd, 'src/responses.ts'))
    const plugin = takibiHonoVite()
    const { server, sentMessages } = createMockServer({
      input: 'openapi.yaml',
      schema: 'zod',
      output: 'src/handlers',
      components: {
        schemas: { output: 'src/schemas', split: true },
        responses: { output: 'src/responses.ts' },
      },
    })
    plugin.configureServer(server)

    await vi.waitFor(() => {
      expect(sentMessages.length).toBe(1)
    })
    expect(fs.readdirSync(path.join(cwd, 'src/handlers')).sort()).toStrictEqual([
      'README.md',
      'pets.ts',
      'users.ts',
    ])
    expect(fs.readFileSync(path.join(cwd, 'src/handlers/users.ts'), 'utf8')).toBe(
      'users handler body',
    )
    expect(fs.readFileSync(path.join(cwd, 'src/handlers/pets.ts'), 'utf8')).toBe(
      'pets handler body',
    )
    expect(fs.readdirSync(path.join(cwd, 'src/schemas'))).toStrictEqual([])
    expect(fs.existsSync(path.join(cwd, 'src/responses.ts'))).toBe(true)
    expect(log.mock.calls).toStrictEqual([
      ['🔥 takibi-hono'],
      ['🧹 schemas: cleaned 1 files'],
      ['✅ takibi-hono: generated successfully'],
    ])
  })
})
