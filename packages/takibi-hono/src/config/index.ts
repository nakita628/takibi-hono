import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

import type { FormatConfig } from 'oxfmt'
import * as v from 'valibot'

const ConfigSchema = v.pipe(
  v.strictObject({
    input: v.custom<`${string}.yaml` | `${string}.json` | `${string}.tsp`>(
      (v) =>
        typeof v === 'string' && (v.endsWith('.yaml') || v.endsWith('.json') || v.endsWith('.tsp')),
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
      v.pipe(
        v.strictObject({
          readonly: v.exactOptional(v.boolean()),
          exportSchemasTypes: v.exactOptional(v.boolean()),
          exportParametersTypes: v.exactOptional(v.boolean()),
          exportHeadersTypes: v.exactOptional(v.boolean()),
          handlers: v.exactOptional(v.pipe(v.strictObject({ output: v.string() }), v.readonly())),
          components: v.exactOptional(
            v.pipe(
              v.strictObject({
                output: v.exactOptional(v.string()),
                schemas: v.exactOptional(
                  v.variant('split', [
                    v.pipe(
                      v.strictObject({
                        split: v.literal(true),
                        output: v.pipe(
                          v.string(),
                          v.regex(/^(?!.*\.ts$).+/, 'split mode requires directory, not .ts file'),
                        ),
                        import: v.exactOptional(v.string()),
                        exportTypes: v.exactOptional(v.boolean()),
                      }),
                      v.readonly(),
                    ),
                    v.pipe(
                      v.strictObject({
                        split: v.exactOptional(v.literal(false)),
                        output: v.pipe(
                          v.string(),
                          v.transform((v) => (v.endsWith('.ts') ? v : `${v}/index.ts`)),
                        ),
                        import: v.exactOptional(v.string()),
                        exportTypes: v.exactOptional(v.boolean()),
                      }),
                      v.readonly(),
                    ),
                  ]),
                ),
                responses: v.exactOptional(
                  v.variant('split', [
                    v.pipe(
                      v.strictObject({
                        split: v.literal(true),
                        output: v.pipe(
                          v.string(),
                          v.regex(/^(?!.*\.ts$).+/, 'split mode requires directory, not .ts file'),
                        ),
                        import: v.exactOptional(v.string()),
                        exportTypes: v.exactOptional(v.boolean()),
                      }),
                      v.readonly(),
                    ),
                    v.pipe(
                      v.strictObject({
                        split: v.exactOptional(v.literal(false)),
                        output: v.pipe(
                          v.string(),
                          v.transform((v) => (v.endsWith('.ts') ? v : `${v}/index.ts`)),
                        ),
                        import: v.exactOptional(v.string()),
                        exportTypes: v.exactOptional(v.boolean()),
                      }),
                      v.readonly(),
                    ),
                  ]),
                ),
                parameters: v.exactOptional(
                  v.variant('split', [
                    v.pipe(
                      v.strictObject({
                        split: v.literal(true),
                        output: v.pipe(
                          v.string(),
                          v.regex(/^(?!.*\.ts$).+/, 'split mode requires directory, not .ts file'),
                        ),
                        import: v.exactOptional(v.string()),
                        exportTypes: v.exactOptional(v.boolean()),
                      }),
                      v.readonly(),
                    ),
                    v.pipe(
                      v.strictObject({
                        split: v.exactOptional(v.literal(false)),
                        output: v.pipe(
                          v.string(),
                          v.transform((v) => (v.endsWith('.ts') ? v : `${v}/index.ts`)),
                        ),
                        import: v.exactOptional(v.string()),
                        exportTypes: v.exactOptional(v.boolean()),
                      }),
                      v.readonly(),
                    ),
                  ]),
                ),
                examples: v.exactOptional(
                  v.variant('split', [
                    v.pipe(
                      v.strictObject({
                        split: v.literal(true),
                        output: v.pipe(
                          v.string(),
                          v.regex(/^(?!.*\.ts$).+/, 'split mode requires directory, not .ts file'),
                        ),
                        import: v.exactOptional(v.string()),
                        exportTypes: v.exactOptional(v.boolean()),
                      }),
                      v.readonly(),
                    ),
                    v.pipe(
                      v.strictObject({
                        split: v.exactOptional(v.literal(false)),
                        output: v.pipe(
                          v.string(),
                          v.transform((v) => (v.endsWith('.ts') ? v : `${v}/index.ts`)),
                        ),
                        import: v.exactOptional(v.string()),
                        exportTypes: v.exactOptional(v.boolean()),
                      }),
                      v.readonly(),
                    ),
                  ]),
                ),
                requestBodies: v.exactOptional(
                  v.variant('split', [
                    v.pipe(
                      v.strictObject({
                        split: v.literal(true),
                        output: v.pipe(
                          v.string(),
                          v.regex(/^(?!.*\.ts$).+/, 'split mode requires directory, not .ts file'),
                        ),
                        import: v.exactOptional(v.string()),
                        exportTypes: v.exactOptional(v.boolean()),
                      }),
                      v.readonly(),
                    ),
                    v.pipe(
                      v.strictObject({
                        split: v.exactOptional(v.literal(false)),
                        output: v.pipe(
                          v.string(),
                          v.transform((v) => (v.endsWith('.ts') ? v : `${v}/index.ts`)),
                        ),
                        import: v.exactOptional(v.string()),
                        exportTypes: v.exactOptional(v.boolean()),
                      }),
                      v.readonly(),
                    ),
                  ]),
                ),
                headers: v.exactOptional(
                  v.variant('split', [
                    v.pipe(
                      v.strictObject({
                        split: v.literal(true),
                        output: v.pipe(
                          v.string(),
                          v.regex(/^(?!.*\.ts$).+/, 'split mode requires directory, not .ts file'),
                        ),
                        import: v.exactOptional(v.string()),
                        exportTypes: v.exactOptional(v.boolean()),
                      }),
                      v.readonly(),
                    ),
                    v.pipe(
                      v.strictObject({
                        split: v.exactOptional(v.literal(false)),
                        output: v.pipe(
                          v.string(),
                          v.transform((v) => (v.endsWith('.ts') ? v : `${v}/index.ts`)),
                        ),
                        import: v.exactOptional(v.string()),
                        exportTypes: v.exactOptional(v.boolean()),
                      }),
                      v.readonly(),
                    ),
                  ]),
                ),
                securitySchemes: v.exactOptional(
                  v.variant('split', [
                    v.pipe(
                      v.strictObject({
                        split: v.literal(true),
                        output: v.pipe(
                          v.string(),
                          v.regex(/^(?!.*\.ts$).+/, 'split mode requires directory, not .ts file'),
                        ),
                        import: v.exactOptional(v.string()),
                        exportTypes: v.exactOptional(v.boolean()),
                      }),
                      v.readonly(),
                    ),
                    v.pipe(
                      v.strictObject({
                        split: v.exactOptional(v.literal(false)),
                        output: v.pipe(
                          v.string(),
                          v.transform((v) => (v.endsWith('.ts') ? v : `${v}/index.ts`)),
                        ),
                        import: v.exactOptional(v.string()),
                        exportTypes: v.exactOptional(v.boolean()),
                      }),
                      v.readonly(),
                    ),
                  ]),
                ),
                links: v.exactOptional(
                  v.variant('split', [
                    v.pipe(
                      v.strictObject({
                        split: v.literal(true),
                        output: v.pipe(
                          v.string(),
                          v.regex(/^(?!.*\.ts$).+/, 'split mode requires directory, not .ts file'),
                        ),
                        import: v.exactOptional(v.string()),
                        exportTypes: v.exactOptional(v.boolean()),
                      }),
                      v.readonly(),
                    ),
                    v.pipe(
                      v.strictObject({
                        split: v.exactOptional(v.literal(false)),
                        output: v.pipe(
                          v.string(),
                          v.transform((v) => (v.endsWith('.ts') ? v : `${v}/index.ts`)),
                        ),
                        import: v.exactOptional(v.string()),
                        exportTypes: v.exactOptional(v.boolean()),
                      }),
                      v.readonly(),
                    ),
                  ]),
                ),
                callbacks: v.exactOptional(
                  v.variant('split', [
                    v.pipe(
                      v.strictObject({
                        split: v.literal(true),
                        output: v.pipe(
                          v.string(),
                          v.regex(/^(?!.*\.ts$).+/, 'split mode requires directory, not .ts file'),
                        ),
                        import: v.exactOptional(v.string()),
                        exportTypes: v.exactOptional(v.boolean()),
                      }),
                      v.readonly(),
                    ),
                    v.pipe(
                      v.strictObject({
                        split: v.exactOptional(v.literal(false)),
                        output: v.pipe(
                          v.string(),
                          v.transform((v) => (v.endsWith('.ts') ? v : `${v}/index.ts`)),
                        ),
                        import: v.exactOptional(v.string()),
                        exportTypes: v.exactOptional(v.boolean()),
                      }),
                      v.readonly(),
                    ),
                  ]),
                ),
                pathItems: v.exactOptional(
                  v.variant('split', [
                    v.pipe(
                      v.strictObject({
                        split: v.literal(true),
                        output: v.pipe(
                          v.string(),
                          v.regex(/^(?!.*\.ts$).+/, 'split mode requires directory, not .ts file'),
                        ),
                        import: v.exactOptional(v.string()),
                        exportTypes: v.exactOptional(v.boolean()),
                      }),
                      v.readonly(),
                    ),
                    v.pipe(
                      v.strictObject({
                        split: v.exactOptional(v.literal(false)),
                        output: v.pipe(
                          v.string(),
                          v.transform((v) => (v.endsWith('.ts') ? v : `${v}/index.ts`)),
                        ),
                        import: v.exactOptional(v.string()),
                        exportTypes: v.exactOptional(v.boolean()),
                      }),
                      v.readonly(),
                    ),
                  ]),
                ),
                mediaTypes: v.exactOptional(
                  v.variant('split', [
                    v.pipe(
                      v.strictObject({
                        split: v.literal(true),
                        output: v.pipe(
                          v.string(),
                          v.regex(/^(?!.*\.ts$).+/, 'split mode requires directory, not .ts file'),
                        ),
                        import: v.exactOptional(v.string()),
                        exportTypes: v.exactOptional(v.boolean()),
                      }),
                      v.readonly(),
                    ),
                    v.pipe(
                      v.strictObject({
                        split: v.exactOptional(v.literal(false)),
                        output: v.pipe(
                          v.string(),
                          v.transform((v) => (v.endsWith('.ts') ? v : `${v}/index.ts`)),
                        ),
                        import: v.exactOptional(v.string()),
                        exportTypes: v.exactOptional(v.boolean()),
                      }),
                      v.readonly(),
                    ),
                  ]),
                ),
                webhooks: v.exactOptional(
                  v.variant('split', [
                    v.pipe(
                      v.strictObject({
                        split: v.literal(true),
                        output: v.pipe(
                          v.string(),
                          v.regex(/^(?!.*\.ts$).+/, 'split mode requires directory, not .ts file'),
                        ),
                        import: v.exactOptional(v.string()),
                        exportTypes: v.exactOptional(v.boolean()),
                      }),
                      v.readonly(),
                    ),
                    v.pipe(
                      v.strictObject({
                        split: v.exactOptional(v.literal(false)),
                        output: v.pipe(
                          v.string(),
                          v.transform((v) => (v.endsWith('.ts') ? v : `${v}/index.ts`)),
                        ),
                        import: v.exactOptional(v.string()),
                        exportTypes: v.exactOptional(v.boolean()),
                      }),
                      v.readonly(),
                    ),
                  ]),
                ),
              }),
              v.readonly(),
            ),
          ),
        }),
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
