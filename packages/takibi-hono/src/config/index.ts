import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

import type { FormatConfig } from 'oxfmt'
import * as v from 'valibot'

const ConfigSchema = v.strictObject({
  input: v.custom<`${string}.yaml` | `${string}.json` | `${string}.tsp`>(
    (v) =>
      typeof v === 'string' &&
      (v.endsWith('.yaml') || v.endsWith('.json') || v.endsWith('.tsp')),
    'input must be .yaml | .json | .tsp',
  ),
  basePath: v.exactOptional(v.string()),
  schema: v.picklist(
    ['zod', 'valibot', 'typebox', 'arktype', 'effect'] as const,
    'schema must be "zod" | "valibot" | "typebox" | "arktype" | "effect"',
  ),
  openapi: v.exactOptional(v.boolean()),
  format: v.exactOptional(v.custom<FormatConfig>(() => true)),
  'takibi-hono': v.exactOptional(
    v.strictObject({
      readonly: v.exactOptional(v.boolean()),
      exportSchemasTypes: v.exactOptional(v.boolean()),
      exportParametersTypes: v.exactOptional(v.boolean()),
      exportHeadersTypes: v.exactOptional(v.boolean()),
      handlers: v.exactOptional(v.strictObject({ output: v.string() })),
      components: v.exactOptional(
        v.strictObject({
          output: v.exactOptional(v.string()),
          schemas: v.exactOptional(
            v.variant('split', [
              v.strictObject({
                split: v.literal(true),
                output: v.pipe(
                  v.string(),
                  v.regex(/^(?!.*\.ts$).+/, 'split mode requires directory, not .ts file'),
                ),
                import: v.exactOptional(v.string()),
                exportTypes: v.exactOptional(v.boolean()),
              }),
              v.strictObject({
                split: v.exactOptional(v.literal(false)),
                output: v.pipe(
                  v.string(),
                  v.transform((v) => (v.endsWith('.ts') ? v : `${v}/index.ts`)),
                ),
                import: v.exactOptional(v.string()),
                exportTypes: v.exactOptional(v.boolean()),
              }),
            ]),
          ),
          parameters: v.exactOptional(
            v.variant('split', [
              v.strictObject({
                split: v.literal(true),
                output: v.pipe(
                  v.string(),
                  v.regex(/^(?!.*\.ts$).+/, 'split mode requires directory, not .ts file'),
                ),
                import: v.exactOptional(v.string()),
                exportTypes: v.exactOptional(v.boolean()),
              }),
              v.strictObject({
                split: v.exactOptional(v.literal(false)),
                output: v.pipe(
                  v.string(),
                  v.transform((v) => (v.endsWith('.ts') ? v : `${v}/index.ts`)),
                ),
                import: v.exactOptional(v.string()),
                exportTypes: v.exactOptional(v.boolean()),
              }),
            ]),
          ),
          headers: v.exactOptional(
            v.variant('split', [
              v.strictObject({
                split: v.literal(true),
                output: v.pipe(
                  v.string(),
                  v.regex(/^(?!.*\.ts$).+/, 'split mode requires directory, not .ts file'),
                ),
                import: v.exactOptional(v.string()),
                exportTypes: v.exactOptional(v.boolean()),
              }),
              v.strictObject({
                split: v.exactOptional(v.literal(false)),
                output: v.pipe(
                  v.string(),
                  v.transform((v) => (v.endsWith('.ts') ? v : `${v}/index.ts`)),
                ),
                import: v.exactOptional(v.string()),
                exportTypes: v.exactOptional(v.boolean()),
              }),
            ]),
          ),
          securitySchemes: v.exactOptional(
            v.variant('split', [
              v.strictObject({
                split: v.literal(true),
                output: v.pipe(
                  v.string(),
                  v.regex(/^(?!.*\.ts$).+/, 'split mode requires directory, not .ts file'),
                ),
                import: v.exactOptional(v.string()),
                exportTypes: v.exactOptional(v.boolean()),
              }),
              v.strictObject({
                split: v.exactOptional(v.literal(false)),
                output: v.pipe(
                  v.string(),
                  v.transform((v) => (v.endsWith('.ts') ? v : `${v}/index.ts`)),
                ),
                import: v.exactOptional(v.string()),
                exportTypes: v.exactOptional(v.boolean()),
              }),
            ]),
          ),
          requestBodies: v.exactOptional(
            v.variant('split', [
              v.strictObject({
                split: v.literal(true),
                output: v.pipe(
                  v.string(),
                  v.regex(/^(?!.*\.ts$).+/, 'split mode requires directory, not .ts file'),
                ),
                import: v.exactOptional(v.string()),
                exportTypes: v.exactOptional(v.boolean()),
              }),
              v.strictObject({
                split: v.exactOptional(v.literal(false)),
                output: v.pipe(
                  v.string(),
                  v.transform((v) => (v.endsWith('.ts') ? v : `${v}/index.ts`)),
                ),
                import: v.exactOptional(v.string()),
                exportTypes: v.exactOptional(v.boolean()),
              }),
            ]),
          ),
          responses: v.exactOptional(
            v.variant('split', [
              v.strictObject({
                split: v.literal(true),
                output: v.pipe(
                  v.string(),
                  v.regex(/^(?!.*\.ts$).+/, 'split mode requires directory, not .ts file'),
                ),
                import: v.exactOptional(v.string()),
                exportTypes: v.exactOptional(v.boolean()),
              }),
              v.strictObject({
                split: v.exactOptional(v.literal(false)),
                output: v.pipe(
                  v.string(),
                  v.transform((v) => (v.endsWith('.ts') ? v : `${v}/index.ts`)),
                ),
                import: v.exactOptional(v.string()),
                exportTypes: v.exactOptional(v.boolean()),
              }),
            ]),
          ),
          examples: v.exactOptional(
            v.variant('split', [
              v.strictObject({
                split: v.literal(true),
                output: v.pipe(
                  v.string(),
                  v.regex(/^(?!.*\.ts$).+/, 'split mode requires directory, not .ts file'),
                ),
                import: v.exactOptional(v.string()),
                exportTypes: v.exactOptional(v.boolean()),
              }),
              v.strictObject({
                split: v.exactOptional(v.literal(false)),
                output: v.pipe(
                  v.string(),
                  v.transform((v) => (v.endsWith('.ts') ? v : `${v}/index.ts`)),
                ),
                import: v.exactOptional(v.string()),
                exportTypes: v.exactOptional(v.boolean()),
              }),
            ]),
          ),
          links: v.exactOptional(
            v.variant('split', [
              v.strictObject({
                split: v.literal(true),
                output: v.pipe(
                  v.string(),
                  v.regex(/^(?!.*\.ts$).+/, 'split mode requires directory, not .ts file'),
                ),
                import: v.exactOptional(v.string()),
                exportTypes: v.exactOptional(v.boolean()),
              }),
              v.strictObject({
                split: v.exactOptional(v.literal(false)),
                output: v.pipe(
                  v.string(),
                  v.transform((v) => (v.endsWith('.ts') ? v : `${v}/index.ts`)),
                ),
                import: v.exactOptional(v.string()),
                exportTypes: v.exactOptional(v.boolean()),
              }),
            ]),
          ),
          callbacks: v.exactOptional(
            v.variant('split', [
              v.strictObject({
                split: v.literal(true),
                output: v.pipe(
                  v.string(),
                  v.regex(/^(?!.*\.ts$).+/, 'split mode requires directory, not .ts file'),
                ),
                import: v.exactOptional(v.string()),
                exportTypes: v.exactOptional(v.boolean()),
              }),
              v.strictObject({
                split: v.exactOptional(v.literal(false)),
                output: v.pipe(
                  v.string(),
                  v.transform((v) => (v.endsWith('.ts') ? v : `${v}/index.ts`)),
                ),
                import: v.exactOptional(v.string()),
                exportTypes: v.exactOptional(v.boolean()),
              }),
            ]),
          ),
          pathItems: v.exactOptional(
            v.variant('split', [
              v.strictObject({
                split: v.literal(true),
                output: v.pipe(
                  v.string(),
                  v.regex(/^(?!.*\.ts$).+/, 'split mode requires directory, not .ts file'),
                ),
                import: v.exactOptional(v.string()),
                exportTypes: v.exactOptional(v.boolean()),
              }),
              v.strictObject({
                split: v.exactOptional(v.literal(false)),
                output: v.pipe(
                  v.string(),
                  v.transform((v) => (v.endsWith('.ts') ? v : `${v}/index.ts`)),
                ),
                import: v.exactOptional(v.string()),
                exportTypes: v.exactOptional(v.boolean()),
              }),
            ]),
          ),
          webhooks: v.exactOptional(
            v.variant('split', [
              v.strictObject({
                split: v.literal(true),
                output: v.pipe(
                  v.string(),
                  v.regex(/^(?!.*\.ts$).+/, 'split mode requires directory, not .ts file'),
                ),
                import: v.exactOptional(v.string()),
                exportTypes: v.exactOptional(v.boolean()),
              }),
              v.strictObject({
                split: v.exactOptional(v.literal(false)),
                output: v.pipe(
                  v.string(),
                  v.transform((v) => (v.endsWith('.ts') ? v : `${v}/index.ts`)),
                ),
                import: v.exactOptional(v.string()),
                exportTypes: v.exactOptional(v.boolean()),
              }),
            ]),
          ),
        }),
      ),
    }),
  ),
})

export function parseConfig(config: unknown) {
  const result = v.safeParse(ConfigSchema, config)
  if (!result.success) {
    const issue = result.issues[0]
    const path = issue.path
      ? issue.path.map((p) => ('key' in p ? p.key : String(p))).join('.')
      : ''
    const prefix = path ? `${path}: ` : ''
    return { ok: false, error: `Invalid config: ${prefix}${issue.message}` } as const
  }
  return { ok: true, value: result.output } as const
}

export async function readConfig() {
  const abs = resolve(process.cwd(), 'takibi-hono.config.ts')
  if (!existsSync(abs)) return { ok: false, error: `Config not found: ${abs}` } as const
  try {
    const mod = await import(pathToFileURL(abs).href)
    if (
      typeof mod !== 'object' ||
      mod === null ||
      !('default' in mod) ||
      mod.default === undefined
    ) {
      return { ok: false, error: 'Config must export default object' } as const
    }
    return parseConfig(mod.default)
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) } as const
  }
}

export function defineConfig(config: v.InferInput<typeof ConfigSchema>) {
  return config
}
