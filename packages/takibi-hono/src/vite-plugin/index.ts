import fsp from 'node:fs/promises'
import path from 'node:path'

import { parseConfig } from '../config/index.js'
import { hono } from '../core/index.js'

type Config = Extract<ReturnType<typeof parseConfig>, { ok: true }>['value']

type ViteDevServer = {
  watcher: {
    add: (paths: string | readonly string[]) => void
    on: (event: 'all', callback: (eventType: string, filePath: string) => void) => void
  }
  ws: { send: (payload: { type: string; [k: string]: unknown }) => void }
  pluginContainer: { resolveId: (moduleId: string) => Promise<{ id: string } | null> }
  moduleGraph: {
    invalidateModule: (module: { id?: string } | null) => void
    invalidateAll: () => void
    getModuleById: (moduleId: string) => { id?: string } | null
  }
  ssrLoadModule: (moduleId: string) => Promise<{ [k: string]: unknown }>
}

function toAbsolutePath(relativePath: string) {
  return path.resolve(process.cwd(), relativePath)
}

function isInputFile(filePath: string, inputDirectory: string) {
  return (
    filePath.startsWith(inputDirectory) &&
    (filePath.endsWith('.yaml') || filePath.endsWith('.json') || filePath.endsWith('.tsp'))
  )
}

function debounce(delayMs: number, callback: () => void) {
  const timerStorage = new WeakMap<() => void, ReturnType<typeof setTimeout>>()
  const wrapped = () => {
    const prev = timerStorage.get(wrapped)
    if (prev !== undefined) clearTimeout(prev)
    timerStorage.set(wrapped, setTimeout(callback, delayMs))
  }
  return wrapped
}

async function listTypeScriptFilesShallow(directoryPath: string): Promise<string[]> {
  return fsp
    .stat(directoryPath)
    .then((stats) =>
      stats.isDirectory()
        ? fsp
            .readdir(directoryPath, { withFileTypes: true })
            .then((entries) =>
              entries
                .filter((e) => e.isFile() && e.name.endsWith('.ts'))
                .map((e) => path.join(directoryPath, e.name)),
            )
        : [],
    )
    .catch(() => [])
}

async function deleteTypeScriptFiles(filePaths: readonly string[]) {
  const results = await Promise.all(
    filePaths.map((fp) =>
      fsp
        .unlink(fp)
        .then(() => fp)
        .catch(() => null),
    ),
  )
  return results.filter((r) => r !== null)
}

function isComponentConfig(v: unknown): v is { readonly output: string } {
  return typeof v === 'object' && v !== null && 'output' in v && typeof v.output === 'string'
}

function extractOutputPaths(config: Config) {
  const takibiHono = config['takibi-hono']
  const componentOutputs = Object.entries(takibiHono?.components ?? {})
    .filter(([k, v]) => k !== 'output' && isComponentConfig(v))
    .map(([, v]) => (isComponentConfig(v) ? v.output : undefined))
  const baseOutput =
    typeof takibiHono?.components?.output === 'string' ? [takibiHono.components.output] : []
  return [takibiHono?.handlers?.output, ...componentOutputs, ...baseOutput]
    .filter((p) => p !== undefined)
    .map(toAbsolutePath)
}

async function cleanupStaleOutputs(previousConfig: Config, currentConfig: Config) {
  const previousPaths = new Set(extractOutputPaths(previousConfig))
  const currentPaths = new Set(extractOutputPaths(currentConfig))
  const stalePaths = [...previousPaths].filter((p) => !currentPaths.has(p))
  const results = await Promise.all(
    stalePaths.map(async (stalePath) => {
      const stats = await fsp.stat(stalePath).catch(() => null)
      if (!stats) return null
      if (stats.isDirectory()) {
        await fsp.rm(stalePath, { recursive: true, force: true }).catch(() => {})
        return stalePath
      }
      if (stats.isFile() && stalePath.endsWith('.ts')) {
        await fsp.unlink(stalePath).catch(() => {})
        return stalePath
      }
      return null
    }),
  )
  return results.filter((r) => r !== null)
}

async function readConfigWithHotReload(server: ViteDevServer) {
  const absoluteConfigPath = toAbsolutePath('takibi-hono.config.ts')
  try {
    const resolved = await server.pluginContainer.resolveId(absoluteConfigPath)
    const moduleId = resolved?.id
    if (moduleId) {
      const moduleNode = server.moduleGraph.getModuleById(moduleId)
      if (moduleNode) server.moduleGraph.invalidateModule(moduleNode)
    } else {
      server.moduleGraph.invalidateAll()
    }
    const loadedModule = await server.ssrLoadModule(`${absoluteConfigPath}?t=${Date.now()}`)
    const defaultExport = loadedModule?.default
    if (typeof defaultExport !== 'object' || defaultExport === null) {
      return { ok: false, error: 'Config must export default object' } as const
    }
    return parseConfig(defaultExport)
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) } as const
  }
}

async function runGeneration(config: Config) {
  // Clean up split directories before regeneration
  const components = config['takibi-hono']?.components ?? {}
  const splitCleanups: Promise<string | null>[] = []
  for (const [k, cfg] of Object.entries(components)) {
    if (k === 'output') continue
    if (!isComponentConfig(cfg)) continue
    if (!('split' in cfg) || cfg.split !== true) continue
    if (cfg.output.endsWith('.ts')) continue
    const name = k
    const absDir = toAbsolutePath(cfg.output)
    splitCleanups.push(
      (async () => {
        const files = await listTypeScriptFilesShallow(absDir)
        const deleted = await deleteTypeScriptFiles(files)
        return deleted.length > 0 ? `🧹 ${name}: cleaned ${deleted.length} files` : null
      })(),
    )
  }
  const handlersCfg = config['takibi-hono']?.handlers
  if (handlersCfg?.output && !handlersCfg.output.endsWith('.ts')) {
    splitCleanups.push(
      (async () => {
        const absDir = toAbsolutePath(handlersCfg.output)
        const files = await listTypeScriptFilesShallow(absDir)
        const deleted = await deleteTypeScriptFiles(files)
        return deleted.length > 0 ? `🧹 handlers: cleaned ${deleted.length} files` : null
      })(),
    )
  }
  const cleanupLogs = (await Promise.all(splitCleanups)).filter((l) => l !== null)
  const result = await hono({
    input: config.input,
    schema: config.schema,
    format: config.format,
    openapi: config.openapi,
    'takibi-hono': config['takibi-hono'],
  })
  return {
    logs: [
      ...cleanupLogs,
      result.ok ? '✅ takibi-hono: generated successfully' : `❌ takibi-hono: ${result.error}`,
    ],
  }
}

function addInputGlobsToWatcher(server: ViteDevServer, absoluteInputPath: string) {
  const inputDirectory = path.dirname(absoluteInputPath)
  server.watcher.add([
    absoluteInputPath,
    path.join(inputDirectory, '**/*.yaml'),
    path.join(inputDirectory, '**/*.json'),
    path.join(inputDirectory, '**/*.tsp'),
  ])
  return inputDirectory
}

export function takibiHonoVite(): any {
  const pluginState: {
    current: Config | null
    previous: Config | null
    inputDirectory: string | null
  } = {
    current: null,
    previous: null,
    inputDirectory: null,
  }
  const absoluteConfigFilePath = toAbsolutePath('takibi-hono.config.ts')
  const runGenerationAndReload = async (server?: ViteDevServer) => {
    if (!pluginState.current) return
    console.log('🔥 takibi-hono')
    const { logs } = await runGeneration(pluginState.current)
    for (const log of logs) console.log(log)
    if (server) server.ws.send({ type: 'full-reload' })
  }
  const handleConfigChange = async (server: ViteDevServer) => {
    const nextConfig = await readConfigWithHotReload(server)
    if (!nextConfig.ok) {
      console.error(`❌ config: ${nextConfig.error}`)
      return
    }
    if (pluginState.current) {
      const cleaned = await cleanupStaleOutputs(pluginState.current, nextConfig.value)
      for (const p of cleaned) console.log(`🧹 cleanup: ${p}`)
    }
    l
    pluginState.previous = pluginState.current
    pluginState.current = nextConfig.value
    pluginState.inputDirectory = addInputGlobsToWatcher(
      server,
      toAbsolutePath(pluginState.current.input),
    )
    await runGenerationAndReload(server)
  }

  return {
    name: 'takibi-hono-vite',

    handleHotUpdate(context: { file: string; server: ViteDevServer }) {
      if (path.resolve(context.file) === absoluteConfigFilePath) {
        handleConfigChange(context.server).catch((err) =>
          console.error('❌ hot-update error:', err),
        )
        return []
      }
      return
    },
    async buildStart() {
      // Dev-only: handled by configureServer
    },
    configureServer(server: ViteDevServer) {
      ;(async () => {
        const initialConfig = await readConfigWithHotReload(server)
        if (!initialConfig.ok) {
          console.error(`❌ config: ${initialConfig.error}`)
          return
        }
        pluginState.current = initialConfig.value

        pluginState.inputDirectory = addInputGlobsToWatcher(
          server,
          toAbsolutePath(pluginState.current.input),
        )
        server.watcher.add(absoluteConfigFilePath)
        const debouncedRegenerate = debounce(200, () => void runGenerationAndReload(server))
        server.watcher.on('all', async (_eventType, filePath) => {
          const absoluteChanged = path.resolve(filePath)
          if (absoluteChanged === absoluteConfigFilePath) {
            await handleConfigChange(server)
            return
          }
          if (
            pluginState.inputDirectory &&
            isInputFile(absoluteChanged, pluginState.inputDirectory)
          ) {
            debouncedRegenerate()
          }
        })
        await runGenerationAndReload(server)
      })().catch((err) => console.error('❌ watch error:', err))
    },
  }
}
