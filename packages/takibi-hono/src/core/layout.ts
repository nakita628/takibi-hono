import path from 'node:path'

/** Validation library targeted by the generated code. */
export type SchemaLib = 'zod' | 'valibot' | 'typebox' | 'arktype' | 'effect'

/**
 * User-facing `takibi-hono` config block as accepted by `defineConfig`. Re-used
 * by every orchestrator that needs to know per-component output / import
 * overrides.
 */
export type TakibiHonoOptions = {
  readonly readonly?: boolean | undefined
  readonly exportSchemasTypes?: boolean | undefined
  readonly exportParametersTypes?: boolean | undefined
  readonly exportHeadersTypes?: boolean | undefined
  readonly exportMediaTypesTypes?: boolean | undefined
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

/**
 * Resolved file/directory paths for a generation run, computed once from the
 * user's `takibi-hono` config and reused across every generator.
 */
export type Layout = {
  readonly schemasFile: string
  readonly schemasDir: string
  readonly handlersDir: string
  readonly componentsBaseOutput: string | undefined
  /** Per-component-type relative imports from the handlers directory. */
  readonly componentPaths: Record<string, string>
  readonly appDir: string
}

/**
 * Resolves the file/directory layout for one generation run.
 *
 * Computes once: schemas file, handlers dir, app dir, components base output,
 * and the per-component-type relative import paths. Every generator then
 * consumes this layout instead of re-deriving paths.
 */
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

/**
 * Computes a relative import specifier (e.g. `../components`) from `fromDir`
 * to `toFile`, stripping the `.ts` extension and `/index` suffix.
 */
function computeRelativeImport(fromDir: string, toFile: string): string {
  const rel = path.relative(fromDir, toFile)
  const stripped = rel.replace(/\.ts$/, '').replace(/\/index$/, '')
  const normalized = stripped.replace(/\\/g, '/')
  return normalized.startsWith('.') ? normalized : `./${normalized}`
}
