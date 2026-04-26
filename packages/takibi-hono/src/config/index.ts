import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

import type { FormatConfig } from 'oxfmt'
import { register } from 'tsx/esm/api'
import * as v from 'valibot'

const ConfigSchema = v.pipe(
  v.object({
    input: v.custom<`${string}.yaml` | `${string}.json` | `${string}.tsp`>(
      (val) =>
        typeof val === 'string' &&
        (val.endsWith('.yaml') || val.endsWith('.json') || val.endsWith('.tsp')),
      'input must be .yaml | .json | .tsp',
    ),
    basePath: v.exactOptional(v.string()),
    schema: v.union(
      [
        v.literal('zod'),
        v.literal('valibot'),
        v.literal('typebox'),
        v.literal('arktype'),
        v.literal('effect'),
      ],
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
        handlers: v.exactOptional(
          v.strictObject({
            output: v.string(),
          }),
        ),
        components: v.exactOptional(
          v.strictObject({
            output: v.exactOptional(v.string()),
            schemas: v.exactOptional(
              v.pipe(
                v.strictObject({
                  output: v.string(),
                  exportTypes: v.exactOptional(v.boolean()),
                  split: v.exactOptional(v.boolean()),
                  import: v.exactOptional(v.string()),
                }),
                v.check(
                  (val) => !(val.split === true && val.output.endsWith('.ts')),
                  'split mode requires directory, not .ts file',
                ),
              ),
            ),
            parameters: v.exactOptional(
              v.pipe(
                v.strictObject({
                  output: v.string(),
                  exportTypes: v.exactOptional(v.boolean()),
                  split: v.exactOptional(v.boolean()),
                  import: v.exactOptional(v.string()),
                }),
                v.check(
                  (val) => !(val.split === true && val.output.endsWith('.ts')),
                  'split mode requires directory, not .ts file',
                ),
              ),
            ),
            headers: v.exactOptional(
              v.pipe(
                v.strictObject({
                  output: v.string(),
                  exportTypes: v.exactOptional(v.boolean()),
                  split: v.exactOptional(v.boolean()),
                  import: v.exactOptional(v.string()),
                }),
                v.check(
                  (val) => !(val.split === true && val.output.endsWith('.ts')),
                  'split mode requires directory, not .ts file',
                ),
              ),
            ),
            securitySchemes: v.exactOptional(
              v.pipe(
                v.strictObject({
                  output: v.string(),
                  exportTypes: v.exactOptional(v.boolean()),
                  split: v.exactOptional(v.boolean()),
                  import: v.exactOptional(v.string()),
                }),
                v.check(
                  (val) => !(val.split === true && val.output.endsWith('.ts')),
                  'split mode requires directory, not .ts file',
                ),
              ),
            ),
            requestBodies: v.exactOptional(
              v.pipe(
                v.strictObject({
                  output: v.string(),
                  exportTypes: v.exactOptional(v.boolean()),
                  split: v.exactOptional(v.boolean()),
                  import: v.exactOptional(v.string()),
                }),
                v.check(
                  (val) => !(val.split === true && val.output.endsWith('.ts')),
                  'split mode requires directory, not .ts file',
                ),
              ),
            ),
            responses: v.exactOptional(
              v.pipe(
                v.strictObject({
                  output: v.string(),
                  exportTypes: v.exactOptional(v.boolean()),
                  split: v.exactOptional(v.boolean()),
                  import: v.exactOptional(v.string()),
                }),
                v.check(
                  (val) => !(val.split === true && val.output.endsWith('.ts')),
                  'split mode requires directory, not .ts file',
                ),
              ),
            ),
            examples: v.exactOptional(
              v.pipe(
                v.strictObject({
                  output: v.string(),
                  exportTypes: v.exactOptional(v.boolean()),
                  split: v.exactOptional(v.boolean()),
                  import: v.exactOptional(v.string()),
                }),
                v.check(
                  (val) => !(val.split === true && val.output.endsWith('.ts')),
                  'split mode requires directory, not .ts file',
                ),
              ),
            ),
            links: v.exactOptional(
              v.pipe(
                v.strictObject({
                  output: v.string(),
                  exportTypes: v.exactOptional(v.boolean()),
                  split: v.exactOptional(v.boolean()),
                  import: v.exactOptional(v.string()),
                }),
                v.check(
                  (val) => !(val.split === true && val.output.endsWith('.ts')),
                  'split mode requires directory, not .ts file',
                ),
              ),
            ),
            callbacks: v.exactOptional(
              v.pipe(
                v.strictObject({
                  output: v.string(),
                  exportTypes: v.exactOptional(v.boolean()),
                  split: v.exactOptional(v.boolean()),
                  import: v.exactOptional(v.string()),
                }),
                v.check(
                  (val) => !(val.split === true && val.output.endsWith('.ts')),
                  'split mode requires directory, not .ts file',
                ),
              ),
            ),
            pathItems: v.exactOptional(
              v.pipe(
                v.strictObject({
                  output: v.string(),
                  exportTypes: v.exactOptional(v.boolean()),
                  split: v.exactOptional(v.boolean()),
                  import: v.exactOptional(v.string()),
                }),
                v.check(
                  (val) => !(val.split === true && val.output.endsWith('.ts')),
                  'split mode requires directory, not .ts file',
                ),
              ),
            ),
            webhooks: v.exactOptional(
              v.pipe(
                v.strictObject({
                  output: v.string(),
                  exportTypes: v.exactOptional(v.boolean()),
                  split: v.exactOptional(v.boolean()),
                  import: v.exactOptional(v.string()),
                }),
                v.check(
                  (val) => !(val.split === true && val.output.endsWith('.ts')),
                  'split mode requires directory, not .ts file',
                ),
              ),
            ),
          }),
        ),
      }),
    ),
  }),
  v.transform((config) => {
    const normalize = <T extends { output: string; split?: boolean }>(val: T): T =>
      val.split !== true && !val.output.endsWith('.ts')
        ? { ...val, output: `${val.output}/index.ts` }
        : val
    const takibiHono = config['takibi-hono']
    if (!takibiHono) return config
    return {
      ...config,
      'takibi-hono': {
        ...takibiHono,
        ...(takibiHono.components && {
          components: {
            ...(takibiHono.components.output !== undefined && {
              output: takibiHono.components.output,
            }),
            ...Object.fromEntries(
              Object.entries(takibiHono.components).flatMap(([k, v]) => {
                if (k === 'output' || v === undefined || typeof v !== 'object' || v === null) {
                  return []
                }
                const component = v satisfies { output: string; split?: boolean }
                return [[k, normalize(component)]]
              }),
            ),
          },
        }),
      },
    }
  }),
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
    register()
    const url = pathToFileURL(abs).href
    // eslint-disable-next-line typescript-eslint/no-implied-eval
    const mod = await new Function('specifier', 'return import(specifier)')(url)
    if (!('default' in mod) || mod.default === undefined) {
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
