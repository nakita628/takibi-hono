import fs from 'node:fs'
import fsp from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import { afterAll, beforeAll, describe, expect, it } from 'vite-plus/test'

import { parseOpenAPI } from '../../openapi/index.js'
import { makeClients } from './index.js'

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
  for (const d of tmpDirs) await fsp.rm(d, { recursive: true, force: true }).catch(() => {})
  if (tempBase) await fsp.rm(tempBase, { recursive: true, force: true }).catch(() => {})
})

function tmpDir(label: string): string {
  const d = path.join(os.tmpdir(), `takibi-hono-client-__test_${label}_${Date.now()}`)
  tmpDirs.push(d)
  return d
}

async function openapi() {
  const r = await parseOpenAPI(specPath)
  if (!r.ok) throw new Error(r.error)
  return r.value
}

describe('makeClients', () => {
  it.concurrent('generates every configured client target inside the base dir', async () => {
    const d = tmpDir('all')
    const result = await makeClients(
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
    )
    expect(result.ok).toBe(true)
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

  it.concurrent('generates split client output as a directory of per-operation files', async () => {
    const d = tmpDir('split')
    const result = await makeClients(
      await openapi(),
      {
        rpc: { output: 'rpc', import: './index', split: true },
        tanstackQuery: { output: 'tq', import: './index', split: true },
      },
      d,
    )
    expect(result.ok).toBe(true)
    expect(fs.readdirSync(path.join(d, 'rpc')).sort()).toStrictEqual(['getPing.ts', 'index.ts'])
    expect(fs.readdirSync(path.join(d, 'tq')).sort()).toStrictEqual(['getPing.ts', 'index.ts'])
  })

  it.concurrent('writes nothing and returns ok when no client target is configured', async () => {
    const d = tmpDir('empty')
    const result = await makeClients(await openapi(), {}, d)
    expect(result.ok).toBe(true)
    expect(fs.existsSync(d)).toBe(false)
  })

  it.concurrent('rejects a relative output that traverses outside the base dir', async () => {
    const d = tmpDir('traversal_rel')
    const result = await makeClients(
      await openapi(),
      { rpc: { output: '../escape.ts', import: './index' } },
      d,
    )
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toBe(
        'Client output path "../escape.ts" escapes the project directory. Use a path inside the project (remove leading "/" or "..").',
      )
    }
    expect(fs.existsSync(path.join(path.dirname(d), 'escape.ts'))).toBe(false)
  })

  it.concurrent('rejects an output that is exactly the parent (..)', async () => {
    const d = tmpDir('traversal_dotdot')
    const result = await makeClients(await openapi(), { docs: { output: '..' } }, d)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toBe(
        'Client output path ".." escapes the project directory. Use a path inside the project (remove leading "/" or "..").',
      )
    }
  })

  it.concurrent('allows a normal name that merely begins with ".." (..foo)', async () => {
    const d = tmpDir('dotdot_prefix')
    const result = await makeClients(await openapi(), { docs: { output: '..foo/api.md' } }, d)
    expect(result.ok).toBe(true)
    expect(fs.existsSync(path.join(d, '..foo', 'api.md'))).toBe(true)
  })

  it.concurrent('rejects an absolute output outside the base dir', async () => {
    const d = tmpDir('traversal_abs')
    const escapeAbs = path.join(os.tmpdir(), 'takibi-hono-escape-abs.ts')
    const result = await makeClients(
      await openapi(),
      { tanstackQuery: { output: escapeAbs, import: './index' } },
      d,
    )
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toBe(
        `Client output path "${escapeAbs}" escapes the project directory. Use a path inside the project (remove leading "/" or "..").`,
      )
    }
    expect(fs.existsSync(escapeAbs)).toBe(false)
  })

  it.concurrent('rejects a type output that is not a .ts file', async () => {
    const d = tmpDir('type_not_ts')
    const result = await makeClients(await openapi(), { type: { output: 'types.txt' } }, d)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toBe('Client type output "types.txt" must end with ".ts".')
    }
  })

  it.concurrent('propagates ok: false when the delegated generator fails to write', async () => {
    const d = tmpDir('delegate_fail')
    fs.mkdirSync(d, { recursive: true })
    // A file blocks the directory the generator needs to create, so the
    // delegated hono-takibi write fails and the failure must propagate.
    fs.writeFileSync(path.join(d, 'blocker'), 'not a directory')
    const result = await makeClients(
      await openapi(),
      { tanstackQuery: { output: 'blocker/q.ts', import: './index' } },
      d,
    )
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(typeof result.error).toBe('string')
      expect(result.error.length > 0).toBe(true)
    }
  })

  it.concurrent('allows an absolute output that stays inside the base dir', async () => {
    const d = tmpDir('abs_inside')
    const result = await makeClients(
      await openapi(),
      { docs: { output: path.join(d, 'api.md') } },
      d,
    )
    expect(result.ok).toBe(true)
    expect(fs.existsSync(path.join(d, 'api.md'))).toBe(true)
  })
})
