import path from 'node:path'

/** Shared shape for the framework query-hook generators (swr / tanstack / vue / ...). */
type ClientQueryOptions = {
  readonly output: string
  readonly import: string
  readonly split?: boolean | undefined
  readonly client?: string | undefined
}

/** Client-code generators delegated to `hono-takibi`. Each entry is opt-in. */
export type ClientOptions = {
  readonly rpc?:
    | (ClientQueryOptions & {
        readonly parseResponse?: boolean | undefined
        readonly docs?: boolean | undefined
      })
    | undefined
  readonly swr?: ClientQueryOptions | undefined
  readonly tanstackQuery?: ClientQueryOptions | undefined
  readonly svelteQuery?: ClientQueryOptions | undefined
  readonly vueQuery?: ClientQueryOptions | undefined
  readonly preactQuery?: ClientQueryOptions | undefined
  readonly solidQuery?: ClientQueryOptions | undefined
  readonly angularQuery?: ClientQueryOptions | undefined
  readonly type?: { readonly output: string; readonly readonly?: boolean | undefined } | undefined
  readonly docs?:
    | {
        readonly output: string
        readonly entry?: string | undefined
        readonly basePath?: string | undefined
        readonly curl?: boolean | undefined
        readonly baseUrl?: string | undefined
      }
    | undefined
}

/** User-facing `takibi-hono` config block accepted by `defineConfig`. */
export type TakibiHonoOptions = {
  readonly readonly?: boolean | undefined
  readonly client?: ClientOptions | undefined
  /** Directory for generated handler files (default `src/handlers`). */
  readonly output?: string | undefined
  readonly pathAlias?: string | undefined
  readonly components?:
    | ({ readonly output?: string | undefined } & Partial<
        Record<
          'schemas' | 'parameters' | 'headers' | 'mediaTypes',
          {
            readonly output: string
            readonly exportTypes?: boolean | undefined
            readonly split?: boolean | undefined
            readonly import?: string | undefined
          }
        > &
          Record<
            | 'responses'
            | 'requestBodies'
            | 'examples'
            | 'securitySchemes'
            | 'links'
            | 'callbacks'
            | 'pathItems',
            {
              readonly output: string
              readonly split?: boolean | undefined
              readonly import?: string | undefined
            }
          >
      >)
    | undefined
}

/** Computed once per run from config; every generator consumes this instead of re-deriving paths. */
export type Layout = {
  readonly schemasFile: string
  readonly schemasDir: string
  readonly handlersDir: string
  readonly componentsBaseOutput: string | undefined
  /** When `components.output` is a `.ts` file, all components + schemas aggregate into it. */
  readonly componentsSingleFile: string | undefined
  readonly pathAlias: string | undefined
  /** Per-component-type relative imports from the handlers directory. */
  readonly componentPaths: Record<string, string>
  readonly appDir: string
}

export function resolveLayout(ohConfig: TakibiHonoOptions | undefined): Layout {
  const handlersOutput = ohConfig?.output ?? 'src/handlers'
  const handlersDir = handlersOutput.endsWith('.ts') ? path.dirname(handlersOutput) : handlersOutput
  const appDir = path.dirname(handlersDir)
  const pathAlias = ohConfig?.pathAlias
  const componentsBaseOutput = ohConfig?.components?.output
  // `.ts` => single-file aggregate (schemas + all components in one file); a directory keeps the
  // legacy `<base>/<kind>/index.ts` fallback.
  const componentsSingleFile = componentsBaseOutput?.endsWith('.ts')
    ? componentsBaseOutput
    : undefined
  const schemasConfig = ohConfig?.components?.schemas
  const schemasOutput =
    componentsSingleFile ??
    schemasConfig?.output ??
    (componentsBaseOutput ? `${componentsBaseOutput}/index.ts` : 'src/components/index.ts')
  const schemasDir = schemasOutput.endsWith('.ts') ? path.dirname(schemasOutput) : schemasOutput
  const schemasFile = schemasOutput.endsWith('.ts')
    ? schemasOutput
    : path.join(schemasOutput, 'index.ts')
  const componentPaths = makeComponentPaths(
    handlersDir,
    appDir,
    schemasFile,
    ohConfig,
    componentsBaseOutput,
    componentsSingleFile,
    pathAlias,
  )
  return {
    schemasFile,
    schemasDir,
    handlersDir,
    componentsBaseOutput,
    componentsSingleFile,
    pathAlias,
    componentPaths,
    appDir,
  }
}

const COMPONENT_KEYS = [
  'parameters',
  'headers',
  'securitySchemes',
  'requestBodies',
  'responses',
  'examples',
  'links',
  'callbacks',
  'pathItems',
  'mediaTypes',
] as const

function makeComponentPaths(
  handlersDir: string,
  appDir: string,
  schemasFile: string,
  ohConfig: TakibiHonoOptions | undefined,
  componentsBaseOutput: string | undefined,
  componentsSingleFile: string | undefined,
  pathAlias: string | undefined,
): Record<string, string> {
  // pathAlias maps to the app directory; resolve module specifiers against it so they are
  // import-site independent (e.g. `@/components`).
  const aliasPrefix = pathAlias?.endsWith('/') ? pathAlias.slice(0, -1) : pathAlias
  const importTo = (toFile: string): string =>
    aliasPrefix
      ? `${aliasPrefix}/${path
          .relative(appDir, toFile)
          .replace(/\.ts$/, '')
          .replace(/\/index$/, '')
          .replaceAll('\\', '/')}`
      : computeRelativeImport(handlersDir, toFile)
  // Single-file mode: schemas + every component live in one file, so all keys import from it.
  if (componentsSingleFile) {
    const spec = importTo(componentsSingleFile)
    return Object.fromEntries([['schemas', spec], ...COMPONENT_KEYS.map((k) => [k, spec])])
  }
  const paths: Record<string, string> = {}
  paths.schemas = ohConfig?.components?.schemas?.import ?? importTo(schemasFile)
  for (const k of COMPONENT_KEYS) {
    const componentConfig = ohConfig?.components?.[k]
    if (componentConfig) {
      if (componentConfig.import) {
        paths[k] = componentConfig.import
      } else {
        const output = componentConfig.output
        const file = output.endsWith('.ts') ? output : path.join(output, 'index.ts')
        paths[k] = importTo(file)
      }
    } else if (componentsBaseOutput) {
      paths[k] = importTo(path.join(componentsBaseOutput, k, 'index.ts'))
    }
  }
  return paths
}

function computeRelativeImport(fromDir: string, toFile: string): string {
  const rel = path.relative(fromDir, toFile)
  const stripped = rel.replace(/\.ts$/, '').replace(/\/index$/, '')
  const normalized = stripped.replace(/\\/g, '/')
  return normalized.startsWith('.') ? normalized : `./${normalized}`
}
