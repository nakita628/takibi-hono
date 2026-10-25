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
 * A key this package does not support. Naming it fails with the reason, where an unknown key
 * would only say "Expected no excess property": each is a key a user may well reach for —
 * one hono-takibi retired, or one hono-takibi has never offered here.
 */
function removed(message: string) {
  return Schema.optionalKey(Schema.Never.annotate({ message }))
}

/**
 * The name other packages import an output by: the package it is written into. A generated
 * file imports a target of its own package relatively (or under `pathAlias`), one of another
 * package by that package's name.
 */
const PackageSchema = Schema.String.check(
  Schema.isPattern(/^[^\s'"`\\]+$/u, {
    message: 'must be a module specifier, with no whitespace or quotes',
  }),
)

/**
 * What every component target shares with hono-takibi's: `package` for the files of other
 * packages, and no `import` — the specifier is derived from where the files are.
 */
const TARGET_FIELDS = {
  package: Schema.optionalKey(PackageSchema),
  import: removed(
    'import was removed: a generated file imports another one relatively, under pathAlias inside the directory of the app entry, or by package from another package.',
  ),
}

/**
 * Every component target is the same two-branch union: `split: true` writes one file per
 * entry into a directory, anything else writes a single file. Each member pins `split`,
 * so the failure reported is the one inside the matching branch.
 */
function splitUnion<Fields extends Schema.Struct.Fields>(shared: Fields) {
  return Schema.Union([
    Schema.Struct({
      split: Schema.Literal(true),
      output: DirectorySchema,
      ...TARGET_FIELDS,
      ...shared,
    }),
    Schema.Struct({
      split: Schema.optionalKey(Schema.Literal(false)),
      output: FileOutputSchema,
      ...TARGET_FIELDS,
      ...shared,
    }),
  ])
}

const OutputSchema = splitUnion({})

const ExportTypesOutputSchema = splitUnion({ exportTypes: Schema.optionalKey(Schema.Boolean) })

/** The query-hook generators, keyed as hono-takibi keys them. */
const HOOK_LIBRARIES = [
  'swr',
  'tanstack-query',
  'preact-query',
  'solid-query',
  'vue-query',
  'svelte-query',
  'angular-query',
] as const

/** What rpc and every query hook share: one file, and the client the `client` block generates. */
const CLIENT_CALLER_FIELDS = {
  output: FileOutputSchema,
  import: removed(
    'import was removed: rpc and the hooks import the client the client block generates. A file written into another package imports it by client.package.',
  ),
  client: removed(
    'client was removed: the generated client is exported as `client`, and rpc and the hooks import it by that name.',
  ),
  split: removed(
    'split was removed: rpc and hooks are always generated into a single file. Set output to a .ts file path and delete the directory the previous run wrote.',
  ),
}

const HookSchema = Schema.Struct(CLIENT_CALLER_FIELDS)

const EnvNameSchema = Schema.String.check(
  Schema.isPattern(/^[A-Za-z_][A-Za-z0-9_]*$/u, {
    message: 'must be the name of an environment variable',
  }),
)

/**
 * What the typed client is created with. `/` is the only URL written into the file: a fixed
 * URL differs between environments, so it is read from the environment instead. The member
 * that takes `import` stands first, since the other would take the object as well and drop it.
 */
const BaseUrlSchema = Schema.Union([
  Schema.Literal('/').annotate({
    message:
      "a fixed URL was removed: leave baseUrl out (or set '/') for the same origin, or read it from the environment with { env } or { env, import }",
  }),
  Schema.Struct({
    env: EnvNameSchema,
    import: PackageSchema,
    name: Schema.String.check(
      Schema.isPattern(/^[A-Za-z_$][A-Za-z0-9_$]*$/u, {
        message: 'must be a JavaScript identifier',
      }),
    ).pipe(Schema.withDecodingDefault(Effect.succeed('env'))),
  }),
  Schema.Struct({
    env: EnvNameSchema,
    source: Schema.Literals(['import.meta.env', 'process.env']).pipe(
      Schema.withDecodingDefault(Effect.succeed('import.meta.env')),
    ),
  }),
])
  .pipe(Schema.withDecodingDefault(Effect.succeed('/')))
  .annotate({
    description:
      "`hc(baseUrl)`: '/' (the default) for the same origin; { env } reads an environment variable when the client is created (`import.meta.env` by default, or `process.env`), asserted present; { env, import } reads a property of an environment object a module of yours exports (`env` by default).",
  })

/** A generator that sat under `client`, and is the top-level key `key` now. */
function moved(old: string, key: string) {
  return removed(
    `client.${old} moved: ${key} is a top-level key, as in hono-takibi, and the client block is the typed client itself (output, baseUrl, import, package, credentials).`,
  )
}

/**
 * The typed client, as hono-takibi's `client` block. The generators that used to sit under
 * `client` are top-level keys now, as in hono-takibi; naming one here says where it went.
 */
const ClientSchema = Schema.Struct({
  output: TypeScriptPathSchema.annotate({
    description:
      'The typed Hono client of the generated app, exported as `client`, with its type declared once so that it is worked out when the file is compiled. rpc and the hooks import it.',
  }),
  baseUrl: BaseUrlSchema,
  import: Schema.optionalKey(PackageSchema).annotate({
    description:
      'The module the client imports the type of the app from. Left out, the app entry is imported relatively; name the package of the app when the client is written into another package.',
  }),
  package: Schema.optionalKey(PackageSchema).annotate({
    description:
      'The name the files of other packages import the client by: the package it is written into.',
  }),
  credentials: Schema.optionalKey(Schema.Literals(['include', 'same-origin', 'omit'])).annotate({
    description:
      'The `credentials` of every request the client sends, `hc(baseUrl, { init: { credentials } })`. Left out, nothing is written.',
  }),
  rpc: moved('rpc', 'rpc'),
  swr: moved('swr', 'swr'),
  tanstackQuery: moved('tanstackQuery', 'tanstack-query'),
  svelteQuery: moved('svelteQuery', 'svelte-query'),
  vueQuery: moved('vueQuery', 'vue-query'),
  preactQuery: moved('preactQuery', 'preact-query'),
  solidQuery: moved('solidQuery', 'solid-query'),
  angularQuery: moved('angularQuery', 'angular-query'),
  type: moved('type', 'type'),
  docs: moved('docs', 'docs'),
}).annotate({ title: 'Typed client' })

const DocsOutputSchema = Schema.declare<`${string}.md`>(
  Schema.is(Schema.TemplateLiteral([Schema.String, '.md'])),
  { message: 'must be .md file' },
)

const DocsUrlSchema = Schema.String.check(
  Schema.isPattern(/^[^\s'"`\\]+$/u, { message: 'must be a URL, with no whitespace or quotes' }),
)

/** Discriminated on `curl`, as hono-takibi's: with it `baseUrl` is required and `entry` refused. */
const DocsSchema = Schema.Union([
  Schema.Struct({
    output: DocsOutputSchema,
    curl: Schema.Literal(true),
    baseUrl: DocsUrlSchema.pipe(
      Schema.annotateKey({ messageMissingKey: 'baseUrl is required when curl is true' }),
    ),
    entry: removed('entry cannot be specified when curl is true'),
  }),
  Schema.Struct({
    output: DocsOutputSchema,
    curl: Schema.Literal(false).pipe(Schema.withDecodingDefault(Effect.succeed(false))),
    entry: Schema.optionalKey(Schema.String),
    baseUrl: Schema.optionalKey(DocsUrlSchema),
  }),
])

/** The client-side keys, each opt-in and keyed as hono-takibi keys them. */
const CLIENT_FIELDS = {
  type: Schema.optionalKey(
    Schema.Struct({ output: TypeScriptPathSchema, readonly: Schema.optionalKey(Schema.Boolean) }),
  ),
  client: Schema.optionalKey(ClientSchema),
  rpc: Schema.optionalKey(
    Schema.Struct({
      ...CLIENT_CALLER_FIELDS,
      parseResponse: Schema.optionalKey(Schema.Boolean),
      docs: Schema.optionalKey(Schema.Boolean),
    }),
  ),
  swr: Schema.optionalKey(HookSchema),
  'tanstack-query': Schema.optionalKey(HookSchema),
  'preact-query': Schema.optionalKey(HookSchema),
  'solid-query': Schema.optionalKey(HookSchema),
  'vue-query': Schema.optionalKey(HookSchema),
  'svelte-query': Schema.optionalKey(HookSchema),
  'angular-query': Schema.optionalKey(HookSchema),
  docs: Schema.optionalKey(DocsSchema),
}

const ComponentsSchema = Schema.Struct({
  output: Schema.optionalKey(TypeScriptPathSchema),
  package: Schema.optionalKey(PackageSchema),
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
  Schema.makeFilter(
    (components) => components.package === undefined || components.output !== undefined,
    {
      message:
        'components.package goes with components.output: a per-type output names its package in its own block.',
    },
  ),
)

const ConfigSchema = Schema.Struct({
  input: InputSchema,
  output: Schema.optionalKey(DirectorySchema),
  basePath: Schema.optionalKey(Schema.String),
  schema: Schema.Literals(['zod', 'valibot', 'typebox', 'arktype', 'effect']),
  openapi: Schema.optionalKey(Schema.Boolean),
  defineHandler: Schema.optionalKey(
    Schema.Union([Schema.Boolean, Schema.Struct({ output: TypeScriptPathSchema })]),
  ).annotate({
    description:
      "Hono's `defineHandler` (hono/factory, Hono 5) in place of the validator middleware. A definitions module, `routes.ts` beside the app entry or `output`, declares one `<method><Path>Handler = defineHandler({...})` per operation (`postPetsHandler`), validating the request targets and the response; each handler file calls its definitions with the handlers. Not combined with `openapi`, whose validators are middleware in front of the handler, nor with `schema: 'typebox'`, which has no Standard Schema interface.",
  }),
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
  split: Schema.optionalKey(Schema.Boolean).annotate({
    description:
      "Divide the app into groups, one per handler file (the first segment of the path): the app entry exports each under its name instead of `api`, and the client is one client per group (`petsClient`), so that a client of one group resolves the routes of that group and not of the whole app. Every group is registered on the one app. As hono-takibi's `template.split`.",
  }),
  ...CLIENT_FIELDS,
  pathAlias: Schema.optionalKey(Schema.String),
  components: Schema.optionalKey(ComponentsSchema),
  // Test generation is not provided. hono-takibi once scaffolded a test file per handler and
  // retired it (its config rejects `test` / `testFramework` the same way); takibi-hono never
  // took it on, and says so to a config that asks.
  test: removed(
    'test is not provided: takibi-hono generates no test files. Write them against the handlers it generates.',
  ),
  testFramework: removed('testFramework is not provided: takibi-hono generates no test files.'),
})
  .check(
    Schema.makeFilter(
      (config) => {
        if (config.client !== undefined) return true
        const missing = (['rpc', ...HOOK_LIBRARIES] as const).find(
          (kind) => config[kind] !== undefined,
        )
        return missing === undefined
          ? true
          : `${missing} needs client: rpc and the hooks call the client the client block generates.`
      },
      { message: 'a generator that calls the client needs the client block' },
    ),
    Schema.makeFilter((config) => config.defineHandler !== true || config.openapi !== true, {
      message:
        'defineHandler cannot be combined with openapi: hono-openapi reads the validators in front of a handler, and defineHandler validates inside it.',
    }),
    Schema.makeFilter((config) => config.defineHandler !== true || config.schema !== 'typebox', {
      message:
        'defineHandler takes Standard Schema validators, which typebox has none of: pick zod, valibot, arktype or effect.',
    }),
  )
  .annotate({ title: 'takibi-hono config' })

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
      // The Vite plugin SSR-loads this module through the user's config file; the specifier
      // is a runtime file URL, so Vite's import analysis has nothing to resolve.
      try: () => import(/* @vite-ignore */ specifier),
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
