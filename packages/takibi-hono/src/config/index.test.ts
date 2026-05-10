import fs from 'node:fs'
import fsp from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, it } from 'vite-plus/test'

import { defineConfig, parseConfig, readConfig } from './index.js'

describe('parseConfig', () => {
  // --- valid ---

  it.concurrent('minimal valid config', () => {
    expect(
      parseConfig({
        input: 'openapi.yaml',
        schema: 'zod',
        format: {},
      }),
    ).toStrictEqual({
      ok: true,
      value: { input: 'openapi.yaml', schema: 'zod', format: {} },
    })
  })

  it.concurrent('full config', () => {
    expect(
      parseConfig({
        input: 'spec.yaml',
        schema: 'valibot',
        basePath: '/api/v1',
        format: { semi: false, singleQuote: true },
        'takibi-hono': {
          readonly: true,
          handlers: { output: 'src/handlers' },
          components: {
            schemas: { output: 'src/schemas', split: true, exportTypes: true },
            responses: { output: 'src/responses.ts' },
          },
        },
      }),
    ).toStrictEqual({
      ok: true,
      value: {
        input: 'spec.yaml',
        schema: 'valibot',
        basePath: '/api/v1',
        format: { semi: false, singleQuote: true },
        'takibi-hono': {
          readonly: true,
          handlers: { output: 'src/handlers' },
          components: {
            schemas: { output: 'src/schemas', split: true, exportTypes: true },
            responses: { output: 'src/responses.ts' },
          },
        },
      },
    })
  })

  it.concurrent('json input', () => {
    expect(parseConfig({ input: 'api.json', schema: 'zod', format: {} })).toStrictEqual({
      ok: true,
      value: { input: 'api.json', schema: 'zod', format: {} },
    })
  })

  it.concurrent('tsp input', () => {
    expect(parseConfig({ input: 'api.tsp', schema: 'typebox', format: {} })).toStrictEqual({
      ok: true,
      value: { input: 'api.tsp', schema: 'typebox', format: {} },
    })
  })

  it.concurrent('schema: zod', () => {
    expect(parseConfig({ input: 'a.yaml', schema: 'zod', format: {} })).toStrictEqual({
      ok: true,
      value: { input: 'a.yaml', schema: 'zod', format: {} },
    })
  })

  it.concurrent('schema: valibot', () => {
    expect(parseConfig({ input: 'a.yaml', schema: 'valibot', format: {} })).toStrictEqual({
      ok: true,
      value: { input: 'a.yaml', schema: 'valibot', format: {} },
    })
  })

  it.concurrent('schema: typebox', () => {
    expect(parseConfig({ input: 'a.yaml', schema: 'typebox', format: {} })).toStrictEqual({
      ok: true,
      value: { input: 'a.yaml', schema: 'typebox', format: {} },
    })
  })

  it.concurrent('schema: arktype', () => {
    expect(parseConfig({ input: 'a.yaml', schema: 'arktype', format: {} })).toStrictEqual({
      ok: true,
      value: { input: 'a.yaml', schema: 'arktype', format: {} },
    })
  })

  it.concurrent('schema: effect', () => {
    expect(parseConfig({ input: 'a.yaml', schema: 'effect', format: {} })).toStrictEqual({
      ok: true,
      value: { input: 'a.yaml', schema: 'effect', format: {} },
    })
  })

  it.concurrent('all 10 component types', () => {
    const components = {
      schemas: { output: 'src/schemas.ts' },
      parameters: { output: 'src/parameters.ts' },
      headers: { output: 'src/headers.ts' },
      securitySchemes: { output: 'src/securitySchemes.ts' },
      requestBodies: { output: 'src/requestBodies.ts' },
      responses: { output: 'src/responses.ts' },
      examples: { output: 'src/examples.ts' },
      links: { output: 'src/links.ts' },
      callbacks: { output: 'src/callbacks.ts' },
      pathItems: { output: 'src/pathItems.ts' },
    }
    expect(
      parseConfig({
        input: 'a.yaml',
        schema: 'zod',
        format: {},
        'takibi-hono': { components },
      }),
    ).toStrictEqual({
      ok: true,
      value: { input: 'a.yaml', schema: 'zod', format: {}, 'takibi-hono': { components } },
    })
  })

  it.concurrent('webhooks rejected at top level (no longer configurable)', () => {
    expect(
      parseConfig({
        input: 'a.yaml',
        schema: 'zod',
        format: {},
        webhooks: { output: 'src/webhooks.ts' },
      }),
    ).toStrictEqual({
      ok: false,
      error: 'Invalid config: webhooks: Invalid key: Expected never but received "webhooks"',
    })
  })

  it.concurrent('webhooks rejected inside components', () => {
    expect(
      parseConfig({
        input: 'a.yaml',
        schema: 'zod',
        format: {},
        'takibi-hono': { components: { webhooks: { output: 'src/webhooks.ts' } } },
      }),
    ).toStrictEqual({
      ok: false,
      error:
        'Invalid config: takibi-hono.components.webhooks: Invalid key: Expected never but received "webhooks"',
    })
  })

  it.concurrent('handlers with output only', () => {
    expect(
      parseConfig({
        input: 'a.yaml',
        schema: 'zod',
        format: {},
        'takibi-hono': { handlers: { output: 'src/handlers' } },
      }),
    ).toStrictEqual({
      ok: true,
      value: {
        input: 'a.yaml',
        schema: 'zod',
        format: {},
        'takibi-hono': { handlers: { output: 'src/handlers' } },
      },
    })
  })

  it.concurrent('component with import override', () => {
    expect(
      parseConfig({
        input: 'a.yaml',
        schema: 'zod',
        'takibi-hono': {
          components: {
            schemas: { output: 'src/schemas.ts', import: '@packages/schemas' },
          },
        },
      }),
    ).toStrictEqual({
      ok: true,
      value: {
        input: 'a.yaml',
        schema: 'zod',
        'takibi-hono': {
          components: {
            schemas: { output: 'src/schemas.ts', import: '@packages/schemas' },
          },
        },
      },
    })
  })

  it.concurrent('format with experimentalSortImports', () => {
    expect(
      parseConfig({
        input: 'a.yaml',
        schema: 'zod',
        format: {
          experimentalSortImports: {
            groups: [['builtin', 'external'], 'internal'],
          },
        },
      }),
    ).toStrictEqual({
      ok: true,
      value: {
        input: 'a.yaml',
        schema: 'zod',
        format: { experimentalSortImports: { groups: [['builtin', 'external'], 'internal'] } },
      },
    })
  })

  // --- normalization: directory → /index.ts ---

  it.concurrent('handlers output dir is not normalized', () => {
    expect(
      parseConfig({
        input: 'a.yaml',
        schema: 'zod',
        format: {},
        'takibi-hono': { handlers: { output: 'src/routes' } },
      }),
    ).toStrictEqual({
      ok: true,
      value: {
        input: 'a.yaml',
        schema: 'zod',
        format: {},
        'takibi-hono': { handlers: { output: 'src/routes' } },
      },
    })
  })

  it.concurrent('normalizes component output dir to /index.ts', () => {
    expect(
      parseConfig({
        input: 'a.yaml',
        schema: 'zod',
        format: {},
        'takibi-hono': { components: { schemas: { output: 'src/schemas' } } },
      }),
    ).toStrictEqual({
      ok: true,
      value: {
        input: 'a.yaml',
        schema: 'zod',
        format: {},
        'takibi-hono': { components: { schemas: { output: 'src/schemas/index.ts' } } },
      },
    })
  })

  it.concurrent('does not normalize when output ends with .ts', () => {
    expect(
      parseConfig({
        input: 'a.yaml',
        schema: 'zod',
        format: {},
        'takibi-hono': { handlers: { output: 'src/routes.ts' } },
      }),
    ).toStrictEqual({
      ok: true,
      value: {
        input: 'a.yaml',
        schema: 'zod',
        format: {},
        'takibi-hono': { handlers: { output: 'src/routes.ts' } },
      },
    })
  })

  it.concurrent('does not normalize when split is true', () => {
    expect(
      parseConfig({
        input: 'a.yaml',
        schema: 'zod',
        format: {},
        'takibi-hono': { components: { schemas: { output: 'src/schemas', split: true } } },
      }),
    ).toStrictEqual({
      ok: true,
      value: {
        input: 'a.yaml',
        schema: 'zod',
        format: {},
        'takibi-hono': { components: { schemas: { output: 'src/schemas', split: true } } },
      },
    })
  })

  it.concurrent('normalizes multiple components at once', () => {
    expect(
      parseConfig({
        input: 'a.yaml',
        schema: 'zod',
        format: {},
        'takibi-hono': {
          handlers: { output: 'src/handlers' },
          components: {
            schemas: { output: 'src/schemas' },
            responses: { output: 'src/responses' },
            parameters: { output: 'src/parameters', split: true },
          },
        },
      }),
    ).toStrictEqual({
      ok: true,
      value: {
        input: 'a.yaml',
        schema: 'zod',
        format: {},
        'takibi-hono': {
          handlers: { output: 'src/handlers' },
          components: {
            schemas: { output: 'src/schemas/index.ts' },
            responses: { output: 'src/responses/index.ts' },
            parameters: { output: 'src/parameters', split: true },
          },
        },
      },
    })
  })

  // --- validation errors ---

  it.concurrent('fails: missing input', () => {
    expect(parseConfig({ schema: 'zod', format: {} })).toStrictEqual({
      ok: false,
      error: 'Invalid config: input: Invalid key: Expected "input" but received undefined',
    })
  })

  it.concurrent('fails: missing schema', () => {
    expect(parseConfig({ input: 'a.yaml', format: {} })).toStrictEqual({
      ok: false,
      error: 'Invalid config: schema: Invalid key: Expected "schema" but received undefined',
    })
  })

  it.concurrent('passes: without format', () => {
    expect(parseConfig({ input: 'a.yaml', schema: 'zod' })).toStrictEqual({
      ok: true,
      value: { input: 'a.yaml', schema: 'zod' },
    })
  })

  it.concurrent('fails: invalid input extension', () => {
    expect(parseConfig({ input: 'api.txt', schema: 'zod', format: {} })).toStrictEqual({
      ok: false,
      error: 'Invalid config: input: input must be .yaml | .json | .tsp',
    })
  })

  it.concurrent('fails: invalid schema library', () => {
    expect(parseConfig({ input: 'a.yaml', schema: 'invalid', format: {} })).toStrictEqual({
      ok: false,
      error:
        'Invalid config: schema: schema must be "zod" | "valibot" | "typebox" | "arktype" | "effect"',
    })
  })

  it.concurrent('fails: unknown property in takibi-hono', () => {
    expect(
      parseConfig({
        input: 'a.yaml',
        schema: 'zod',
        format: {},
        'takibi-hono': { bad: true },
      }),
    ).toStrictEqual({
      ok: false,
      error: 'Invalid config: takibi-hono.bad: Invalid key: Expected never but received "bad"',
    })
  })

  it.concurrent('fails: unknown component type', () => {
    expect(
      parseConfig({
        input: 'a.yaml',
        schema: 'zod',
        format: {},
        'takibi-hono': { components: { bad: { output: 'x' } } },
      }),
    ).toStrictEqual({
      ok: false,
      error:
        'Invalid config: takibi-hono.components.bad: Invalid key: Expected never but received "bad"',
    })
  })

  it.concurrent('fails: component missing output', () => {
    expect(
      parseConfig({
        input: 'a.yaml',
        schema: 'zod',
        format: {},
        'takibi-hono': { components: { schemas: { split: true } } },
      }),
    ).toStrictEqual({
      ok: false,
      error:
        'Invalid config: takibi-hono.components.schemas.output: Invalid key: Expected "output" but received undefined',
    })
  })

  it.concurrent('fails: handlers with unknown property', () => {
    expect(
      parseConfig({
        input: 'a.yaml',
        schema: 'zod',
        format: {},
        'takibi-hono': { handlers: { output: 'src/routes.ts', split: true } },
      }),
    ).toStrictEqual({
      ok: false,
      error:
        'Invalid config: takibi-hono.handlers.split: Invalid key: Expected never but received "split"',
    })
  })

  it.concurrent('fails: component split mode with .ts file', () => {
    expect(
      parseConfig({
        input: 'a.yaml',
        schema: 'zod',
        format: {},
        'takibi-hono': { components: { schemas: { output: 'src/schemas.ts', split: true } } },
      }),
    ).toStrictEqual({
      ok: false,
      error:
        'Invalid config: takibi-hono.components.schemas.output: split mode requires directory, not .ts file',
    })
  })

  it.concurrent('fails: completely empty object', () => {
    const result = parseConfig({})
    expect(result.ok).toBe(false)
  })

  it.concurrent('fails: null config', () => {
    const result = parseConfig(null)
    expect(result.ok).toBe(false)
  })

  it.concurrent('fails: non-object config', () => {
    const result = parseConfig('not-an-object')
    expect(result.ok).toBe(false)
  })

  it.concurrent('fails: schema value is a number', () => {
    expect(parseConfig({ input: 'a.yaml', schema: 123 })).toStrictEqual({
      ok: false,
      error:
        'Invalid config: schema: schema must be "zod" | "valibot" | "typebox" | "arktype" | "effect"',
    })
  })

  it.concurrent('accepts arbitrary keys in format (oxfmt FormatConfig is open-shaped)', () => {
    // `format` is typed as `FormatConfig` from oxfmt and validated permissively
    // via `v.custom<FormatConfig>(() => true)`. We don't enumerate every oxfmt
    // option in this package — unknown keys pass through to oxfmt at runtime,
    // which is responsible for rejecting them. This test pins the documented
    // permissive behavior so a future stricter schema doesn't silently break
    // configs that pass through experimental oxfmt options.
    const result = parseConfig({
      input: 'a.yaml',
      schema: 'zod',
      format: { unknownProp: true },
    })
    expect(result.ok).toBe(true)
  })

  it.concurrent('all optional takibi-hono fields populated', () => {
    expect(
      parseConfig({
        input: 'spec.yaml',
        schema: 'zod',
        openapi: true,
        basePath: '/v2',
        format: {
          printWidth: 100,
          tabWidth: 2,
          useTabs: false,
          endOfLine: 'lf',
          insertFinalNewline: true,
          semi: true,
          singleQuote: true,
          jsxSingleQuote: false,
          quoteProps: 'as-needed',
          trailingComma: 'all',
          bracketSpacing: true,
          bracketSameLine: false,
          objectWrap: 'preserve',
          arrowParens: 'always',
          singleAttributePerLine: false,
          proseWrap: 'preserve',
          htmlWhitespaceSensitivity: 'css',
          vueIndentScriptAndStyle: false,
          embeddedLanguageFormatting: 'auto',
        },
        'takibi-hono': {
          readonly: true,
          exportSchemasTypes: true,
          exportParametersTypes: true,
          exportHeadersTypes: true,
          handlers: { output: 'src/routes' },
          components: {
            schemas: { output: 'src/schemas.ts', exportTypes: true },
          },
        },
      }),
    ).toStrictEqual({
      ok: true,
      value: {
        input: 'spec.yaml',
        schema: 'zod',
        openapi: true,
        basePath: '/v2',
        format: {
          printWidth: 100,
          tabWidth: 2,
          useTabs: false,
          endOfLine: 'lf',
          insertFinalNewline: true,
          semi: true,
          singleQuote: true,
          jsxSingleQuote: false,
          quoteProps: 'as-needed',
          trailingComma: 'all',
          bracketSpacing: true,
          bracketSameLine: false,
          objectWrap: 'preserve',
          arrowParens: 'always',
          singleAttributePerLine: false,
          proseWrap: 'preserve',
          htmlWhitespaceSensitivity: 'css',
          vueIndentScriptAndStyle: false,
          embeddedLanguageFormatting: 'auto',
        },
        'takibi-hono': {
          readonly: true,
          exportSchemasTypes: true,
          exportParametersTypes: true,
          exportHeadersTypes: true,
          handlers: { output: 'src/routes' },
          components: {
            schemas: { output: 'src/schemas.ts', exportTypes: true },
          },
        },
      },
    })
  })

  it.concurrent('fails: handlers with split property', () => {
    expect(
      parseConfig({
        input: 'a.yaml',
        schema: 'zod',
        'takibi-hono': { handlers: { output: 'src/handlers.ts', split: true } },
      }),
    ).toStrictEqual({
      ok: false,
      error:
        'Invalid config: takibi-hono.handlers.split: Invalid key: Expected never but received "split"',
    })
  })

  it.concurrent('format with experimentalTailwindcss', () => {
    expect(
      parseConfig({
        input: 'a.yaml',
        schema: 'zod',
        format: {
          experimentalTailwindcss: {
            config: './tailwind.config.ts',
            stylesheet: './src/styles.css',
            functions: ['cn', 'clsx'],
            attributes: ['className'],
            preserveWhitespace: false,
            preserveDuplicates: false,
          },
        },
      }),
    ).toStrictEqual({
      ok: true,
      value: {
        input: 'a.yaml',
        schema: 'zod',
        format: {
          experimentalTailwindcss: {
            config: './tailwind.config.ts',
            stylesheet: './src/styles.css',
            functions: ['cn', 'clsx'],
            attributes: ['className'],
            preserveWhitespace: false,
            preserveDuplicates: false,
          },
        },
      },
    })
  })

  it.concurrent('format with experimentalSortPackageJson', () => {
    expect(
      parseConfig({
        input: 'a.yaml',
        schema: 'zod',
        format: { experimentalSortPackageJson: true },
      }),
    ).toStrictEqual({
      ok: true,
      value: {
        input: 'a.yaml',
        schema: 'zod',
        format: { experimentalSortPackageJson: true },
      },
    })
  })

  it.concurrent('handlers directory output without .ts is not normalized', () => {
    expect(
      parseConfig({
        input: 'a.yaml',
        schema: 'zod',
        'takibi-hono': { handlers: { output: 'dist/routes' } },
      }),
    ).toStrictEqual({
      ok: true,
      value: {
        input: 'a.yaml',
        schema: 'zod',
        'takibi-hono': { handlers: { output: 'dist/routes' } },
      },
    })
  })

  it.concurrent('takibi-hono without handlers or components passes through', () => {
    expect(
      parseConfig({
        input: 'a.yaml',
        schema: 'zod',
        'takibi-hono': { readonly: true },
      }),
    ).toStrictEqual({
      ok: true,
      value: {
        input: 'a.yaml',
        schema: 'zod',
        'takibi-hono': { readonly: true },
      },
    })
  })

  it.concurrent('fails: split true with .ts on all component types', () => {
    const componentTypes = [
      'parameters',
      'headers',
      'securitySchemes',
      'requestBodies',
      'responses',
      'examples',
      'links',
      'callbacks',
      'pathItems',
    ] as const
    for (const componentType of componentTypes) {
      const result = parseConfig({
        input: 'a.yaml',
        schema: 'zod',
        'takibi-hono': {
          components: { [componentType]: { output: 'src/out.ts', split: true } },
        },
      })
      expect(result.ok).toBe(false)
    }
  })

})

describe('readConfig', () => {
  it('returns error with path when no config file exists', async () => {
    const originalCwd = process.cwd.bind(process)
    const fakeCwd = '/tmp/takibi-hono-test-no-config-' + Date.now()
    process.cwd = () => fakeCwd
    try {
      const result = await readConfig()
      expect(result.ok).toBe(false)
      if (!result.ok) {
        const expectedPath = path.resolve(fakeCwd, 'takibi-hono.config.ts')
        expect(result.error).toBe(`Config not found: ${expectedPath}`)
      }
    } finally {
      process.cwd = originalCwd
    }
  })

  it('error message references takibi-hono.config.ts filename', async () => {
    const originalCwd = process.cwd.bind(process)
    const fakeCwd = '/tmp/takibi-hono-test-filename-' + Date.now()
    process.cwd = () => fakeCwd
    try {
      const result = await readConfig()
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.endsWith('takibi-hono.config.ts')).toBe(true)
      }
    } finally {
      process.cwd = originalCwd
    }
  })

  describe('with real config file on disk', () => {
    const createdDirs: string[] = []
    afterEach(async () => {
      for (const d of createdDirs.splice(0)) {
        await fsp.rm(d, { recursive: true, force: true }).catch(() => {})
      }
    })

    function makeConfigDir(label: string, body: string): string {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), `takibi-hono-readconfig-${label}-`))
      createdDirs.push(dir)
      fs.writeFileSync(path.join(dir, 'takibi-hono.config.ts'), body)
      return dir
    }

    async function withCwd<T>(dir: string, fn: () => Promise<T>): Promise<T> {
      const originalCwd = process.cwd.bind(process)
      process.cwd = () => dir
      try {
        return await fn()
      } finally {
        process.cwd = originalCwd
      }
    }

    it('returns parsed config on valid default export', async () => {
      const dir = makeConfigDir('valid', `export default { input: 'api.yaml', schema: 'zod' }\n`)
      const result = await withCwd(dir, () => readConfig())
      expect(result).toStrictEqual({
        ok: true,
        value: { input: 'api.yaml', schema: 'zod' },
      })
    })

    it('returns error when default export is missing', async () => {
      const dir = makeConfigDir('no-default', `export const config = { input: 'a.yaml' }\n`)
      const result = await withCwd(dir, () => readConfig())
      expect(result).toStrictEqual({ ok: false, error: 'Config must export default object' })
    })

    it('returns error when default export is undefined', async () => {
      const dir = makeConfigDir('undef-default', `export default undefined\n`)
      const result = await withCwd(dir, () => readConfig())
      expect(result).toStrictEqual({ ok: false, error: 'Config must export default object' })
    })

    it('returns error message from import-time exception', async () => {
      const dir = makeConfigDir('throws', `throw new Error('boom from config')\n`)
      const result = await withCwd(dir, () => readConfig())
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error).toBe('boom from config')
      }
    })

    it('propagates parseConfig errors verbatim', async () => {
      const dir = makeConfigDir(
        'bad-schema',
        `export default { input: 'a.yaml', schema: 'unknown' }\n`,
      )
      const result = await withCwd(dir, () => readConfig())
      expect(result).toStrictEqual({
        ok: false,
        error:
          'Invalid config: schema: schema must be "zod" | "valibot" | "typebox" | "arktype" | "effect"',
      })
    })
  })
})

describe('parseConfig - handlers strict validation', () => {
  it('fails when handlers has split property', () => {
    const result = parseConfig({
      input: 'a.yaml',
      schema: 'zod',
      'takibi-hono': { handlers: { output: 'src/routes.ts', split: true } },
    })
    expect(result).toStrictEqual({
      ok: false,
      error:
        'Invalid config: takibi-hono.handlers.split: Invalid key: Expected never but received "split"',
    })
  })
})

describe('parseConfig - normalize non-split directory output', () => {
  it('does not append /index.ts to handlers output', () => {
    const result = parseConfig({
      input: 'a.yaml',
      schema: 'zod',
      'takibi-hono': { handlers: { output: 'src/handlers' } },
    })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value['takibi-hono']?.handlers?.output).toBe('src/handlers')
    }
  })

  it('appends /index.ts to non-split directory component output', () => {
    const result = parseConfig({
      input: 'a.yaml',
      schema: 'zod',
      'takibi-hono': { components: { responses: { output: 'src/responses' } } },
    })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value['takibi-hono']?.components?.responses?.output).toBe(
        'src/responses/index.ts',
      )
    }
  })
})

describe('parseConfig - component import field', () => {
  it.concurrent('schemas with import override', () => {
    expect(
      parseConfig({
        input: 'a.yaml',
        schema: 'zod',
        'takibi-hono': {
          components: {
            schemas: { output: 'src/schemas.ts', import: '@/schemas' },
          },
        },
      }),
    ).toStrictEqual({
      ok: true,
      value: {
        input: 'a.yaml',
        schema: 'zod',
        'takibi-hono': {
          components: {
            schemas: { output: 'src/schemas.ts', import: '@/schemas' },
          },
        },
      },
    })
  })

  it.concurrent('schemas with import preserves value through normalization', () => {
    const result = parseConfig({
      input: 'a.yaml',
      schema: 'zod',
      'takibi-hono': {
        components: {
          schemas: { output: 'src/schemas', import: '@packages/schemas' },
        },
      },
    })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value['takibi-hono']?.components?.schemas?.output).toBe('src/schemas/index.ts')
      expect(result.value['takibi-hono']?.components?.schemas?.import).toBe('@packages/schemas')
    }
  })

  it.concurrent('schemas split with import preserves directory output', () => {
    const result = parseConfig({
      input: 'a.yaml',
      schema: 'zod',
      'takibi-hono': {
        components: {
          schemas: { output: 'src/schemas', split: true, import: '@/schemas' },
        },
      },
    })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value['takibi-hono']?.components?.schemas?.output).toBe('src/schemas')
      expect(result.value['takibi-hono']?.components?.schemas?.split).toBe(true)
      expect(result.value['takibi-hono']?.components?.schemas?.import).toBe('@/schemas')
    }
  })

  it.concurrent('all component types accept import field', () => {
    const componentTypes = [
      'schemas',
      'parameters',
      'headers',
      'securitySchemes',
      'requestBodies',
      'responses',
      'examples',
      'links',
      'callbacks',
      'pathItems',
    ] as const
    for (const componentType of componentTypes) {
      const result = parseConfig({
        input: 'a.yaml',
        schema: 'zod',
        'takibi-hono': {
          components: {
            [componentType]: { output: `src/${componentType}.ts`, import: `@/${componentType}` },
          },
        },
      })
      expect(result.ok).toBe(true)
      if (result.ok) {
        const component = result.value['takibi-hono']?.components?.[componentType]
        expect(component?.output).toBe(`src/${componentType}.ts`)
        expect(component?.import).toBe(`@/${componentType}`)
      }
    }
  })


  it.concurrent('multiple components with different import paths', () => {
    expect(
      parseConfig({
        input: 'a.yaml',
        schema: 'zod',
        'takibi-hono': {
          components: {
            schemas: { output: 'src/schemas.ts', import: '@/schemas' },
            responses: { output: 'src/responses.ts', import: '@/responses' },
            parameters: { output: 'src/params', split: true, import: '@/params' },
          },
        },
      }),
    ).toStrictEqual({
      ok: true,
      value: {
        input: 'a.yaml',
        schema: 'zod',
        'takibi-hono': {
          components: {
            schemas: { output: 'src/schemas.ts', import: '@/schemas' },
            responses: { output: 'src/responses.ts', import: '@/responses' },
            parameters: { output: 'src/params', split: true, import: '@/params' },
          },
        },
      },
    })
  })

  it.concurrent('component without import uses default relative path resolution', () => {
    const result = parseConfig({
      input: 'a.yaml',
      schema: 'zod',
      'takibi-hono': {
        components: {
          schemas: { output: 'src/schemas.ts' },
        },
      },
    })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value['takibi-hono']?.components?.schemas?.import).toBeUndefined()
      expect(result.value['takibi-hono']?.components?.schemas?.output).toBe('src/schemas.ts')
    }
  })

  it.concurrent('handlers rejects import property', () => {
    expect(
      parseConfig({
        input: 'a.yaml',
        schema: 'zod',
        'takibi-hono': {
          handlers: { output: 'src/handlers', import: '@/handlers' },
        },
      }),
    ).toStrictEqual({
      ok: false,
      error:
        'Invalid config: takibi-hono.handlers.import: Invalid key: Expected never but received "import"',
    })
  })

  it.concurrent('component with exportTypes and import', () => {
    expect(
      parseConfig({
        input: 'a.yaml',
        schema: 'zod',
        'takibi-hono': {
          components: {
            schemas: {
              output: 'src/schemas.ts',
              exportTypes: true,
              split: false,
              import: '@packages/schemas',
            },
          },
        },
      }),
    ).toStrictEqual({
      ok: true,
      value: {
        input: 'a.yaml',
        schema: 'zod',
        'takibi-hono': {
          components: {
            schemas: {
              output: 'src/schemas.ts',
              exportTypes: true,
              split: false,
              import: '@packages/schemas',
            },
          },
        },
      },
    })
  })
})

describe('parseConfig - components.output base directory', () => {
  it.concurrent('accepts components with only output base directory', () => {
    expect(
      parseConfig({
        input: 'main.tsp',
        schema: 'effect',
        openapi: true,
        'takibi-hono': {
          components: {
            output: 'src/openapi',
          },
          exportSchemasTypes: true,
        },
      }),
    ).toStrictEqual({
      ok: true,
      value: {
        input: 'main.tsp',
        schema: 'effect',
        openapi: true,
        'takibi-hono': {
          components: {
            output: 'src/openapi',
          },
          exportSchemasTypes: true,
        },
      },
    })
  })

  it.concurrent('components.output coexists with individual component configs', () => {
    expect(
      parseConfig({
        input: 'a.yaml',
        schema: 'zod',
        'takibi-hono': {
          components: {
            output: 'src/openapi',
            schemas: { output: 'src/custom/schemas.ts' },
            responses: { output: 'src/responses' },
          },
        },
      }),
    ).toStrictEqual({
      ok: true,
      value: {
        input: 'a.yaml',
        schema: 'zod',
        'takibi-hono': {
          components: {
            output: 'src/openapi',
            schemas: { output: 'src/custom/schemas.ts' },
            responses: { output: 'src/responses/index.ts' },
          },
        },
      },
    })
  })

  it.concurrent('components.output with readonly flag', () => {
    expect(
      parseConfig({
        input: 'main.tsp',
        schema: 'effect',
        openapi: true,
        'takibi-hono': {
          readonly: true,
          components: {
            output: 'src/openapi',
          },
          exportSchemasTypes: true,
        },
      }),
    ).toStrictEqual({
      ok: true,
      value: {
        input: 'main.tsp',
        schema: 'effect',
        openapi: true,
        'takibi-hono': {
          readonly: true,
          components: {
            output: 'src/openapi',
          },
          exportSchemasTypes: true,
        },
      },
    })
  })

  it.concurrent('components.output does not affect normalization of individual components', () => {
    const result = parseConfig({
      input: 'a.yaml',
      schema: 'zod',
      'takibi-hono': {
        components: {
          output: 'src/openapi',
          schemas: { output: 'src/schemas', split: true },
          parameters: { output: 'src/params' },
        },
      },
    })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value['takibi-hono']?.components?.output).toBe('src/openapi')
      expect(result.value['takibi-hono']?.components?.schemas?.output).toBe('src/schemas')
      expect(result.value['takibi-hono']?.components?.parameters?.output).toBe(
        'src/params/index.ts',
      )
    }
  })

  it.concurrent('components.output is preserved as-is (no normalization)', () => {
    const result = parseConfig({
      input: 'a.yaml',
      schema: 'zod',
      'takibi-hono': {
        components: {
          output: 'src/openapi',
        },
      },
    })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value['takibi-hono']?.components?.output).toBe('src/openapi')
    }
  })
})

describe('parseConfig - readonly flag', () => {
  it.concurrent('readonly: true is accepted and passed through', () => {
    expect(
      parseConfig({
        input: 'a.yaml',
        schema: 'zod',
        'takibi-hono': { readonly: true },
      }),
    ).toStrictEqual({
      ok: true,
      value: {
        input: 'a.yaml',
        schema: 'zod',
        'takibi-hono': { readonly: true },
      },
    })
  })

  it.concurrent('readonly: false is accepted and passed through', () => {
    expect(
      parseConfig({
        input: 'a.yaml',
        schema: 'zod',
        'takibi-hono': { readonly: false },
      }),
    ).toStrictEqual({
      ok: true,
      value: {
        input: 'a.yaml',
        schema: 'zod',
        'takibi-hono': { readonly: false },
      },
    })
  })

  it.concurrent('readonly is optional (undefined)', () => {
    const result = parseConfig({
      input: 'a.yaml',
      schema: 'zod',
      'takibi-hono': {},
    })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value['takibi-hono']?.readonly).toBeUndefined()
    }
  })

  it.concurrent('readonly with components.output', () => {
    expect(
      parseConfig({
        input: 'a.yaml',
        schema: 'zod',
        openapi: true,
        'takibi-hono': {
          readonly: true,
          components: {
            output: 'src/openapi',
          },
        },
      }),
    ).toStrictEqual({
      ok: true,
      value: {
        input: 'a.yaml',
        schema: 'zod',
        openapi: true,
        'takibi-hono': {
          readonly: true,
          components: {
            output: 'src/openapi',
          },
        },
      },
    })
  })

  it.concurrent('readonly with individual components', () => {
    expect(
      parseConfig({
        input: 'a.yaml',
        schema: 'zod',
        'takibi-hono': {
          readonly: true,
          components: {
            schemas: { output: 'src/schemas.ts', exportTypes: true },
          },
        },
      }),
    ).toStrictEqual({
      ok: true,
      value: {
        input: 'a.yaml',
        schema: 'zod',
        'takibi-hono': {
          readonly: true,
          components: {
            schemas: { output: 'src/schemas.ts', exportTypes: true },
          },
        },
      },
    })
  })

  it.concurrent('readonly with handlers', () => {
    expect(
      parseConfig({
        input: 'a.yaml',
        schema: 'zod',
        'takibi-hono': {
          readonly: true,
          handlers: { output: 'src/handlers' },
        },
      }),
    ).toStrictEqual({
      ok: true,
      value: {
        input: 'a.yaml',
        schema: 'zod',
        'takibi-hono': {
          readonly: true,
          handlers: { output: 'src/handlers' },
        },
      },
    })
  })

  it.concurrent('readonly: non-boolean value is rejected', () => {
    const result = parseConfig({
      input: 'a.yaml',
      schema: 'zod',
      'takibi-hono': { readonly: 'yes' },
    })
    expect(result.ok).toBe(false)
  })
})

describe('defineConfig', () => {
  it.concurrent('returns the same object passed in', () => {
    const config = {
      input: 'openapi.yaml' as const,
      schema: 'zod' as const,
    }
    expect(defineConfig(config)).toBe(config)
  })

  it.concurrent('returns a complex config unchanged', () => {
    const config = {
      input: 'spec.json' as const,
      schema: 'valibot' as const,
      basePath: '/api',
      format: { semi: false },
      'takibi-hono': {
        readonly: true,
        handlers: { output: 'src/routes.ts' },
      },
    }
    const result = defineConfig(config)
    expect(result).toBe(config)
    expect(result).toStrictEqual(config)
  })

  it.concurrent('should reject removed exportSchemas flag', () => {
    expect(
      parseConfig({
        input: 'spec.yaml',
        schema: 'zod',
        'takibi-hono': {
          exportSchemas: true,
        },
      }),
    ).toStrictEqual({
      ok: false,
      error:
        'Invalid config: takibi-hono.exportSchemas: Invalid key: Expected never but received "exportSchemas"',
    })
  })

  it.concurrent('should reject removed exportResponses flag', () => {
    expect(
      parseConfig({
        input: 'spec.yaml',
        schema: 'zod',
        'takibi-hono': {
          exportResponses: true,
        },
      }),
    ).toStrictEqual({
      ok: false,
      error:
        'Invalid config: takibi-hono.exportResponses: Invalid key: Expected never but received "exportResponses"',
    })
  })

  it.concurrent('should reject removed exportParameters flag', () => {
    expect(
      parseConfig({
        input: 'spec.yaml',
        schema: 'zod',
        'takibi-hono': {
          exportParameters: true,
        },
      }),
    ).toStrictEqual({
      ok: false,
      error:
        'Invalid config: takibi-hono.exportParameters: Invalid key: Expected never but received "exportParameters"',
    })
  })

  it.concurrent('should reject removed exportExamples flag', () => {
    expect(
      parseConfig({
        input: 'spec.yaml',
        schema: 'zod',
        'takibi-hono': {
          exportExamples: true,
        },
      }),
    ).toStrictEqual({
      ok: false,
      error:
        'Invalid config: takibi-hono.exportExamples: Invalid key: Expected never but received "exportExamples"',
    })
  })

  it.concurrent('should reject removed exportRequestBodies flag', () => {
    expect(
      parseConfig({
        input: 'spec.yaml',
        schema: 'zod',
        'takibi-hono': {
          exportRequestBodies: true,
        },
      }),
    ).toStrictEqual({
      ok: false,
      error:
        'Invalid config: takibi-hono.exportRequestBodies: Invalid key: Expected never but received "exportRequestBodies"',
    })
  })

  it.concurrent('should reject removed exportHeaders flag', () => {
    expect(
      parseConfig({
        input: 'spec.yaml',
        schema: 'zod',
        'takibi-hono': {
          exportHeaders: true,
        },
      }),
    ).toStrictEqual({
      ok: false,
      error:
        'Invalid config: takibi-hono.exportHeaders: Invalid key: Expected never but received "exportHeaders"',
    })
  })

  it.concurrent('should accept exportSchemasTypes flag', () => {
    expect(
      parseConfig({
        input: 'spec.yaml',
        schema: 'zod',
        'takibi-hono': {
          exportSchemasTypes: true,
        },
      }),
    ).toStrictEqual({
      ok: true,
      value: {
        input: 'spec.yaml',
        schema: 'zod',
        'takibi-hono': {
          exportSchemasTypes: true,
        },
      },
    })
  })

  it.concurrent('should accept exportParametersTypes flag', () => {
    expect(
      parseConfig({
        input: 'spec.yaml',
        schema: 'zod',
        'takibi-hono': {
          exportParametersTypes: true,
        },
      }),
    ).toStrictEqual({
      ok: true,
      value: {
        input: 'spec.yaml',
        schema: 'zod',
        'takibi-hono': {
          exportParametersTypes: true,
        },
      },
    })
  })

  it.concurrent('should accept exportHeadersTypes flag', () => {
    expect(
      parseConfig({
        input: 'spec.yaml',
        schema: 'zod',
        'takibi-hono': {
          exportHeadersTypes: true,
        },
      }),
    ).toStrictEqual({
      ok: true,
      value: {
        input: 'spec.yaml',
        schema: 'zod',
        'takibi-hono': {
          exportHeadersTypes: true,
        },
      },
    })
  })
})
