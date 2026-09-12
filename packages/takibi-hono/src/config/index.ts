import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

import { Effect, FileSystem, Schema, SchemaIssue, SchemaTransformation } from 'effect'
import type { FormatConfig } from 'oxfmt'

/** Config file `takibi-hono` picks up from the working directory when `--config` is omitted. */
export const DEFAULT_CONFIG_FILE = 'takibi-hono.config.ts'

const COMPONENT_KINDS = [
  'schemas',
  'responses',
  'parameters',
  'examples',
  'requestBodies',
  'headers',
  'securitySchemes',
  'links',
  'callbacks',
  'pathItems',
  'mediaTypes',
] as const

/**
 * `Schema.TemplateLiteral` carries the literal type but its rejection reads "Expected a
 * string matching template literal parts"; `Schema.declare` over the same guard keeps the
 * type on both sides — so `defineConfig` still rejects a wrong extension while you type —
 * and lets the message say which extensions are meant.
 */
const InputSchema = Schema.declare<`${string}.yaml` | `${string}.json` | `${string}.tsp`>(
  Schema.is(Schema.TemplateLiteral([Schema.String, Schema.Literals(['.yaml', '.json', '.tsp'])])),
  { message: 'must be .yaml | .json | .tsp' },
).annotate({
  title: 'Input document',
  description: 'OpenAPI or TypeSpec entry document.',
  examples: ['openapi.yaml', './spec/main.tsp'],
})

const TypeScriptPathSchema = Schema.declare<`${string}.ts`>(
  Schema.is(Schema.TemplateLiteral([Schema.String, '.ts'])),
  { message: 'must be a .ts file' },
)

const DirectorySchema = Schema.String.check(
  Schema.isPattern(/^(?!.*\.ts$).+/u, { message: 'must be a directory, not a .ts file' }),
)

const FileOutputSchema = Schema.String.pipe(
  Schema.decodeTo(
    Schema.String,
    SchemaTransformation.transform({
      decode: (value: string) => (value.endsWith('.ts') ? value : `${value}/index.ts`),
      encode: (value: string) => value,
    }),
  ),
).annotate({
  description:
    'Single file that receives every entry. A directory is normalized to `<dir>/index.ts`.',
})

/**
 * Every component target is the same two-branch union: `split: true` writes one file per
 * entry into a directory, anything else writes a single file. Each member pins `split`,
 * so the failure reported is the one inside the matching branch.
 */
function splitUnion<Fields extends Schema.Struct.Fields>(shared: Fields) {
  return Schema.Union([
    Schema.Struct({ split: Schema.Literal(true), output: DirectorySchema, ...shared }),
    Schema.Struct({
      split: Schema.optionalKey(Schema.Literal(false)),
      output: FileOutputSchema,
      ...shared,
    }),
  ])
}

const OutputSchema = splitUnion({ import: Schema.optionalKey(Schema.String) })

const ExportTypesOutputSchema = splitUnion({
  import: Schema.optionalKey(Schema.String),
  exportTypes: Schema.optionalKey(Schema.Boolean),
})

const ClientQuerySchema = Schema.Struct({
  output: Schema.String,
  import: Schema.String,
  split: Schema.optionalKey(Schema.Boolean),
  client: Schema.optionalKey(Schema.String),
})

const ClientSchema = Schema.Struct({
  rpc: Schema.optionalKey(
    Schema.Struct({
      ...ClientQuerySchema.fields,
      parseResponse: Schema.optionalKey(Schema.Boolean),
      docs: Schema.optionalKey(Schema.Boolean),
    }),
  ),
  swr: Schema.optionalKey(ClientQuerySchema),
  tanstackQuery: Schema.optionalKey(ClientQuerySchema),
  svelteQuery: Schema.optionalKey(ClientQuerySchema),
  vueQuery: Schema.optionalKey(ClientQuerySchema),
  preactQuery: Schema.optionalKey(ClientQuerySchema),
  solidQuery: Schema.optionalKey(ClientQuerySchema),
  angularQuery: Schema.optionalKey(ClientQuerySchema),
  type: Schema.optionalKey(
    Schema.Struct({ output: TypeScriptPathSchema, readonly: Schema.optionalKey(Schema.Boolean) }),
  ),
  docs: Schema.optionalKey(
    Schema.Struct({
      output: Schema.String,
      entry: Schema.optionalKey(Schema.String),
      basePath: Schema.optionalKey(Schema.String),
      curl: Schema.optionalKey(Schema.Boolean),
      baseUrl: Schema.optionalKey(Schema.String),
    }),
  ),
}).annotate({ description: 'Client-code generators delegated to hono-takibi. Each is opt-in.' })

const ComponentsSchema = Schema.Struct({
  output: Schema.optionalKey(Schema.String),
  schemas: Schema.optionalKey(ExportTypesOutputSchema),
  responses: Schema.optionalKey(OutputSchema),
  parameters: Schema.optionalKey(ExportTypesOutputSchema),
  examples: Schema.optionalKey(OutputSchema),
  requestBodies: Schema.optionalKey(OutputSchema),
  headers: Schema.optionalKey(ExportTypesOutputSchema),
  securitySchemes: Schema.optionalKey(OutputSchema),
  links: Schema.optionalKey(OutputSchema),
  callbacks: Schema.optionalKey(OutputSchema),
  pathItems: Schema.optionalKey(OutputSchema),
  mediaTypes: Schema.optionalKey(ExportTypesOutputSchema),
}).check(
  Schema.makeFilter(
    (components) =>
      components.output === undefined ||
      COMPONENT_KINDS.every((kind) => components[kind] === undefined),
    {
      message:
        'components.output is mutually exclusive with per-type component outputs (schemas, responses, ...). Use output for single-file mode, or per-type fields for split mode.',
    },
  ),
)

const ConfigSchema = Schema.Struct({
  input: InputSchema,
  output: Schema.optionalKey(DirectorySchema),
  basePath: Schema.optionalKey(Schema.String),
  schema: Schema.Literals(['zod', 'valibot', 'typebox', 'arktype', 'effect']),
  openapi: Schema.optionalKey(Schema.Boolean),
  format: Schema.optionalKey(
    Schema.declare<FormatConfig>(
      (u): u is FormatConfig => typeof u === 'object' && u !== null && !Array.isArray(u),
      {
        message: 'must be an oxfmt FormatConfig object',
        description: 'oxfmt `FormatConfig` applied to every generated file.',
      },
    ),
  ),
  readonly: Schema.optionalKey(Schema.Boolean),
  client: Schema.optionalKey(ClientSchema),
  pathAlias: Schema.optionalKey(Schema.String),
  components: Schema.optionalKey(ComponentsSchema),
}).annotate({ title: 'takibi-hono config' })

/** A validated config: component outputs normalized. */
export type Config = typeof ConfigSchema.Type

/**
 * The config file is missing, will not import, or does not validate.
 *
 * `notFound` separates "there is no config here" from "the config here is wrong": only
 * the first is the caller who ran `takibi-hono` with nothing and needs the usage.
 */
// oxlint-disable-next-line unicorn/throw-new-error -- `Schema.TaggedError()` is the class factory, not a throw
export class ConfigError extends Schema.TaggedError<ConfigError>()('ConfigError', {
  message: Schema.String,
  notFound: Schema.optionalKey(Schema.Boolean),
}) {}

// Built once and reused at the edge rather than per call. Unknown keys are rejected: a
// misspelled field would otherwise be dropped silently and its generator never run.
const decodeConfig = Schema.decodeUnknownEffect(ConfigSchema, { onExcessProperty: 'error' })
const formatIssue = SchemaIssue.makeFormatterStandardSchemaV1()

/**
 * Validates an already-loaded config object. The first issue is reported as
 * `<a.b.c>: <message>`: a config is written by hand, so naming the field matters more
 * than listing every consequence of it.
 */
export function parseConfig(config: unknown) {
  return decodeConfig(config).pipe(
    Effect.mapError((error) => {
      const issue = formatIssue(error.issue).issues[0]
      const path = (issue?.path ?? [])
        .map((segment) => String(typeof segment === 'object' ? segment.key : segment))
        .join('.')
      const prefix = path === '' ? '' : `${path}: `
      return new ConfigError({ message: `Invalid config: ${prefix}${issue?.message ?? ''}` })
    }),
  )
}

// A module specifier is imported once per process, so a reload of the same config file
// would get the copy from before the edit. The counter makes each reload a new specifier.
let reloadCount = 0

/**
 * Loads and validates a config file, resolved against the current directory. `reload`
 * re-reads a config that has already been imported (the Vite plugin after an edit).
 */
export function readConfig(configPath: string = DEFAULT_CONFIG_FILE, reload = false) {
  return Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const abs = resolve(process.cwd(), configPath)
    // Checked before importing so a missing file reads as "no config here" rather than
    // as whatever the module loader throws.
    const found = yield* fs
      .exists(abs)
      .pipe(Effect.catchTag('PlatformError', () => Effect.succeed(false)))
    if (!found) {
      return yield* new ConfigError({
        message: `Config not found: ${abs}\nCreate ${DEFAULT_CONFIG_FILE} in the current directory. See https://github.com/nakita628/takibi-hono#configuration for an example.`,
        notFound: true,
      })
    }
    const href = pathToFileURL(abs).href
    const specifier = reload ? `${href}?reload=${String((reloadCount += 1))}` : href
    const mod: unknown = yield* Effect.tryPromise({
      try: () => import(specifier),
      catch: (error) =>
        new ConfigError({ message: error instanceof Error ? error.message : String(error) }),
    })
    // `'default' in mod` is what narrows `mod` for TypeScript; `export default undefined`
    // leaves the key present, which is why both halves are here.
    if (
      typeof mod !== 'object' ||
      mod === null ||
      !('default' in mod) ||
      mod.default === undefined
    ) {
      return yield* new ConfigError({
        message: `Config must export default object from ${abs}\nDid you forget \`export default defineConfig({ ... })\`?`,
      })
    }
    return yield* parseConfig(mod.default)
  })
}

export function defineConfig(config: typeof ConfigSchema.Encoded) {
  return config
}
