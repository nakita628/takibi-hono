import fs from 'node:fs'
import fsp from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import { afterAll, beforeAll, describe, expect, it } from 'vite-plus/test'

import { parseOpenAPI } from '../openapi/index.js'
import { runGenerator, runGeneratorError } from '../testing/index.js'
import { ClientError, makeClients } from './client.js'
import type { ClientConfig, ClientOptions, Layout } from './layout.js'
import { resolveLayout } from './layout.js'

const MINI_YAML = `openapi: 3.0.3
info:
  title: Mini
  version: 1.0.0
paths:
  /ping:
    get:
      summary: Ping
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                required:
                  - message
`

let tempBase: string
let specPath: string

beforeAll(async () => {
  tempBase = fs.mkdtempSync(path.join(os.tmpdir(), 'takibi-hono-client-test-'))
  specPath = path.join(tempBase, 'spec.yaml')
  await fsp.writeFile(specPath, MINI_YAML)
})

const tmpDirs: string[] = []
afterAll(async () => {
  await Promise.all(tmpDirs.map((d) => fsp.rm(d, { recursive: true, force: true }).catch(() => {})))
  if (tempBase) await fsp.rm(tempBase, { recursive: true, force: true }).catch(() => {})
})

function tmpDir(label: string): string {
  const d = path.join(os.tmpdir(), `takibi-hono-client-__test_${label}_${Date.now()}`)
  tmpDirs.push(d)
  return d
}

function openapi() {
  return runGenerator(parseOpenAPI(specPath))
}

function escapes(output: string) {
  return new ClientError({
    message: `Client output path "${output}" escapes the project directory. Use a path inside the project (remove leading "/" or "..").`,
  })
}

/**
 * `makeClients` over a config with the client-side keys (the app entry at `src/index.ts`) and
 * its layout. `packageOf` names the package a path is written into; by default there is one.
 */
async function generate(
  dir: string,
  keys: ClientConfig,
  options: { readonly basePath?: string; readonly packageOf?: (file: string) => string } = {},
) {
  const config = {
    input: specPath,
    schema: 'zod',
    ...keys,
    ...(options.basePath !== undefined && { basePath: options.basePath }),
  } as const
  const { packageOf } = options
  const layout: Layout = {
    ...resolveLayout(config),
    packageRoot: (file) => packageOf?.(path.relative(dir, path.resolve(dir, file))),
  }
  return makeClients(await openapi(), config, layout, dir)
}

/** The typed client at `output`, created for the same origin unless the test says otherwise. */
const client = (output: string, rest: Partial<ClientOptions> = {}): ClientOptions => ({
  output,
  baseUrl: '/',
  ...rest,
})

const read = (dir: string, file: string) => fsp.readFile(path.join(dir, file), 'utf-8')

// Two packages: `web/` and everything else.
const packageOf = (file: string) => (file.startsWith('web') ? 'web' : 'root')

describe('makeClients', () => {
  it.concurrent('generates every configured client target inside the base dir', async () => {
    const d = tmpDir('all')
    await runGenerator(
      await generate(d, {
        client: client('client.ts'),
        rpc: { output: 'rpc.ts' },
        swr: { output: 'swr.ts' },
        'tanstack-query': { output: 'tanstack.ts' },
        'svelte-query': { output: 'svelte.ts' },
        'vue-query': { output: 'vue.ts' },
        'preact-query': { output: 'preact.ts' },
        'solid-query': { output: 'solid.ts' },
        'angular-query': { output: 'angular.ts' },
        type: { output: 'types.ts' },
        docs: { output: 'docs.md', curl: false },
      }),
    )
    for (const file of [
      'client.ts',
      'rpc.ts',
      'swr.ts',
      'tanstack.ts',
      'svelte.ts',
      'vue.ts',
      'preact.ts',
      'solid.ts',
      'angular.ts',
      'types.ts',
      'docs.md',
    ]) {
      expect(fs.existsSync(path.join(d, file))).toBe(true)
    }
  })

  it.concurrent('writes the typed client of the app entry, below the base path', async () => {
    const d = tmpDir('typed_client')
    await runGenerator(
      await generate(
        d,
        { client: client('client.ts', { credentials: 'include' }) },
        { basePath: '/v1' },
      ),
    )
    expect(await read(d, 'client.ts')).toBe(`import { hc } from 'hono/client'
import type { api } from './src'

type Client = ReturnType<typeof hc<typeof api>>

const hcWithType = (...args: Parameters<typeof hc>): Client => hc<typeof api>(...args)

export const client = hcWithType('/', { init: { credentials: 'include' } }).v1
`)
  })

  it.concurrent('reads the base URL of the client from the environment', async () => {
    const d = tmpDir('env_client')
    await runGenerator(
      await generate(d, {
        client: client('src/client.ts', {
          baseUrl: { env: 'VITE_API_URL', source: 'import.meta.env' },
        }),
      }),
    )
    expect(await read(d, 'src/client.ts')).toBe(`import { hc } from 'hono/client'
import type { api } from '.'

const baseUrl = import.meta.env.VITE_API_URL!

type Client = ReturnType<typeof hc<typeof api>>

const hcWithType = (...args: Parameters<typeof hc>): Client => hc<typeof api>(...args)

export const client = hcWithType(baseUrl)
`)
  })

  it.concurrent('delegated rpc output imports the generated client', async () => {
    const d = tmpDir('rpc_content')
    await runGenerator(
      await generate(d, { client: client('lib/client.ts'), rpc: { output: 'rpc.ts' } }),
    )
    expect(await read(d, 'rpc.ts')).toBe(`import type { ClientRequestOptions } from 'hono/client'
import { client } from './lib/client'

export async function getPing(options?: ClientRequestOptions) {
  return await client.ping.$get(undefined, options)
}
`)
  })

  it.concurrent('delegated type output declares the app type derived from the spec', async () => {
    const d = tmpDir('type_content')
    await runGenerator(await generate(d, { type: { output: 'types.ts' } }))
    expect(await read(d, 'types.ts'))
      .toBe(`declare const routes: import('@hono/zod-openapi').OpenAPIHono<
  import('hono/types').Env,
  {
    '/ping': { $get: { input: {}; output: { message: string }; outputFormat: 'json'; status: 200 } }
  },
  '/'
>
export default routes
`)
  })

  it.concurrent('hands the base path and parseResponse to the rpc generator', async () => {
    const d = tmpDir('rpc_base_path')
    await runGenerator(
      await generate(
        d,
        { client: client('client.ts'), rpc: { output: 'rpc.ts', parseResponse: true } },
        { basePath: '/v1' },
      ),
    )
    // The client is handed out below the base path, so rpc addresses the document's paths.
    expect(await read(d, 'rpc.ts')).toBe(`import type { ClientRequestOptions } from 'hono/client'
import { parseResponse } from 'hono/client'
import { client } from './client'

export async function getPing(options?: ClientRequestOptions) {
  return await parseResponse(client.ping.$get(undefined, options))
}
`)
  })

  it.concurrent('imports the client of another package by client.package', async () => {
    const d = tmpDir('client_package')
    await runGenerator(
      await generate(
        d,
        {
          client: client('client.ts', { package: '@acme/client' }),
          rpc: { output: 'web/rpc.ts' },
        },
        { packageOf },
      ),
    )
    expect(await read(d, 'web/rpc.ts')).toContain("import { client } from '@acme/client'")
  })

  it.concurrent('fails when rpc imports the client of another package that names none', async () => {
    const d = tmpDir('client_package_missing')
    const error = await runGeneratorError(
      await generate(
        d,
        { client: client('client.ts'), rpc: { output: 'web/rpc.ts' } },
        { packageOf },
      ),
    )
    expect(error).toStrictEqual(
      new ClientError({
        message:
          'rpc imports the client from another package: set client.package to the name of the package client.ts is written into.',
      }),
    )
    expect(fs.existsSync(path.join(d, 'web', 'rpc.ts'))).toBe(false)
  })

  it.concurrent('imports the app of another package by client.import', async () => {
    const d = tmpDir('app_import')
    await runGenerator(
      await generate(
        d,
        { client: client('web/client.ts', { import: '@acme/api' }) },
        { packageOf },
      ),
    )
    expect(await read(d, 'web/client.ts')).toContain("import type { api } from '@acme/api'")
  })

  it.concurrent('fails when the client imports the app of another package unnamed', async () => {
    const d = tmpDir('app_import_missing')
    const error = await runGeneratorError(
      await generate(d, { client: client('web/client.ts') }, { packageOf }),
    )
    expect(error).toStrictEqual(
      new ClientError({
        message:
          'client imports the app from another package: set client.import to the name of the package src/index.ts is written into.',
      }),
    )
  })

  it.concurrent('writes nothing and returns ok when no client target is configured', async () => {
    const d = tmpDir('empty')
    await runGenerator(await generate(d, {}))
    expect(fs.existsSync(d)).toBe(false)
  })

  it.concurrent.each([
    [
      'a relative output that traverses outside',
      { client: client('client.ts'), rpc: { output: '../escape.ts' } },
      '../escape.ts',
    ],
    ['a typed client that traverses outside', { client: client('../client.ts') }, '../client.ts'],
    ['an output that is exactly the parent (..)', { docs: { output: '..', curl: false } }, '..'],
    [
      'an absolute output outside',
      {
        client: client('client.ts'),
        'tanstack-query': { output: path.join(os.tmpdir(), 'takibi-hono-escape-abs.ts') },
      },
      path.join(os.tmpdir(), 'takibi-hono-escape-abs.ts'),
    ],
  ] as const)('rejects %s the base dir', async (_, keys, output) => {
    const d = tmpDir('traversal')
    const error = await runGeneratorError(await generate(d, keys))
    expect(error).toStrictEqual(escapes(output))
    expect(fs.existsSync(path.resolve(d, output))).toBe(output === '..')
  })

  it.concurrent('allows a normal name that merely begins with ".." (..foo)', async () => {
    const d = tmpDir('dot_dot_prefix')
    await runGenerator(await generate(d, { docs: { output: '..foo/api.md', curl: false } }))
    expect(fs.existsSync(path.join(d, '..foo', 'api.md'))).toBe(true)
  })

  it.concurrent('rejects a type output that is not a .ts file', async () => {
    const d = tmpDir('type_not_ts')
    const error = await runGeneratorError(await generate(d, { type: { output: 'types.txt' } }))
    expect(error).toStrictEqual(
      new ClientError({ message: 'type output "types.txt" must end with ".ts".' }),
    )
  })

  it.concurrent('fails with ClientError when the delegated generator cannot write', async () => {
    const d = tmpDir('delegate_fail')
    fs.mkdirSync(d, { recursive: true })
    // A file blocks the directory the generator needs to create.
    fs.writeFileSync(path.join(d, 'blocker'), 'not a directory')
    const error = await runGeneratorError(
      await generate(d, {
        client: client('client.ts'),
        'tanstack-query': { output: 'blocker/q.ts' },
      }),
    )
    expect(error._tag).toBe('ClientError')
  })

  it.concurrent('allows an absolute output that stays inside the base dir', async () => {
    const d = tmpDir('abs_inside')
    await runGenerator(await generate(d, { docs: { output: path.join(d, 'api.md'), curl: false } }))
    expect(fs.existsSync(path.join(d, 'api.md'))).toBe(true)
  })
})
