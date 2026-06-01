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
  readonly exportSchemasTypes?: boolean | undefined
  readonly exportParametersTypes?: boolean | undefined
  readonly exportHeadersTypes?: boolean | undefined
  readonly exportMediaTypesTypes?: boolean | undefined
  readonly client?: ClientOptions | undefined
  readonly handlers?: { readonly output: string } | undefined
  readonly components?:
    | ({ readonly output?: string | undefined } & Partial<
        Record<
          | 'schemas'
          | 'parameters'
          | 'headers'
          | 'securitySchemes'
          | 'requestBodies'
          | 'responses'
          | 'examples'
          | 'links'
          | 'callbacks'
          | 'pathItems'
          | 'mediaTypes',
          {
            readonly output: string
            readonly exportTypes?: boolean | undefined
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
  /** Per-component-type relative imports from the handlers directory. */
  readonly componentPaths: Record<string, string>
  readonly appDir: string
}

export function resolveLayout(ohConfig: TakibiHonoOptions | undefined): Layout {
  const handlersOutput = ohConfig?.handlers?.output ?? 'src/handlers'
  const componentsBaseOutput = ohConfig?.components?.output
  const schemasConfig = ohConfig?.components?.schemas
  const schemasOutput =
    schemasConfig?.output ??
    (componentsBaseOutput ? `${componentsBaseOutput}/index.ts` : 'src/components/index.ts')
  const schemasDir = schemasOutput.endsWith('.ts') ? path.dirname(schemasOutput) : schemasOutput
  const schemasFile = schemasOutput.endsWith('.ts')
    ? schemasOutput
    : path.join(schemasOutput, 'index.ts')
  const handlersDir = handlersOutput.endsWith('.ts') ? path.dirname(handlersOutput) : handlersOutput
  const componentPaths = makeComponentPaths(
    handlersDir,
    schemasFile,
    ohConfig,
    componentsBaseOutput,
  )
  const appDir = path.dirname(handlersDir)
  return { schemasFile, schemasDir, handlersDir, componentsBaseOutput, componentPaths, appDir }
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
  schemasFile: string,
  ohConfig: TakibiHonoOptions | undefined,
  componentsBaseOutput?: string,
): Record<string, string> {
  const paths: Record<string, string> = {}
  const schemasImport = ohConfig?.components?.schemas?.import
  paths.schemas = schemasImport ?? computeRelativeImport(handlersDir, schemasFile)
  for (const k of COMPONENT_KEYS) {
    const componentConfig = ohConfig?.components?.[k]
    if (componentConfig) {
      if (componentConfig.import) {
        paths[k] = componentConfig.import
      } else {
        const output = componentConfig.output
        const file = output.endsWith('.ts') ? output : path.join(output, 'index.ts')
        paths[k] = computeRelativeImport(handlersDir, file)
      }
    } else if (componentsBaseOutput) {
      const file = path.join(componentsBaseOutput, k, 'index.ts')
      paths[k] = computeRelativeImport(handlersDir, file)
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
