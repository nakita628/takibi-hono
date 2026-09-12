import path from 'node:path'

import type { FormatConfig } from 'oxfmt'

import type { ComponentKind } from '../generator/components.js'
import { COMPONENT_KINDS } from '../generator/components.js'

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

type TargetConfig = {
  readonly output: string
  readonly split?: boolean | undefined
  readonly import?: string | undefined
  readonly exportTypes?: boolean | undefined
}

/** The `takibi-hono` config `hono()` runs from (the shape `parseConfig` returns). */
export type TakibiHonoConfig = {
  readonly input: string
  readonly schema: 'zod' | 'valibot' | 'typebox' | 'arktype' | 'effect'
  readonly output?: string | undefined
  readonly basePath?: string | undefined
  readonly openapi?: boolean | undefined
  readonly format?: FormatConfig | undefined
  readonly readonly?: boolean | undefined
  readonly pathAlias?: string | undefined
  readonly client?: ClientOptions | undefined
  readonly components?:
    | ({ readonly output?: string | undefined } & {
        readonly [K in 'schemas' | ComponentKind]?: TargetConfig | undefined
      })
    | undefined
}

export type Target = {
  /** A `.ts` file, or the directory of a split target. */
  readonly output: string
  readonly split: boolean
  readonly exportTypes: boolean
  readonly import: string | undefined
}

export type Layout = {
  readonly handlersDir: string
  readonly appDir: string
  readonly pathAlias: string | undefined
  /** Set when every component kind lives in one module. */
  readonly aggregate: string | undefined
  readonly targets: { readonly [K in 'schemas' | ComponentKind]?: Target }
}

function toFile(output: string) {
  return output.endsWith('.ts') ? output : path.join(output, 'index.ts')
}

/** A per-kind config as a target; `split` only applies to a directory output. */
function toTarget(entry: TargetConfig): Target {
  const split = entry.split === true && !entry.output.endsWith('.ts')
  return {
    output: split ? entry.output : toFile(entry.output),
    split,
    exportTypes: entry.exportTypes ?? false,
    import: entry.import,
  }
}

/**
 * Two modes. Per-kind: any `components.<kind>` config places that kind (schemas
 * default to `src/components/index.ts`; unconfigured kinds are not generated).
 * Aggregate: otherwise every kind shares one module — `components.output`, or
 * `src/components/index.ts`.
 */
export function resolveLayout(config: TakibiHonoConfig): Layout {
  const handlersDir = config.output ?? 'src/handlers'
  const layout = {
    handlersDir,
    appDir: path.dirname(handlersDir),
    pathAlias: config.pathAlias,
  }
  const components = config.components
  const configured = (['schemas', ...COMPONENT_KINDS] as const).filter(
    (kind) => components?.[kind] !== undefined,
  )
  if (configured.length === 0) {
    const file = toFile(components?.output ?? 'src/components')
    const target = { output: file, split: false, import: undefined }
    return {
      ...layout,
      aggregate: file,
      targets: Object.fromEntries(
        (['schemas', ...COMPONENT_KINDS] as const).map((kind) => [
          kind,
          { ...target, exportTypes: kind === 'schemas' },
        ]),
      ),
    }
  }
  return {
    ...layout,
    aggregate: undefined,
    targets: {
      schemas: toTarget(components?.schemas ?? { output: 'src/components/index.ts' }),
      ...Object.fromEntries(
        configured.flatMap((kind) => {
          const target = components?.[kind]
          return target ? [[kind, toTarget(target)]] : []
        }),
      ),
    },
  }
}

/** A path as a module specifier: POSIX separators, no `.ts`, no trailing `index`. */
function toSpecifier(file: string) {
  return file
    .replaceAll('\\', '/')
    .replace(/\.ts$/u, '')
    .replace(/(?:^|\/)index$/u, '')
}

/** The specifier a module in `fromDir` imports a target with: `import` override, path alias, or relative. */
export function makeSpecifier(layout: Layout, fromDir: string, target: Target) {
  if (target.import) return target.import
  const file = target.split ? path.join(target.output, 'index.ts') : target.output
  if (layout.pathAlias) {
    const alias = layout.pathAlias.replace(/\/$/u, '')
    const rel = toSpecifier(path.relative(layout.appDir, file))
    return rel === '' ? alias : `${alias}/${rel}`
  }
  const rel = toSpecifier(path.relative(fromDir, file))
  return rel === '' ? '.' : rel.startsWith('.') ? rel : `./${rel}`
}
