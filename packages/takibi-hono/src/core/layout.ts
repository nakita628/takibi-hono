import path from 'node:path'

import { Data, Effect } from 'effect'
import type { OpenAPI } from 'oas-truth'
import type { FormatConfig } from 'oxfmt'

import type { BaseUrl, Credentials } from '../generator/client.js'
import type { ComponentKind } from '../generator/components.js'
import { COMPONENT_KINDS } from '../generator/components.js'

/** Shared shape for the framework query-hook generators (swr / tanstack / vue / ...). */
type ClientQueryOptions = {
  /** One `.ts` file (`parseConfig` normalizes a directory to `<dir>/index.ts`). */
  readonly output: string
}

/**
 * The typed client (`output`, which rpc and the query hooks import), and the client-code
 * generators delegated to `hono-takibi`. Each entry is opt-in.
 */
export type ClientOptions = {
  readonly output?: string | undefined
  readonly baseUrl?: BaseUrl | undefined
  readonly credentials?: Credentials | undefined
  /** The module the client imports the type of the app from. */
  readonly import?: string | undefined
  /** The name other packages import the client by: the package it is written into. */
  readonly package?: string | undefined
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
  /** The name other packages import this output by: the package it is written into. */
  readonly package?: string | undefined
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
    | ({ readonly output?: string | undefined; readonly package?: string | undefined } & {
        readonly [K in 'schemas' | ComponentKind]?: TargetConfig | undefined
      })
    | undefined
}

export type Target = {
  /** A `.ts` file, or the directory of a split target. */
  readonly output: string
  readonly split: boolean
  readonly exportTypes: boolean
  readonly package: string | undefined
}

export type Layout = {
  readonly handlersDir: string
  readonly appDir: string
  /** The typed client, when `client.output` is set. */
  readonly client: Target | undefined
  /** The directories the typed client, rpc and the query hooks are written into. */
  readonly clientDirs: readonly string[]
  readonly pathAlias: string | undefined
  /** Set when every component kind lives in one module. */
  readonly aggregate: string | undefined
  readonly targets: { readonly [K in 'schemas' | ComponentKind]?: Target }
  /**
   * The package a generated file belongs to: the directory of the nearest `package.json`
   * above it, or `undefined` when there is none. `resolveLayout` knows no package; `hono()`
   * fills this in from the filesystem.
   */
  readonly packageRoot: (file: string) => string | undefined
}

/** A generated file would import another package that names no `package`. */
export class LayoutError extends Data.TaggedError('LayoutError')<{ readonly message: string }> {}

/** The client generators that import the typed client. */
export const CLIENT_IMPORTERS = [
  'rpc',
  'swr',
  'tanstackQuery',
  'svelteQuery',
  'vueQuery',
  'preactQuery',
  'solidQuery',
  'angularQuery',
] as const

/** Every component kind the layout places: the schemas, then the other Components kinds. */
const KINDS = ['schemas', ...COMPONENT_KINDS] as const

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
    package: entry.package,
  }
}

/** The directory a target's files are written into. */
export function targetDirectory(target: Target) {
  return target.split ? target.output : path.dirname(target.output)
}

/** The module a target is imported by: its file, or the `index.ts` barrel of a split directory. */
export function targetModule(target: Target) {
  return target.split ? path.join(target.output, 'index.ts') : target.output
}

/**
 * Two modes. Per-kind: any `components.<kind>` config places that kind (schemas
 * default to `src/components/index.ts`; a kind with no config is not generated).
 * Aggregate: otherwise every kind shares one module — `components.output`, or
 * `src/components/index.ts`.
 */
export function resolveLayout(config: TakibiHonoConfig): Layout {
  const handlersDir = config.output ?? 'src/handlers'
  const client = config.client
  const layout = {
    handlersDir,
    appDir: path.dirname(handlersDir),
    client:
      client?.output === undefined
        ? undefined
        : { output: client.output, split: false, exportTypes: false, package: client.package },
    clientDirs: [client?.output, ...CLIENT_IMPORTERS.map((key) => client?.[key]?.output)].flatMap(
      (output) => (output === undefined ? [] : [path.dirname(output)]),
    ),
    pathAlias: config.pathAlias,
    packageRoot: () => undefined,
  }
  const components = config.components
  const configured = KINDS.filter((kind) => components?.[kind] !== undefined)
  if (configured.length === 0) {
    const file = toFile(components?.output ?? 'src/components')
    const target = { output: file, split: false, package: components?.package }
    return {
      ...layout,
      aggregate: file,
      targets: Object.fromEntries(
        KINDS.map((kind) => [kind, { ...target, exportTypes: kind === 'schemas' }]),
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

/**
 * The specifier a module in `fromDir` imports a target with: the target's `package` from
 * another package; the path alias when both sit in the app's package and the target is in
 * the app directory; relative otherwise.
 */
export function makeSpecifier(layout: Layout, fromDir: string, target: Target) {
  const file = targetModule(target)
  const from = path.join(fromDir, 'index.ts')
  const sameRoot = layout.packageRoot(from) === layout.packageRoot(file)
  if (!sameRoot && target.package !== undefined) return target.package
  const inside = toSpecifier(path.relative(layout.appDir, file))
  if (
    layout.pathAlias &&
    sameRoot &&
    layout.packageRoot(from) === layout.packageRoot(path.join(layout.appDir, 'index.ts')) &&
    inside !== '' &&
    !inside.startsWith('..')
  ) {
    return `${layout.pathAlias.replace(/\/$/u, '')}/${inside}`
  }
  const rel = toSpecifier(path.relative(fromDir, file))
  return rel === '' ? '.' : rel.startsWith('.') ? rel : `./${rel}`
}

/**
 * Fails when a generated file would import a component output of another package that
 * names no `package`: the import could not be written. The handlers import the schemas and
 * the responses; every other component kind imports the schemas — each only when the
 * document declares some.
 */
export function checkPackages(openapi: OpenAPI, layout: Layout) {
  const declared = (kind: 'schemas' | 'responses') =>
    Object.keys(openapi.components?.[kind] ?? {}).length > 0
  const schemas = layout.targets.schemas
  const responses = layout.targets.responses
  const edges = [
    ...(schemas && declared('schemas')
      ? [['handlers', layout.handlersDir, 'schemas', schemas] as const]
      : []),
    ...(responses && declared('responses')
      ? [['handlers', layout.handlersDir, 'responses', responses] as const]
      : []),
    ...(schemas && declared('schemas')
      ? COMPONENT_KINDS.flatMap((kind) => {
          const target = layout.targets[kind]
          return target
            ? [[`components.${kind}`, targetDirectory(target), 'schemas', schemas] as const]
            : []
        })
      : []),
  ]
  const missing = edges.find(
    ([, fromDir, , target]) =>
      target.package === undefined &&
      layout.packageRoot(path.join(fromDir, 'index.ts')) !==
        layout.packageRoot(targetModule(target)),
  )
  if (missing === undefined) return Effect.void
  const [from, , name, target] = missing
  return Effect.fail(
    new LayoutError({
      message: `${from} imports components.${name} from another package: set components.${name}.package to the name of the package ${target.output} is written into.`,
    }),
  )
}
