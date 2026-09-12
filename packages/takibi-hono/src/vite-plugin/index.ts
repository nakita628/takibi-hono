// oxlint-disable no-console -- the plugin reports generation progress to the Vite terminal
import path from 'node:path'

import { Console, Effect, FileSystem, Result } from 'effect'

import type { Config } from '../config/index.js'
import { ConfigError, DEFAULT_CONFIG_FILE, parseConfig } from '../config/index.js'
import { hono } from '../core/index.js'
import { fileSystemLayer } from '../file/index.js'

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

function toConfigError(error: unknown) {
  return new ConfigError({ message: error instanceof Error ? error.message : String(error) })
}

/**
 * Loads the config through Vite's module graph, invalidating the cached copy first so an
 * edit to the config file is seen.
 */
function readConfigWithHotReload(server: ViteDevServer) {
  return Effect.gen(function* () {
    const absoluteConfigPath = toAbsolutePath(DEFAULT_CONFIG_FILE)
    const resolved = yield* Effect.tryPromise({
      try: () => server.pluginContainer.resolveId(absoluteConfigPath),
      catch: toConfigError,
    })
    const moduleNode = resolved ? server.moduleGraph.getModuleById(resolved.id) : undefined
    if (moduleNode) server.moduleGraph.invalidateModule(moduleNode)
    if (!resolved) server.moduleGraph.invalidateAll()
    const loadedModule = yield* Effect.tryPromise({
      try: () => server.ssrLoadModule(`${absoluteConfigPath}?t=${String(Date.now())}`),
      catch: toConfigError,
    })
    const defaultExport = loadedModule.default
    if (typeof defaultExport !== 'object' || defaultExport === null) {
      return yield* new ConfigError({ message: 'Config must export default object' })
    }
    return yield* parseConfig(defaultExport)
  })
}

/**
 * Every filesystem question the plugin asks is advisory — it decides what to clean up,
 * never whether the build is valid — so a path it cannot read reads as absent and the dev
 * server keeps running.
 */
function statOrNull(target: string) {
  return Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    return yield* fs.stat(target).pipe(Effect.orElseSucceed(() => null))
  })
}

/** Removes a path, answering whether it was removed. */
function removeQuietly(target: string, recursive = false) {
  return Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    return yield* fs.remove(target, { recursive, force: true }).pipe(
      Effect.as(true),
      Effect.orElseSucceed(() => false),
    )
  })
}

/** Deletes the `.ts` files directly inside a split output directory before it is regenerated. */
function cleanupSplitDir(name: string, output: string) {
  return Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const directory = toAbsolutePath(output)
    const names = yield* fs
      .readDirectory(directory)
      .pipe(Effect.orElseSucceed((): readonly string[] => []))
    const files = names
      .filter((entry) => entry.endsWith('.ts'))
      .map((entry) => path.join(directory, entry))
    const infos = yield* Effect.all(files.map(statOrNull), { concurrency: 'unbounded' })
    const removed = yield* Effect.all(
      files.filter((_, index) => infos[index]?.type === 'File').map((file) => removeQuietly(file)),
      { concurrency: 'unbounded' },
    )
    const count = removed.filter(Boolean).length
    return count > 0 ? `🧹 ${name}: cleaned ${String(count)} files` : undefined
  })
}

function isOutputConfig(value: unknown): value is { readonly output: string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'output' in value &&
    typeof value.output === 'string'
  )
}

function isSplitOutput(value: unknown): value is { readonly output: string } {
  return (
    isOutputConfig(value) &&
    'split' in value &&
    value.split === true &&
    !value.output.endsWith('.ts')
  )
}

function extractOutputPaths(config: Config) {
  const componentOutputs = Object.entries(config.components ?? {}).flatMap(([key, value]) =>
    key !== 'output' && isOutputConfig(value) ? [value.output] : [],
  )
  const baseOutput = config.components?.output === undefined ? [] : [config.components.output]
  const clientOutputs = Object.values(config.client ?? {}).flatMap((value) =>
    isOutputConfig(value) ? [value.output] : [],
  )
  return [config.output, ...componentOutputs, ...baseOutput, ...clientOutputs]
    .filter((output) => output !== undefined)
    .map(toAbsolutePath)
}

/** Removes outputs the previous config wrote and the current one no longer names. */
function cleanupStaleOutputs(previousConfig: Config, currentConfig: Config) {
  return Effect.gen(function* () {
    const current = new Set(extractOutputPaths(currentConfig))
    const stalePaths = [...new Set(extractOutputPaths(previousConfig))].filter(
      (stale) => !current.has(stale),
    )
    const infos = yield* Effect.all(stalePaths.map(statOrNull), { concurrency: 'unbounded' })
    const removed = yield* Effect.all(
      stalePaths.map((stale, index) => {
        const type = infos[index]?.type
        if (type === 'Directory') return removeQuietly(stale, true)
        if (type === 'File' && stale.endsWith('.ts')) return removeQuietly(stale)
        return Effect.succeed(false)
      }),
      { concurrency: 'unbounded' },
    )
    return stalePaths.filter((_, index) => removed[index])
  })
}

/**
 * Empties the split directories (handlers, split components and clients) so an entry the
 * spec no longer names does not survive, then runs the generators. A failure is reported
 * as a log line rather than raised, so the dev server keeps running.
 */
function runGeneration(config: Config) {
  return Effect.gen(function* () {
    const splitDirs = [
      ...Object.entries(config.components ?? {}).flatMap(([key, value]) =>
        key !== 'output' && isSplitOutput(value) ? [[key, value.output] as const] : [],
      ),
      ...Object.entries(config.client ?? {}).flatMap(([key, value]) =>
        isSplitOutput(value) ? [[key, value.output] as const] : [],
      ),
      ...(config.output && !config.output.endsWith('.ts')
        ? [['handlers', config.output] as const]
        : []),
    ]
    const cleaned = yield* Effect.all(
      splitDirs.map(([name, output]) => cleanupSplitDir(name, output)),
      { concurrency: 'unbounded' },
    )
    const result = yield* Effect.result(hono(config))
    return [
      ...cleaned.filter((log) => log !== undefined),
      Result.isSuccess(result)
        ? '✅ takibi-hono: generated successfully'
        : `❌ takibi-hono: ${result.failure.message}`,
    ]
  })
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

/** The plugin's boundary: Vite's hooks are Promise/callback APIs, the generators are Effects. */
function run<A>(program: Effect.Effect<A, never, FileSystem.FileSystem>) {
  return Effect.runPromise(program.pipe(Effect.provide(fileSystemLayer)))
}

export function takibiHonoVite(): any {
  // Intentional `const` + mutable property pattern for state spanning Vite lifecycle hooks
  // (configureServer / handleHotUpdate / watcher callbacks).
  const pluginState: {
    current: Config | null
    inputDirectory: string | null
  } = {
    current: null,
    inputDirectory: null,
  }
  const absoluteConfigFilePath = toAbsolutePath(DEFAULT_CONFIG_FILE)

  const regenerate = (server?: ViteDevServer) =>
    Effect.gen(function* () {
      if (!pluginState.current) return
      yield* Console.log('🔥 takibi-hono')
      const logs = yield* runGeneration(pluginState.current)
      for (const log of logs) yield* Console.log(log)
      if (server) server.ws.send({ type: 'full-reload' })
    })

  /** Loads the config; on success, remembers it and starts watching its input documents. */
  const loadConfig = (server: ViteDevServer) =>
    Effect.gen(function* () {
      const next = yield* Effect.result(readConfigWithHotReload(server))
      if (Result.isFailure(next)) {
        yield* Console.error(`❌ config: ${next.failure.message}`)
        return false
      }
      if (pluginState.current) {
        const cleaned = yield* cleanupStaleOutputs(pluginState.current, next.success)
        for (const stale of cleaned) yield* Console.log(`🧹 cleanup: ${stale}`)
      }
      pluginState.current = next.success
      pluginState.inputDirectory = addInputGlobsToWatcher(
        server,
        toAbsolutePath(next.success.input),
      )
      return true
    })

  const handleConfigChange = (server: ViteDevServer) =>
    Effect.gen(function* () {
      if (yield* loadConfig(server)) yield* regenerate(server)
    })

  return {
    name: 'takibi-hono-vite',

    handleHotUpdate(context: { file: string; server: ViteDevServer }) {
      if (path.resolve(context.file) !== absoluteConfigFilePath) return undefined
      run(handleConfigChange(context.server)).catch((error: unknown) => {
        console.error('❌ hot-update error:', error)
      })
      return []
    },
    buildStart() {
      // Dev-only: handled by configureServer
      return Promise.resolve()
    },
    configureServer(server: ViteDevServer) {
      const start = Effect.gen(function* () {
        if (!(yield* loadConfig(server))) return
        server.watcher.add(absoluteConfigFilePath)
        const debouncedRegenerate = debounce(200, () => {
          void run(regenerate(server))
        })
        server.watcher.on('all', (_eventType, filePath) => {
          const absoluteChanged = path.resolve(filePath)
          if (absoluteChanged === absoluteConfigFilePath) {
            void run(handleConfigChange(server))
            return
          }
          if (
            pluginState.inputDirectory &&
            isInputFile(absoluteChanged, pluginState.inputDirectory)
          ) {
            debouncedRegenerate()
          }
        })
        yield* regenerate(server)
      })
      run(start).catch((error: unknown) => {
        console.error('❌ watch error:', error)
      })
    },
  }
}
