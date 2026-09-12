import fs from 'node:fs'
import fsp from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import { afterAll, beforeAll, describe, expect, it } from 'vite-plus/test'

import { parseOpenAPI } from '../openapi/index.js'
import { runGenerator, runGeneratorError } from '../testing/index.js'
import { ClientError, makeClients } from './client.js'

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

describe('makeClients', () => {
  it.concurrent('generates every configured client target inside the base dir', async () => {
    const d = tmpDir('all')
    await runGenerator(
      makeClients(
        await openapi(),
        {
          rpc: { output: 'rpc.ts', import: './index' },
          swr: { output: 'swr.ts', import: './index' },
          tanstackQuery: { output: 'tanstack.ts', import: './index' },
          svelteQuery: { output: 'svelte.ts', import: './index' },
          vueQuery: { output: 'vue.ts', import: './index' },
          preactQuery: { output: 'preact.ts', import: './index' },
          solidQuery: { output: 'solid.ts', import: './index' },
          angularQuery: { output: 'angular.ts', import: './index' },
          type: { output: 'types.ts' },
          docs: { output: 'docs.md' },
        },
        d,
      ),
    )
    expect(fs.existsSync(path.join(d, 'rpc.ts'))).toBe(true)
    expect(fs.existsSync(path.join(d, 'swr.ts'))).toBe(true)
    expect(fs.existsSync(path.join(d, 'tanstack.ts'))).toBe(true)
    expect(fs.existsSync(path.join(d, 'svelte.ts'))).toBe(true)
    expect(fs.existsSync(path.join(d, 'vue.ts'))).toBe(true)
    expect(fs.existsSync(path.join(d, 'preact.ts'))).toBe(true)
    expect(fs.existsSync(path.join(d, 'solid.ts'))).toBe(true)
    expect(fs.existsSync(path.join(d, 'angular.ts'))).toBe(true)
    expect(fs.existsSync(path.join(d, 'types.ts'))).toBe(true)
    expect(fs.existsSync(path.join(d, 'docs.md'))).toBe(true)
  })

  it.concurrent('delegated rpc output contains a typed client function per operation', async () => {
    const d = tmpDir('rpc_content')
    await runGenerator(
      makeClients(await openapi(), { rpc: { output: 'rpc.ts', import: './index' } }, d),
    )
    const rpcCode = await fsp.readFile(path.join(d, 'rpc.ts'), 'utf-8')
    expect(rpcCode).toBe(`import type { ClientRequestOptions } from 'hono/client'
import { client } from './index'

export async function getPing(options?: ClientRequestOptions) {
  return await client.ping.$get(undefined, options)
}
`)
  })

  it.concurrent('delegated type output declares the app type derived from the spec', async () => {
    const d = tmpDir('type_content')
    await runGenerator(makeClients(await openapi(), { type: { output: 'types.ts' } }, d))
    const typeCode = await fsp.readFile(path.join(d, 'types.ts'), 'utf-8')
    expect(typeCode).toBe(`declare const routes: import('@hono/zod-openapi').OpenAPIHono<
  import('hono/types').Env,
  {
    '/ping': { $get: { input: {}; output: { message: string }; outputFormat: 'json'; status: 200 } }
  },
  '/'
>
export default routes
`)
  })

  it.concurrent('generates split client output as a directory of per-operation files', async () => {
    const d = tmpDir('split')
    await runGenerator(
      makeClients(
        await openapi(),
        {
          rpc: { output: 'rpc', import: './index', split: true },
          tanstackQuery: { output: 'tq', import: './index', split: true },
        },
        d,
      ),
    )
    expect(fs.readdirSync(path.join(d, 'rpc')).sort()).toStrictEqual(['getPing.ts', 'index.ts'])
    expect(fs.readdirSync(path.join(d, 'tq')).sort()).toStrictEqual([
      'getPing.ts',
      'index.ts',
      'keys.ts',
    ])
  })

  it.concurrent('writes nothing and returns ok when no client target is configured', async () => {
    const d = tmpDir('empty')
    await runGenerator(makeClients(await openapi(), {}, d))
    expect(fs.existsSync(d)).toBe(false)
  })

  it.concurrent.each([
    [
      'a relative output that traverses outside',
      { rpc: { output: '../escape.ts', import: './index' } },
      '../escape.ts',
    ],
    ['an output that is exactly the parent (..)', { docs: { output: '..' } }, '..'],
    [
      'an absolute output outside',
      {
        tanstackQuery: {
          output: path.join(os.tmpdir(), 'takibi-hono-escape-abs.ts'),
          import: './index',
        },
      },
      path.join(os.tmpdir(), 'takibi-hono-escape-abs.ts'),
    ],
  ] as const)('rejects %s the base dir', async (_, client, output) => {
    const d = tmpDir('traversal')
    const error = await runGeneratorError(makeClients(await openapi(), client, d))
    expect(error).toStrictEqual(escapes(output))
    expect(fs.existsSync(path.resolve(d, output))).toBe(output === '..')
  })

  it.concurrent('allows a normal name that merely begins with ".." (..foo)', async () => {
    const d = tmpDir('dotdot_prefix')
    await runGenerator(makeClients(await openapi(), { docs: { output: '..foo/api.md' } }, d))
    expect(fs.existsSync(path.join(d, '..foo', 'api.md'))).toBe(true)
  })

  it.concurrent('rejects a type output that is not a .ts file', async () => {
    const d = tmpDir('type_not_ts')
    const error = await runGeneratorError(
      makeClients(await openapi(), { type: { output: 'types.txt' } }, d),
    )
    expect(error).toStrictEqual(
      new ClientError({ message: 'Client type output "types.txt" must end with ".ts".' }),
    )
  })

  it.concurrent('fails with ClientError when the delegated generator cannot write', async () => {
    const d = tmpDir('delegate_fail')
    fs.mkdirSync(d, { recursive: true })
    // A file blocks the directory the generator needs to create.
    fs.writeFileSync(path.join(d, 'blocker'), 'not a directory')
    const error = await runGeneratorError(
      makeClients(
        await openapi(),
        { tanstackQuery: { output: 'blocker/q.ts', import: './index' } },
        d,
      ),
    )
    expect(error._tag).toBe('ClientError')
  })

  it.concurrent('allows an absolute output that stays inside the base dir', async () => {
    const d = tmpDir('abs_inside')
    await runGenerator(
      makeClients(await openapi(), { docs: { output: path.join(d, 'api.md') } }, d),
    )
    expect(fs.existsSync(path.join(d, 'api.md'))).toBe(true)
  })
})
