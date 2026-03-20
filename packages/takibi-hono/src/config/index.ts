import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

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
    format: v.exactOptional(
      v.strictObject({
        printWidth: v.exactOptional(v.number()),
        tabWidth: v.exactOptional(v.number()),
        useTabs: v.exactOptional(v.boolean()),
        endOfLine: v.exactOptional(v.union([v.literal('lf'), v.literal('crlf'), v.literal('cr')])),
        insertFinalNewline: v.exactOptional(v.boolean()),
        semi: v.exactOptional(v.boolean()),
        singleQuote: v.exactOptional(v.boolean()),
        jsxSingleQuote: v.exactOptional(v.boolean()),
        quoteProps: v.exactOptional(
          v.union([v.literal('as-needed'), v.literal('consistent'), v.literal('preserve')]),
        ),
        trailingComma: v.exactOptional(
          v.union([v.literal('all'), v.literal('es5'), v.literal('none')]),
        ),
        bracketSpacing: v.exactOptional(v.boolean()),
        bracketSameLine: v.exactOptional(v.boolean()),
        objectWrap: v.exactOptional(v.union([v.literal('preserve'), v.literal('collapse')])),
        arrowParens: v.exactOptional(v.union([v.literal('always'), v.literal('avoid')])),
        singleAttributePerLine: v.exactOptional(v.boolean()),
        proseWrap: v.exactOptional(
          v.union([v.literal('always'), v.literal('never'), v.literal('preserve')]),
        ),
        htmlWhitespaceSensitivity: v.exactOptional(
          v.union([v.literal('css'), v.literal('strict'), v.literal('ignore')]),
        ),
        vueIndentScriptAndStyle: v.exactOptional(v.boolean()),
        embeddedLanguageFormatting: v.exactOptional(v.union([v.literal('auto'), v.literal('off')])),
        experimentalSortImports: v.exactOptional(
          v.strictObject({
            partitionByNewline: v.exactOptional(v.boolean()),
            partitionByComment: v.exactOptional(v.boolean()),
            sortSideEffects: v.exactOptional(v.boolean()),
            order: v.exactOptional(v.union([v.literal('asc'), v.literal('desc')])),
            ignoreCase: v.exactOptional(v.boolean()),
            newlinesBetween: v.exactOptional(v.boolean()),
            internalPattern: v.exactOptional(v.array(v.string())),
            groups: v.exactOptional(v.array(v.union([v.string(), v.array(v.string())]))),
            customGroups: v.exactOptional(
              v.array(v.object({ groupName: v.string(), elementNamePattern: v.array(v.string()) })),
            ),
          }),
        ),
        experimentalSortPackageJson: v.exactOptional(v.boolean()),
        experimentalTailwindcss: v.exactOptional(
          v.strictObject({
            config: v.exactOptional(v.string()),
            stylesheet: v.exactOptional(v.string()),
            functions: v.exactOptional(v.array(v.string())),
            attributes: v.exactOptional(v.array(v.string())),
            preserveWhitespace: v.exactOptional(v.boolean()),
            preserveDuplicates: v.exactOptional(v.boolean()),
          }),
        ),
      }),
    ),
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

/**
 * Validates and parses a takibi-hono configuration object.
 */
export function parseConfig(
  config: unknown,
):
  | { readonly ok: true; readonly value: v.InferOutput<typeof ConfigSchema> }
  | { readonly ok: false; readonly error: string } {
  const result = v.safeParse(ConfigSchema, config)
  if (!result.success) {
    const issue = result.issues[0]
    const path = issue.path ? issue.path.map((p) => ('key' in p ? p.key : String(p))).join('.') : ''
    const prefix = path ? `${path}: ` : ''
    return { ok: false, error: `Invalid config: ${prefix}${issue.message}` }
  }
  return { ok: true, value: result.output }
}

/**
 * Reads and validates the takibi-hono configuration from takibi-hono.config.ts.
 */
/**
 * Dynamic import wrapper that avoids Vite's static analysis.
 * Vite warns about dynamic imports it cannot analyze at build time.
 * Using an indirect call prevents the warning since Vite only analyzes
 * direct `import()` expressions.
 */
// eslint-disable-next-line typescript-eslint/no-implied-eval
const dynamicImport = new Function('specifier', 'return import(specifier)') as (
  specifier: string,
) => Promise<{ readonly default: unknown }>

export async function readConfig(): Promise<
  | { readonly ok: true; readonly value: v.InferOutput<typeof ConfigSchema> }
  | { readonly ok: false; readonly error: string }
> {
  const abs = resolve(process.cwd(), 'takibi-hono.config.ts')
  if (!existsSync(abs)) return { ok: false, error: `Config not found: ${abs}` }

  try {
    register()
    const url = pathToFileURL(abs).href
    const mod = await dynamicImport(url)
    if (!('default' in mod) || mod.default === undefined)
      return { ok: false, error: 'Config must export default object' }

    return parseConfig(mod.default)
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

/**
 * Helper to define a config with full type completion.
 */
export function defineConfig(config: v.InferInput<typeof ConfigSchema>) {
  return config
}
