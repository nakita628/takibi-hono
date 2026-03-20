import fsp from 'node:fs/promises'
import path from 'node:path'

import { afterEach, describe, expect, it, vi } from 'vite-plus/test'

import { takibiHonoVite } from './index.js'

type MockViteDevServer = {
  watcher: {
    add: (paths: string | readonly string[]) => void
    on: (event: string, callback: (eventType: string, filePath: string) => void) => void
  }
  ws: { send: (payload: unknown) => void }
  pluginContainer: { resolveId: (moduleId: string) => Promise<{ id: string } | null> }
  moduleGraph: {
    invalidateModule: (module: { id?: string } | null) => void
    invalidateAll: () => void
    getModuleById: (moduleId: string) => { id?: string } | null
  }
  ssrLoadModule: (moduleId: string) => Promise<{ [key: string]: unknown }>
}

// Mock core/index to avoid real file I/O during tests
vi.mock('../core/index.js', () => ({
  hono: vi.fn().mockResolvedValue({ ok: true }),
}))

// Mock node:fs/promises for split-mode cleanup tests
vi.mock('node:fs/promises', async (importOriginal) => {
  const actual = (await importOriginal()) as { [key: string]: unknown }
  return {
    ...actual,
    default: {
      ...(actual.default as { [key: string]: unknown }),
      stat: vi.fn().mockRejectedValue(new Error('ENOENT')),
      readdir: vi.fn().mockResolvedValue([]),
      unlink: vi.fn().mockResolvedValue(undefined),
      rm: vi.fn().mockResolvedValue(undefined),
    },
  }
})

/**
 * Creates a minimal mock ViteDevServer with tracking.
 */
function createMockServer(configOverride?: { [key: string]: unknown }) {
  const addedPaths: string[] = []
  const sentMessages: unknown[] = []
  const watcherCallbacks: Array<(eventType: string, filePath: string) => void> = []

  const server: MockViteDevServer = {
    watcher: {
      add(paths: string | readonly string[]) {
        if (Array.isArray(paths)) addedPaths.push(...paths)
        else addedPaths.push(paths as string)
      },
      on(_event: string, callback: (eventType: string, filePath: string) => void) {
        watcherCallbacks.push(callback)
      },
    },
    ws: {
      send(payload: unknown) {
        sentMessages.push(payload)
      },
    },
    pluginContainer: { resolveId: async () => null },
    moduleGraph: {
      getModuleById: () => null,
      invalidateAll() {},
      invalidateModule() {},
    },
    ssrLoadModule: async () => ({
      default: configOverride ?? {
        input: 'openapi.yaml',
        schema: 'zod',
      },
    }),
  }

  return {
    server,
    addedPaths,
    sentMessages,
    watcherCallbacks,
  }
}

afterEach(() => {
  vi.restoreAllMocks()
})

// ===================================================================
// 1. Plugin structure
// ===================================================================
describe('takibiHonoVite: plugin structure', () => {
  it.concurrent('returns plugin with name "takibi-hono-vite"', () => {
    const plugin = takibiHonoVite()
    expect(plugin.name).toBe('takibi-hono-vite')
  })

  it.concurrent('has configureServer function', () => {
    expect(typeof takibiHonoVite().configureServer).toBe('function')
  })

  it.concurrent('has handleHotUpdate function', () => {
    expect(typeof takibiHonoVite().handleHotUpdate).toBe('function')
  })

  it.concurrent('has buildStart function', () => {
    expect(typeof takibiHonoVite().buildStart).toBe('function')
  })

  it.concurrent('each call returns independent plugin instance', () => {
    const a = takibiHonoVite()
    const b = takibiHonoVite()
    expect(a).not.toBe(b)
    expect(a.name).toBe(b.name)
  })

  it.concurrent('buildStart does not throw when config is missing', async () => {
    const plugin = takibiHonoVite()
    await expect(plugin.buildStart()).resolves.toBe(undefined)
  })
})

// ===================================================================
// 2. handleHotUpdate
// ===================================================================
describe('takibiHonoVite: handleHotUpdate', () => {
  it.concurrent('returns empty array for config file (suppresses HMR)', () => {
    const plugin = takibiHonoVite()
    const configPath = path.resolve(process.cwd(), 'takibi-hono.config.ts')
    const { server } = createMockServer()
    expect(plugin.handleHotUpdate({ file: configPath, server })).toStrictEqual([])
  })

  it.concurrent('returns undefined for non-config .ts file', () => {
    const plugin = takibiHonoVite()
    expect(plugin.handleHotUpdate({ file: '/some/random/file.ts', server: {} })).toBe(undefined)
  })

  it.concurrent('returns undefined for .yaml file (handled by watcher, not HMR)', () => {
    const plugin = takibiHonoVite()
    expect(plugin.handleHotUpdate({ file: '/project/openapi.yaml', server: {} })).toBe(undefined)
  })

  it.concurrent('returns undefined for .json file', () => {
    const plugin = takibiHonoVite()
    expect(plugin.handleHotUpdate({ file: '/project/openapi.json', server: {} })).toBe(undefined)
  })

  it.concurrent('returns undefined for .tsp file', () => {
    const plugin = takibiHonoVite()
    expect(plugin.handleHotUpdate({ file: '/project/main.tsp', server: {} })).toBe(undefined)
  })

  it.concurrent('returns undefined for unrelated absolute path', () => {
    const plugin = takibiHonoVite()
    expect(plugin.handleHotUpdate({ file: '/tmp/other.ts', server: {} })).toBe(undefined)
  })

  it.concurrent('returns undefined for similarly named config in different directory', () => {
    const plugin = takibiHonoVite()
    expect(
      plugin.handleHotUpdate({
        file: '/other/project/takibi-hono.config.ts',
        server: {},
      }),
    ).toBe(undefined)
  })

  it.concurrent('detects config file via path.resolve normalization', () => {
    const plugin = takibiHonoVite()
    // Using relative path that resolves to CWD config
    const configPath = path.resolve('./takibi-hono.config.ts')
    const { server } = createMockServer()
    expect(plugin.handleHotUpdate({ file: configPath, server })).toStrictEqual([])
  })

  it.concurrent('independent instances do not interfere', () => {
    const pluginA = takibiHonoVite()
    const pluginB = takibiHonoVite()
    const configPath = path.resolve(process.cwd(), 'takibi-hono.config.ts')
    const { server } = createMockServer()

    // Both should detect the same config path independently
    expect(pluginA.handleHotUpdate({ file: configPath, server })).toStrictEqual([])
    expect(pluginB.handleHotUpdate({ file: configPath, server })).toStrictEqual([])

    // Non-config file should return undefined for both
    expect(pluginA.handleHotUpdate({ file: '/other.ts', server: {} })).toBe(undefined)
    expect(pluginB.handleHotUpdate({ file: '/other.ts', server: {} })).toBe(undefined)
  })
})

// ===================================================================
// 3. configureServer
// ===================================================================
describe('takibiHonoVite: configureServer', () => {
  it('registers watcher.on callback', async () => {
    const plugin = takibiHonoVite()
    const { server, watcherCallbacks } = createMockServer()
    plugin.configureServer(server)
    // Wait for async IIFE to complete
    await vi.waitFor(() => {
      expect(watcherCallbacks.length).toBe(1)
    })
  })

  it('adds config file to watcher', async () => {
    const plugin = takibiHonoVite()
    const { server, addedPaths } = createMockServer()
    plugin.configureServer(server)

    const absoluteConfigPath = path.resolve(process.cwd(), 'takibi-hono.config.ts')
    await vi.waitFor(() => {
      expect(addedPaths).toContain(absoluteConfigPath)
    })
  })

  it('adds input file and glob patterns to watcher', async () => {
    const plugin = takibiHonoVite()
    const { server, addedPaths } = createMockServer({ input: 'spec/openapi.yaml', schema: 'zod' })
    plugin.configureServer(server)

    const inputDir = path.resolve(process.cwd(), 'spec')
    const absoluteInput = path.resolve(process.cwd(), 'spec/openapi.yaml')
    await vi.waitFor(() => {
      expect(addedPaths).toContain(absoluteInput)
      expect(addedPaths).toContain(path.join(inputDir, '**/*.yaml'))
      expect(addedPaths).toContain(path.join(inputDir, '**/*.json'))
      expect(addedPaths).toContain(path.join(inputDir, '**/*.tsp'))
    })
  })

  it('sends full-reload after initial generation', async () => {
    const plugin = takibiHonoVite()
    const { server, sentMessages } = createMockServer()
    plugin.configureServer(server)

    await vi.waitFor(() => {
      expect(sentMessages).toStrictEqual([{ type: 'full-reload' }])
    })
  })

  it('calls hono() with config from ssrLoadModule', async () => {
    const { hono } = await import('../core/index.js')
    const plugin = takibiHonoVite()
    const { server } = createMockServer({ input: 'api.yaml', schema: 'arktype' })
    plugin.configureServer(server)

    await vi.waitFor(() => {
      expect(hono).toHaveBeenCalledWith(
        expect.objectContaining({
          input: 'api.yaml',
          schema: 'arktype',
        }),
      )
    })
  })

  it('handles invalid config gracefully (does not throw)', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const plugin = takibiHonoVite()
    const { server } = createMockServer({ input: 'invalid.txt', schema: 'zod' })
    plugin.configureServer(server)

    await vi.waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('❌ config:'))
    })
  })

  it('handles ssrLoadModule returning non-object gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const plugin = takibiHonoVite()
    const { server } = createMockServer()
    server.ssrLoadModule = async () => ({ default: 'not-an-object' })
    plugin.configureServer(server)

    await vi.waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('❌ config:'))
    })
  })

  it('handles ssrLoadModule returning null default gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const plugin = takibiHonoVite()
    const { server } = createMockServer()
    server.ssrLoadModule = async () => ({ default: null })
    plugin.configureServer(server)

    await vi.waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('❌ config:'))
    })
  })

  it('handles ssrLoadModule throwing error gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const plugin = takibiHonoVite()
    const { server } = createMockServer()
    server.ssrLoadModule = async () => {
      throw new Error('Module not found')
    }
    plugin.configureServer(server)

    await vi.waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('❌ config:'))
    })
  })

  it('uses cache-bust query param for ssrLoadModule', async () => {
    const plugin = takibiHonoVite()
    const loadCalls: string[] = []
    const { server } = createMockServer()
    server.ssrLoadModule = async (moduleId: string) => {
      loadCalls.push(moduleId)
      return { default: { input: 'openapi.yaml', schema: 'zod' } }
    }
    plugin.configureServer(server)

    const configPath = path.resolve(process.cwd(), 'takibi-hono.config.ts')
    await vi.waitFor(() => {
      expect(loadCalls.length).toBe(1)
      expect(loadCalls[0]).toMatch(
        new RegExp(`^${configPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\?t=\\d+$`),
      )
    })
  })

  it('invalidates module cache when resolveId returns a module', async () => {
    const invalidatedModules: unknown[] = []
    const plugin = takibiHonoVite()
    const { server } = createMockServer()
    const moduleNode = { id: 'test-module-id' }
    server.pluginContainer.resolveId = async () => ({ id: 'test-module-id' })
    server.moduleGraph.getModuleById = (id: string) => (id === 'test-module-id' ? moduleNode : null)
    server.moduleGraph.invalidateModule = (mod: unknown) => {
      invalidatedModules.push(mod)
    }
    plugin.configureServer(server)

    await vi.waitFor(() => {
      expect(invalidatedModules).toStrictEqual([moduleNode])
    })
  })

  it('calls invalidateAll when resolveId returns null', async () => {
    let invalidateAllCalled = false
    const plugin = takibiHonoVite()
    const { server } = createMockServer()
    server.pluginContainer.resolveId = async () => null
    server.moduleGraph.invalidateAll = () => {
      invalidateAllCalled = true
    }
    plugin.configureServer(server)

    await vi.waitFor(() => {
      expect(invalidateAllCalled).toBe(true)
    })
  })
})

// ===================================================================
// 4. configureServer: watcher callback behavior
// ===================================================================
describe('takibiHonoVite: watcher callback', () => {
  it('triggers regeneration for input .yaml file change', async () => {
    const { hono } = await import('../core/index.js')
    const plugin = takibiHonoVite()
    const { server, watcherCallbacks, sentMessages } = createMockServer()
    plugin.configureServer(server)

    await vi.waitFor(() => {
      expect(watcherCallbacks.length).toBe(1)
    })

    // Clear initial generation tracking
    vi.mocked(hono).mockClear()
    sentMessages.length = 0

    // Simulate input file change
    const inputDir = path.resolve(process.cwd())
    watcherCallbacks[0]('change', path.join(inputDir, 'openapi.yaml'))

    // Wait for debounce (200ms) + execution
    await vi.waitFor(
      () => {
        expect(hono).toHaveBeenCalled()
      },
      { timeout: 1000 },
    )
  })

  it('triggers regeneration for .tsp file in input directory', async () => {
    const { hono } = await import('../core/index.js')
    const plugin = takibiHonoVite()
    const { server, watcherCallbacks } = createMockServer({
      input: 'specs/main.tsp',
      schema: 'arktype',
    })
    plugin.configureServer(server)

    await vi.waitFor(() => {
      expect(watcherCallbacks.length).toBe(1)
    })

    vi.mocked(hono).mockClear()

    const specsDir = path.resolve(process.cwd(), 'specs')
    watcherCallbacks[0]('change', path.join(specsDir, 'models.tsp'))

    await vi.waitFor(
      () => {
        expect(hono).toHaveBeenCalled()
      },
      { timeout: 1000 },
    )
  })

  it('does not trigger regeneration for unrelated file changes', async () => {
    const { hono } = await import('../core/index.js')
    const plugin = takibiHonoVite()
    const { server, watcherCallbacks } = createMockServer()
    plugin.configureServer(server)

    await vi.waitFor(() => {
      expect(watcherCallbacks.length).toBe(1)
    })

    vi.mocked(hono).mockClear()

    // Simulate change to unrelated file
    watcherCallbacks[0]('change', '/some/other/file.ts')

    // Wait a bit to confirm no regeneration is triggered
    await new Promise((r) => setTimeout(r, 400))
    expect(hono).not.toHaveBeenCalled()
  })

  it('does not trigger regeneration for .ts file in input directory', async () => {
    const { hono } = await import('../core/index.js')
    const plugin = takibiHonoVite()
    const { server, watcherCallbacks } = createMockServer()
    plugin.configureServer(server)

    await vi.waitFor(() => {
      expect(watcherCallbacks.length).toBe(1)
    })

    vi.mocked(hono).mockClear()

    const inputDir = path.resolve(process.cwd())
    watcherCallbacks[0]('change', path.join(inputDir, 'handler.ts'))

    await new Promise((r) => setTimeout(r, 400))
    expect(hono).not.toHaveBeenCalled()
  })

  it('triggers config reload when config file changes via watcher', async () => {
    const plugin = takibiHonoVite()
    const loadCalls: string[] = []
    const { server, watcherCallbacks } = createMockServer()
    server.ssrLoadModule = async (moduleId: string) => {
      loadCalls.push(moduleId)
      return { default: { input: 'openapi.yaml', schema: 'zod' } }
    }
    plugin.configureServer(server)

    await vi.waitFor(() => {
      expect(watcherCallbacks.length).toBe(1)
      expect(loadCalls.length).toBe(1)
    })

    // Simulate config file change via watcher
    const configPath = path.resolve(process.cwd(), 'takibi-hono.config.ts')
    watcherCallbacks[0]('change', configPath)

    await vi.waitFor(() => {
      // Second load call = config was re-read
      expect(loadCalls.length).toBe(2)
    })
  })

  it('debounces rapid input file changes', async () => {
    const { hono } = await import('../core/index.js')
    const plugin = takibiHonoVite()
    const { server, watcherCallbacks } = createMockServer()
    plugin.configureServer(server)

    await vi.waitFor(() => {
      expect(watcherCallbacks.length).toBe(1)
    })

    vi.mocked(hono).mockClear()

    const inputDir = path.resolve(process.cwd())
    const yamlPath = path.join(inputDir, 'openapi.yaml')

    // Fire 5 rapid changes
    watcherCallbacks[0]('change', yamlPath)
    watcherCallbacks[0]('change', yamlPath)
    watcherCallbacks[0]('change', yamlPath)
    watcherCallbacks[0]('change', yamlPath)
    watcherCallbacks[0]('change', yamlPath)

    await vi.waitFor(
      () => {
        expect(hono).toHaveBeenCalled()
      },
      { timeout: 1000 },
    )

    // Debounce should collapse 5 changes into 1 generation
    expect(vi.mocked(hono).mock.calls.length).toBe(1)
  })
})

// ===================================================================
// 5. configureServer: schema library variants
// ===================================================================
describe('takibiHonoVite: schema library configs', () => {
  const schemaLibs = ['zod', 'valibot', 'typebox', 'arktype', 'effect'] as const

  for (const schemaLib of schemaLibs) {
    it(`passes ${schemaLib} schema config to hono()`, async () => {
      const { hono } = await import('../core/index.js')
      vi.mocked(hono).mockClear()

      const plugin = takibiHonoVite()
      const { server } = createMockServer({ input: 'openapi.yaml', schema: schemaLib })
      plugin.configureServer(server)

      await vi.waitFor(() => {
        expect(hono).toHaveBeenCalledWith(expect.objectContaining({ schema: schemaLib }))
      })
    })
  }
})

// ===================================================================
// 6. runGeneration: split-mode cleanup
// ===================================================================
describe('takibiHonoVite: split-mode cleanup', () => {
  it('cleans handlers directory before regeneration when output is a directory', async () => {
    const { hono } = await import('../core/index.js')
    vi.mocked(hono).mockClear()

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    const handlersDir = path.resolve(process.cwd(), 'src/handlers')
    const mockDirEntry = (name: string) => ({
      name,
      isFile: () => true,
      isDirectory: () => false,
      isBlockDevice: () => false,
      isCharacterDevice: () => false,
      isFIFO: () => false,
      isSocket: () => false,
      isSymbolicLink: () => false,
      parentPath: handlersDir,
      path: handlersDir,
    })

    vi.mocked(fsp.stat).mockImplementation(async (p) => {
      if (String(p) === handlersDir) {
        return { isDirectory: () => true, isFile: () => false } as any
      }
      throw new Error('ENOENT')
    })
    vi.mocked(fsp.readdir).mockResolvedValue([
      mockDirEntry('users.ts') as any,
      mockDirEntry('pets.ts') as any,
    ])
    vi.mocked(fsp.unlink).mockResolvedValue(undefined)

    const plugin = takibiHonoVite()
    const { server } = createMockServer({
      input: 'openapi.yaml',
      schema: 'zod',
      'takibi-hono': {
        handlers: { output: 'src/handlers' },
      },
    })
    plugin.configureServer(server)

    await vi.waitFor(() => {
      expect(hono).toHaveBeenCalled()
    })

    expect(fsp.unlink).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })

  it('cleans split component directories before regeneration', async () => {
    const { hono } = await import('../core/index.js')
    vi.mocked(hono).mockClear()

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    const schemasDir = path.resolve(process.cwd(), 'src/schemas')
    const mockDirEntry = (name: string) => ({
      name,
      isFile: () => true,
      isDirectory: () => false,
      isBlockDevice: () => false,
      isCharacterDevice: () => false,
      isFIFO: () => false,
      isSocket: () => false,
      isSymbolicLink: () => false,
      parentPath: schemasDir,
      path: schemasDir,
    })

    vi.mocked(fsp.stat).mockImplementation(async (p) => {
      if (String(p) === schemasDir) {
        return { isDirectory: () => true, isFile: () => false } as any
      }
      throw new Error('ENOENT')
    })
    vi.mocked(fsp.readdir).mockResolvedValue([
      mockDirEntry('user.ts') as any,
      mockDirEntry('pet.ts') as any,
      mockDirEntry('index.ts') as any,
    ])
    vi.mocked(fsp.unlink).mockResolvedValue(undefined)

    const plugin = takibiHonoVite()
    const { server } = createMockServer({
      input: 'openapi.yaml',
      schema: 'zod',
      'takibi-hono': {
        components: {
          schemas: { output: 'src/schemas', split: true },
        },
      },
    })
    plugin.configureServer(server)

    await vi.waitFor(() => {
      expect(hono).toHaveBeenCalled()
    })

    expect(fsp.unlink).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })

  it('skips cleanup when handlers output is a .ts file (not a directory)', async () => {
    const { hono } = await import('../core/index.js')
    vi.mocked(hono).mockClear()
    vi.mocked(fsp.stat).mockRejectedValue(new Error('ENOENT'))
    vi.mocked(fsp.readdir).mockClear()
    vi.mocked(fsp.readdir).mockResolvedValue([])

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    const plugin = takibiHonoVite()
    const { server } = createMockServer({
      input: 'openapi.yaml',
      schema: 'zod',
      'takibi-hono': {
        handlers: { output: 'src/handlers.ts' },
      },
    })
    plugin.configureServer(server)

    await vi.waitFor(() => {
      expect(hono).toHaveBeenCalled()
    })

    // readdir should not be called since handlers.ts is a file (ends with .ts), not a directory
    expect(fsp.readdir).not.toHaveBeenCalled()
    consoleSpy.mockRestore()
  })

  it('handles hono() returning error result', async () => {
    const { hono } = await import('../core/index.js')
    vi.mocked(hono).mockResolvedValueOnce({ ok: false, error: 'parse error' })

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    const plugin = takibiHonoVite()
    const { server } = createMockServer()
    plugin.configureServer(server)

    await vi.waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('❌ takibi-hono: parse error'),
      )
    })

    consoleSpy.mockRestore()
  })
})

// ===================================================================
// 7. handleConfigChange: stale output cleanup
// ===================================================================
describe('takibiHonoVite: config change cleanup', () => {
  it('cleans stale outputs when config changes output paths', async () => {
    const { hono } = await import('../core/index.js')
    vi.mocked(hono).mockClear()

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    let loadCount = 0
    const plugin = takibiHonoVite()
    const { server, watcherCallbacks } = createMockServer()

    const oldHandlersPath = path.resolve(process.cwd(), 'src/old-handlers')

    // First config load returns old config, second returns new config
    server.ssrLoadModule = async () => {
      loadCount++
      if (loadCount === 1) {
        return {
          default: {
            input: 'openapi.yaml',
            schema: 'zod',
            'takibi-hono': {
              handlers: { output: 'src/old-handlers' },
            },
          },
        }
      }
      return {
        default: {
          input: 'openapi.yaml',
          schema: 'zod',
          'takibi-hono': {
            handlers: { output: 'src/new-handlers' },
          },
        },
      }
    }

    // Mock: old-handlers is a directory that exists
    vi.mocked(fsp.stat).mockImplementation(async (p) => {
      if (String(p) === oldHandlersPath) {
        return { isDirectory: () => true, isFile: () => false } as any
      }
      throw new Error('ENOENT')
    })

    plugin.configureServer(server)

    await vi.waitFor(() => {
      expect(watcherCallbacks.length).toBe(1)
      expect(loadCount).toBe(1)
    })

    // Simulate config file change via watcher
    const configPath = path.resolve(process.cwd(), 'takibi-hono.config.ts')
    watcherCallbacks[0]('change', configPath)

    await vi.waitFor(() => {
      expect(loadCount).toBe(2)
    })

    // Old handler directory should have been cleaned up
    expect(fsp.rm).toHaveBeenCalledWith(oldHandlersPath, { recursive: true, force: true })
    consoleSpy.mockRestore()
  })

  it('handles config change error gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    let loadCount = 0
    const plugin = takibiHonoVite()
    const { server, watcherCallbacks } = createMockServer()
    server.ssrLoadModule = async () => {
      loadCount++
      if (loadCount === 1) {
        return { default: { input: 'openapi.yaml', schema: 'zod' } }
      }
      // Second load returns invalid config
      return { default: { input: 'invalid.txt', schema: 'zod' } }
    }
    plugin.configureServer(server)

    await vi.waitFor(() => {
      expect(watcherCallbacks.length).toBe(1)
    })

    const configPath = path.resolve(process.cwd(), 'takibi-hono.config.ts')
    watcherCallbacks[0]('change', configPath)

    await vi.waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('❌ config:'))
    })

    consoleSpy.mockRestore()
  })

  it('cleans stale .ts file outputs when config changes', async () => {
    const { hono } = await import('../core/index.js')
    vi.mocked(hono).mockClear()

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    let loadCount = 0
    const plugin = takibiHonoVite()
    const { server, watcherCallbacks } = createMockServer()

    const oldSchemasPath = path.resolve(process.cwd(), 'src/old-schemas.ts')

    server.ssrLoadModule = async () => {
      loadCount++
      if (loadCount === 1) {
        return {
          default: {
            input: 'openapi.yaml',
            schema: 'zod',
            'takibi-hono': {
              components: {
                schemas: { output: 'src/old-schemas.ts' },
              },
            },
          },
        }
      }
      return {
        default: {
          input: 'openapi.yaml',
          schema: 'zod',
          'takibi-hono': {
            components: {
              schemas: { output: 'src/new-schemas.ts' },
            },
          },
        },
      }
    }

    // Mock: old-schemas.ts is a file that exists
    vi.mocked(fsp.stat).mockImplementation(async (p) => {
      if (String(p) === oldSchemasPath) {
        return { isDirectory: () => false, isFile: () => true } as any
      }
      throw new Error('ENOENT')
    })
    vi.mocked(fsp.unlink).mockResolvedValue(undefined)

    plugin.configureServer(server)

    await vi.waitFor(() => {
      expect(watcherCallbacks.length).toBe(1)
      expect(loadCount).toBe(1)
    })

    const configPath = path.resolve(process.cwd(), 'takibi-hono.config.ts')
    watcherCallbacks[0]('change', configPath)

    await vi.waitFor(() => {
      expect(loadCount).toBe(2)
    })

    // Old schemas .ts file should have been cleaned up via unlink
    expect(fsp.unlink).toHaveBeenCalledWith(oldSchemasPath)
    consoleSpy.mockRestore()
  })

  it('skips stale path cleanup when stat returns non-file non-directory', async () => {
    const { hono } = await import('../core/index.js')
    vi.mocked(hono).mockClear()

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    let loadCount = 0
    const plugin = takibiHonoVite()
    const { server, watcherCallbacks } = createMockServer()

    const oldPath = path.resolve(process.cwd(), 'src/old-output')

    server.ssrLoadModule = async () => {
      loadCount++
      if (loadCount === 1) {
        return {
          default: {
            input: 'openapi.yaml',
            schema: 'zod',
            'takibi-hono': {
              handlers: { output: 'src/old-output' },
            },
          },
        }
      }
      return {
        default: {
          input: 'openapi.yaml',
          schema: 'zod',
          'takibi-hono': {
            handlers: { output: 'src/new-output' },
          },
        },
      }
    }

    // Mock: path exists but is neither directory nor file (e.g., socket)
    vi.mocked(fsp.stat).mockImplementation(async (p) => {
      if (String(p) === oldPath) {
        return { isDirectory: () => false, isFile: () => false } as any
      }
      throw new Error('ENOENT')
    })

    plugin.configureServer(server)

    await vi.waitFor(() => {
      expect(watcherCallbacks.length).toBe(1)
    })

    vi.mocked(fsp.rm).mockClear()
    vi.mocked(fsp.unlink).mockClear()

    const configPath = path.resolve(process.cwd(), 'takibi-hono.config.ts')
    watcherCallbacks[0]('change', configPath)

    await vi.waitFor(() => {
      expect(loadCount).toBe(2)
    })

    // Neither rm nor unlink should be called for non-file non-directory
    expect(fsp.rm).not.toHaveBeenCalled()
    expect(fsp.unlink).not.toHaveBeenCalled()
    consoleSpy.mockRestore()
  })

  it('handles handleHotUpdate config change error without crashing', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const plugin = takibiHonoVite()
    const configPath = path.resolve(process.cwd(), 'takibi-hono.config.ts')

    const mockServer = {
      watcher: { add() {}, on() {} },
      ws: { send() {} },
      pluginContainer: {
        resolveId: async () => {
          throw new Error('resolveId failed')
        },
      },
      moduleGraph: { getModuleById: () => null, invalidateAll() {}, invalidateModule() {} },
      ssrLoadModule: async () => {
        throw new Error('ssrLoad failed')
      },
    }

    const result = plugin.handleHotUpdate({ file: configPath, server: mockServer })
    expect(result).toStrictEqual([])

    // Wait for async error handling
    await vi.waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('❌ config:'))
    })

    consoleSpy.mockRestore()
  })
})
