import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import * as NodeServices from '@effect/platform-node/NodeServices'
import { Effect } from 'effect'
import { afterEach, describe, expect, it } from 'vite-plus/test'

import { ConfigError, defineConfig, parseConfig, readConfig } from './index.js'

const base = { input: 'openapi.yaml', schema: 'zod' } as const

function parse(config: unknown) {
  return Effect.runPromise(parseConfig(config))
}

function parseError(config: unknown) {
  return Effect.runPromise(Effect.flip(parseConfig(config)))
}

describe('parseConfig', () => {
  it('accepts the minimal config', async () => {
    expect(await parse(base)).toStrictEqual(base)
  })

  it.each(['openapi.yaml', 'openapi.json', 'main.tsp'])('accepts %s as input', async (input) => {
    expect(await parse({ ...base, input })).toStrictEqual({ ...base, input })
  })

  it.each(['zod', 'valibot', 'typebox', 'arktype', 'effect'])(
    'accepts schema %s',
    async (schema) => {
      expect(await parse({ ...base, schema })).toStrictEqual({ ...base, schema })
    },
  )

  it('accepts every field, normalizing single-file component outputs to <dir>/index.ts', async () => {
    const config = {
      ...base,
      output: 'src/routes',
      basePath: '/api',
      openapi: true,
      format: { printWidth: 80, experimentalSortImports: {} },
      readonly: true,
      split: true,
      pathAlias: '@/',
      client: {
        output: 'src/client.ts',
        baseUrl: { env: 'API_URL', import: '@/env', name: 'env' },
        credentials: 'include',
        import: '@acme/api',
        package: '@acme/client',
      },
      rpc: { output: 'src/rpc', parseResponse: true, docs: false },
      swr: { output: 'src/swr.ts' },
      'tanstack-query': { output: 'src/tanstack-query.ts' },
      type: { output: 'src/types.ts', readonly: true },
      docs: { output: 'docs/api.md', curl: true, baseUrl: 'http://localhost:3000' },
      components: {
        schemas: {
          output: 'src/schemas',
          split: true,
          package: '@acme/schemas',
          exportTypes: true,
        },
        responses: { output: 'src/responses' },
        parameters: { output: 'src/parameters.ts', exportTypes: true },
        mediaTypes: { output: 'src/media', split: false },
      },
    }
    expect(await parse(config)).toStrictEqual({
      ...config,
      rpc: { output: 'src/rpc/index.ts', parseResponse: true, docs: false },
      components: {
        schemas: {
          split: true,
          output: 'src/schemas',
          package: '@acme/schemas',
          exportTypes: true,
        },
        responses: { output: 'src/responses/index.ts' },
        parameters: { output: 'src/parameters.ts', exportTypes: true },
        mediaTypes: { split: false, output: 'src/media/index.ts' },
      },
    })
  })

  it.each([
    [
      'an environment variable read by Vite',
      { env: 'VITE_API_URL' },
      { env: 'VITE_API_URL', source: 'import.meta.env' },
    ],
    [
      'an environment variable read by Node.js',
      { env: 'API_URL', source: 'process.env' },
      { env: 'API_URL', source: 'process.env' },
    ],
    [
      'the environment object of a module',
      { env: 'API_URL', import: '@/env' },
      { env: 'API_URL', import: '@/env', name: 'env' },
    ],
    ['the same origin', '/', '/'],
  ])('accepts a client baseUrl of %s, filling in its defaults', async (_, baseUrl, decoded) => {
    const config = { ...base, client: { output: 'src/client.ts', baseUrl } }
    expect(await parse(config)).toStrictEqual({
      ...config,
      client: { ...config.client, baseUrl: decoded },
    })
  })

  it('creates the client for the same origin when baseUrl is left out', async () => {
    expect(await parse({ ...base, client: { output: 'src/client.ts' } })).toStrictEqual({
      ...base,
      client: { output: 'src/client.ts', baseUrl: '/' },
    })
  })

  it('writes Hono request examples into the docs unless curl is asked for', async () => {
    expect(
      await parse({ ...base, docs: { output: 'docs/api.md', entry: 'src/index.ts' } }),
    ).toStrictEqual({
      ...base,
      docs: { output: 'docs/api.md', entry: 'src/index.ts', curl: false },
    })
  })

  it('keeps components.output and its package as written (single-file aggregate)', async () => {
    const config = {
      ...base,
      components: { output: 'src/components/index.ts', package: '@acme/components' },
    }
    expect(await parse(config)).toStrictEqual(config)
  })

  it.each([
    ['a missing input', { schema: 'zod' }, 'input: Missing key'],
    ['a missing schema', { input: 'a.yaml' }, 'schema: Missing key'],
    [
      'an input that is not .yaml/.json/.tsp',
      { ...base, input: 'a.txt' },
      'input: must be .yaml | .json | .tsp',
    ],
    [
      'an unknown schema library',
      { ...base, schema: 'yup' },
      'schema: Expected "zod" | "valibot" | "typebox" | "arktype" | "effect"',
    ],
    [
      'a handlers output that is a .ts file',
      { ...base, output: 'src/routes.ts' },
      'output: must be a directory, not a .ts file',
    ],
    [
      'a split component output that is a .ts file',
      { ...base, components: { schemas: { output: 'src/s.ts', split: true } } },
      'components.schemas.output: must be a directory, not a .ts file',
    ],
    [
      'a component without output',
      { ...base, components: { responses: { split: false } } },
      'components.responses.output: Missing key',
    ],
    [
      'components.output next to a per-type output',
      { ...base, components: { output: 'src/c.ts', schemas: { output: 'src/s.ts' } } },
      'components: components.output is mutually exclusive with per-type component outputs (schemas, responses, ...). Use output for single-file mode, or per-type fields for split mode.',
    ],
    [
      'a components.output that is a directory',
      { ...base, components: { output: 'src/components' } },
      'components.output: must be a .ts file',
    ],
    [
      'components.package without components.output',
      { ...base, components: { package: '@acme/components', schemas: { output: 'src/s.ts' } } },
      'components: components.package goes with components.output: a per-type output names its package in its own block.',
    ],
    [
      'a package that is not a module specifier',
      { ...base, components: { output: 'src/c.ts', package: 'my pkg' } },
      'components.package: must be a module specifier, with no whitespace or quotes',
    ],
    [
      'the retired per-type import',
      { ...base, components: { responses: { output: 'src/r.ts', import: '../r' } } },
      'components.responses.import: import was removed: a generated file imports another one relatively, under pathAlias inside the directory of the app entry, or by package from another package.',
    ],
    [
      'a type output that is not .ts',
      { ...base, type: { output: 'src/types' } },
      'type.output: must be a .ts file',
    ],
    [
      'a client output that is not .ts',
      { ...base, client: { output: 'src/client' } },
      'client.output: must be a .ts file',
    ],
    [
      'rpc without the client it calls',
      { ...base, rpc: { output: 'src/rpc.ts' } },
      'rpc needs client: rpc and the hooks call the client the client block generates.',
    ],
    [
      'a query hook without the client it calls',
      { ...base, 'tanstack-query': { output: 'src/q.ts' } },
      'tanstack-query needs client: rpc and the hooks call the client the client block generates.',
    ],
    [
      'a fixed base URL',
      { ...base, client: { output: 'src/client.ts', baseUrl: 'https://api.example.com' } },
      "client.baseUrl: a fixed URL was removed: leave baseUrl out (or set '/') for the same origin, or read it from the environment with { env } or { env, import }",
    ],
    [
      'a base URL variable that is not a variable name',
      { ...base, client: { output: 'src/client.ts', baseUrl: { env: 'API-URL' } } },
      'client.baseUrl.env: must be the name of an environment variable',
    ],
    [
      'unknown credentials',
      { ...base, client: { output: 'src/client.ts', credentials: 'always' } },
      'client.credentials: Expected "include" | "same-origin" | "omit"',
    ],
    [
      'rpc under the client block',
      { ...base, client: { output: 'src/client.ts', rpc: { output: 'src/rpc.ts' } } },
      'client.rpc: client.rpc moved: rpc is a top-level key, as in hono-takibi, and the client block is the typed client itself (output, baseUrl, import, package, credentials).',
    ],
    [
      'a camelCase query hook under the client block',
      { ...base, client: { output: 'src/client.ts', tanstackQuery: { output: 'src/q.ts' } } },
      'client.tanstackQuery: client.tanstackQuery moved: tanstack-query is a top-level key, as in hono-takibi, and the client block is the typed client itself (output, baseUrl, import, package, credentials).',
    ],
    [
      'a camelCase query hook at the top level',
      { ...base, client: { output: 'src/client.ts' }, tanstackQuery: { output: 'src/q.ts' } },
      'tanstackQuery: Expected no excess property',
    ],
    [
      'the retired rpc import',
      {
        ...base,
        client: { output: 'src/client.ts' },
        rpc: { output: 'src/rpc.ts', import: '../lib' },
      },
      'rpc.import: import was removed: rpc and the hooks import the client the client block generates. A file written into another package imports it by client.package.',
    ],
    [
      'the retired query-hook client name',
      {
        ...base,
        client: { output: 'src/client.ts' },
        swr: { output: 'src/swr.ts', client: 'api' },
      },
      'swr.client: client was removed: the generated client is exported as `client`, and rpc and the hooks import it by that name.',
    ],
    [
      'the retired client split option',
      { ...base, client: { output: 'src/client.ts' }, swr: { output: 'src/swr.ts', split: true } },
      'swr.split: split was removed: rpc and hooks are always generated into a single file. Set output to a .ts file path and delete the directory the previous run wrote.',
    ],
    [
      'a docs output that is not .md',
      { ...base, docs: { output: 'src/docs' } },
      'docs.output: must be .md file',
    ],
    [
      'curl docs without a base URL',
      { ...base, docs: { output: 'docs/api.md', curl: true } },
      'docs.baseUrl: baseUrl is required when curl is true',
    ],
    [
      'test generation',
      { ...base, test: true },
      'test: test is not provided: takibi-hono generates no test files. Write them against the handlers it generates.',
    ],
    [
      'a test framework',
      { ...base, testFramework: 'vitest' },
      'testFramework: testFramework is not provided: takibi-hono generates no test files.',
    ],
    ['a non-boolean readonly', { ...base, readonly: 'yes' }, 'readonly: Expected boolean'],
    ['a non-boolean split', { ...base, split: 'groups' }, 'split: Expected boolean'],
    [
      'a format that is not an object',
      { ...base, format: [] },
      'format: must be an oxfmt FormatConfig object',
    ],
    // Unknown keys are rejected so a misspelled field cannot silently skip its generator.
    [
      'an unknown top-level key',
      { ...base, template: { output: 'x' } },
      'template: Expected no excess property',
    ],
    [
      'a retired flag',
      { ...base, exportSchemas: true },
      'exportSchemas: Expected no excess property',
    ],
    [
      'an unknown component kind',
      { ...base, components: { webhooks: { output: 'x' } } },
      'components.webhooks: Expected no excess property',
    ],
    ['null', null, 'Expected object'],
    ['a non-object', 'openapi.yaml', 'Expected object'],
  ])('rejects %s', async (_, config, message) => {
    const error = await parseError(config)
    expect(error).toStrictEqual(new ConfigError({ message: `Invalid config: ${message}` }))
  })
})

function read(configPath?: string) {
  return Effect.runPromise(readConfig(configPath).pipe(Effect.provide(NodeServices.layer)))
}

function readError(configPath?: string) {
  return Effect.runPromise(
    Effect.flip(readConfig(configPath)).pipe(Effect.provide(NodeServices.layer)),
  )
}

describe('readConfig', () => {
  const cwd = process.cwd()
  const dirs: string[] = []

  afterEach(() => {
    process.chdir(cwd)
    for (const dir of dirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true })
  })

  function inConfigDir(files: { readonly [name: string]: string }) {
    const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'takibi-hono-config-')))
    dirs.push(dir)
    for (const [name, content] of Object.entries(files)) {
      fs.writeFileSync(path.join(dir, name), content)
    }
    process.chdir(dir)
    return dir
  }

  it('loads and validates the default config file', async () => {
    inConfigDir({
      'takibi-hono.config.ts': "export default { input: 'openapi.yaml', schema: 'valibot' }\n",
    })
    expect(await read()).toStrictEqual({ input: 'openapi.yaml', schema: 'valibot' })
  })

  it('loads the config file it is given', async () => {
    inConfigDir({ 'api.config.ts': "export default { input: 'main.tsp', schema: 'effect' }\n" })
    expect(await read('api.config.ts')).toStrictEqual({ input: 'main.tsp', schema: 'effect' })
  })

  it('reports a missing config as notFound, naming the path it looked for', async () => {
    const dir = inConfigDir({})
    expect(await readError()).toStrictEqual(
      new ConfigError({
        message: `Config not found: ${path.join(dir, 'takibi-hono.config.ts')}\nCreate takibi-hono.config.ts in the current directory. See https://github.com/nakita628/takibi-hono#configuration for an example.`,
        notFound: true,
      }),
    )
  })

  it.each([
    ['has no default export', 'export const config = {}\n'],
    ['exports undefined by default', 'export default undefined\n'],
  ])('rejects a config that %s', async (_, source) => {
    const dir = inConfigDir({ 'takibi-hono.config.ts': source })
    expect(await readError()).toStrictEqual(
      new ConfigError({
        message: `Config must export default object from ${path.join(dir, 'takibi-hono.config.ts')}\nDid you forget \`export default defineConfig({ ... })\`?`,
      }),
    )
  })

  it('reports an exception thrown while importing', async () => {
    inConfigDir({ 'takibi-hono.config.ts': "throw new Error('boom')\n" })
    expect(await readError()).toStrictEqual(new ConfigError({ message: 'boom' }))
  })

  it('reports validation failures verbatim', async () => {
    inConfigDir({ 'takibi-hono.config.ts': "export default { input: 'a.yaml', schema: 'yup' }\n" })
    expect(await readError()).toStrictEqual(
      new ConfigError({
        message:
          'Invalid config: schema: Expected "zod" | "valibot" | "typebox" | "arktype" | "effect"',
      }),
    )
  })
})

describe('defineConfig', () => {
  it('returns the config it is given', () => {
    const config = {
      ...base,
      components: { schemas: { output: 'src/schemas', split: true } },
    } as const
    expect(defineConfig(config)).toBe(config)
  })
})
