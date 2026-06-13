import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

import type { FormatConfig } from 'oxfmt'
import * as v from 'valibot'

const DirectoryOutputSchema = v.pipe(
  v.string(),
  v.regex(/^(?!.*\.ts$).+/, 'split mode requires directory, not .ts file'),
)

const FileOutputSchema = v.pipe(
  v.string(),
  v.transform((value) => (value.endsWith('.ts') ? value : `${value}/index.ts`)),
)

const OutputSchema = v.exactOptional(
  v.variant('split', [
    v.pipe(
      v.strictObject({
        split: v.literal(true),
        output: DirectoryOutputSchema,
        import: v.exactOptional(v.string()),
      }),
      v.readonly(),
    ),
    v.pipe(
      v.strictObject({
        split: v.exactOptional(v.literal(false)),
        output: FileOutputSchema,
        import: v.exactOptional(v.string()),
      }),
      v.readonly(),
    ),
  ]),
)

const ExportTypesOutputSchema = v.exactOptional(
  v.variant('split', [
    v.pipe(
      v.strictObject({
        split: v.literal(true),
        output: DirectoryOutputSchema,
        import: v.exactOptional(v.string()),
        exportTypes: v.exactOptional(v.boolean()),
      }),
      v.readonly(),
    ),
    v.pipe(
      v.strictObject({
        split: v.exactOptional(v.literal(false)),
        output: FileOutputSchema,
        import: v.exactOptional(v.string()),
        exportTypes: v.exactOptional(v.boolean()),
      }),
      v.readonly(),
    ),
  ]),
)

const RpcSchema = v.exactOptional(
  v.pipe(
    v.strictObject({
      output: v.string(),
      import: v.string(),
      split: v.exactOptional(v.boolean()),
      client: v.exactOptional(v.string()),
      parseResponse: v.exactOptional(v.boolean()),
      docs: v.exactOptional(v.boolean()),
    }),
    v.readonly(),
  ),
)

const ClientQuerySchema = v.pipe(
  v.strictObject({
    output: v.string(),
    import: v.string(),
    split: v.exactOptional(v.boolean()),
    client: v.exactOptional(v.string()),
  }),
  v.readonly(),
)

const ClientSchema = v.pipe(
  v.strictObject({
    rpc: RpcSchema,
    swr: v.exactOptional(ClientQuerySchema),
    tanstackQuery: v.exactOptional(ClientQuerySchema),
    svelteQuery: v.exactOptional(ClientQuerySchema),
    vueQuery: v.exactOptional(ClientQuerySchema),
    preactQuery: v.exactOptional(ClientQuerySchema),
    solidQuery: v.exactOptional(ClientQuerySchema),
    angularQuery: v.exactOptional(ClientQuerySchema),
    type: v.exactOptional(
      v.pipe(
        v.strictObject({
          output: v.pipe(v.string(), v.regex(/\.ts$/, 'type output must be a .ts file')),
          readonly: v.exactOptional(v.boolean()),
        }),
        v.readonly(),
      ),
    ),
    docs: v.exactOptional(
      v.pipe(
        v.strictObject({
          output: v.string(),
          entry: v.exactOptional(v.string()),
          basePath: v.exactOptional(v.string()),
          curl: v.exactOptional(v.boolean()),
          baseUrl: v.exactOptional(v.string()),
        }),
        v.readonly(),
      ),
    ),
  }),
  v.readonly(),
)

const ConfigSchema = v.pipe(
  v.strictObject({
    input: v.custom<`${string}.yaml` | `${string}.json` | `${string}.tsp`>(
      (v) =>
        typeof v === 'string' && (v.endsWith('.yaml') || v.endsWith('.json') || v.endsWith('.tsp')),
      'input must be .yaml | .json | .tsp',
    ),
    output: v.exactOptional(
      v.pipe(v.string(), v.regex(/^(?!.*\.ts$).+/, 'output must be a directory, not a .ts file')),
    ),
    basePath: v.exactOptional(v.string()),
    schema: v.picklist(
      ['zod', 'valibot', 'typebox', 'arktype', 'effect'] as const,
      'schema must be "zod" | "valibot" | "typebox" | "arktype" | "effect"',
    ),
    openapi: v.exactOptional(v.boolean()),
    format: v.exactOptional(v.custom<FormatConfig>(() => true)),
    readonly: v.exactOptional(v.boolean()),
    client: v.exactOptional(ClientSchema),
    pathAlias: v.exactOptional(v.string()),
    components: v.exactOptional(
      v.pipe(
        v.strictObject({
          output: v.exactOptional(v.string()),
          schemas: ExportTypesOutputSchema,
          responses: OutputSchema,
          parameters: ExportTypesOutputSchema,
          examples: OutputSchema,
          requestBodies: OutputSchema,
          headers: ExportTypesOutputSchema,
          securitySchemes: OutputSchema,
          links: OutputSchema,
          callbacks: OutputSchema,
          pathItems: OutputSchema,
          mediaTypes: ExportTypesOutputSchema,
        }),
        v.check(
          (c) =>
            !(
              c.output &&
              (
                [
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
              ).some((k) => c[k] !== undefined)
            ),
          'components.output is mutually exclusive with per-type component outputs (schemas, responses, ...). Use output for single-file mode, or per-type fields for split mode.',
        ),
        v.readonly(),
      ),
    ),
  }),
  v.readonly(),
)

export function parseConfig(config: unknown) {
  const result = v.safeParse(ConfigSchema, config)
  if (!result.success) {
    const issue = result.issues[0]
    const path = issue.path ? issue.path.map((p) => ('key' in p ? p.key : String(p))).join('.') : ''
    const prefix = path ? `${path}: ` : ''
    return { ok: false, error: `Invalid config: ${prefix}${issue.message}` } as const
  }
  return { ok: true, value: result.output } as const
}

export async function readConfig() {
  const abs = resolve(process.cwd(), 'takibi-hono.config.ts')
  if (!existsSync(abs))
    return {
      ok: false,
      error: `Config not found: ${abs}\nCreate takibi-hono.config.ts in the current directory. See https://github.com/nakita628/takibi-hono#configuration for an example.`,
    } as const
  try {
    const mod = await import(pathToFileURL(abs).href)
    if (
      typeof mod !== 'object' ||
      mod === null ||
      !('default' in mod) ||
      mod.default === undefined
    ) {
      return {
        ok: false,
        error: `Config must export default object from ${abs}\nDid you forget \`export default defineConfig({ ... })\`?`,
      } as const
    }
    return parseConfig(mod.default)
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) } as const
  }
}

export function defineConfig(config: v.InferInput<typeof ConfigSchema>) {
  return config
}
