import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import * as NodeServices from '@effect/platform-node/NodeServices'
import { Console, Effect, Exit, Stdio } from 'effect'
import { afterEach, describe, expect, it } from 'vite-plus/test'

import { takibiHono } from './index.js'

// oxlint-disable-next-line no-control-regex -- the help renderer colors its output
const ANSI = /\u001B\[[0-9;]*m/gu

const SPEC = `openapi: 3.1.0
info: { title: Ping, version: 1.0.0 }
paths:
  /ping:
    get:
      responses:
        '200': { description: pong }
`

/**
 * Runs the command the way the executable does — same command, same platform services —
 * with the arguments supplied through `Stdio` and the `Console` service swapped for a
 * recorder. `--help`, the error block and the success message all go through `Console`, so
 * this captures what a user sees.
 */
async function runCli(argv: readonly string[]) {
  const stdout: string[] = []
  const stderr: string[] = []
  const recorder: Console.Console = Object.assign(Object.create(console), {
    log: (...args: readonly unknown[]) => stdout.push(args.map(String).join(' ')),
    error: (...args: readonly unknown[]) => stderr.push(args.map(String).join(' ')),
  })
  const exit = await Effect.runPromiseExit(
    takibiHono().pipe(
      Effect.provideService(Console.Console, recorder),
      Effect.provide(Stdio.layerTest({ args: Effect.succeed(argv) })),
      Effect.provide(NodeServices.layer),
    ),
  )
  return {
    ok: Exit.isSuccess(exit),
    stdout: stdout.join('\n').replaceAll(ANSI, ''),
    stderr: stderr.join('\n').replaceAll(ANSI, ''),
  }
}

const originalCwd = process.cwd()
const dirs: string[] = []

function useTmpDir(files: { readonly [name: string]: string } = {}) {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'takibi-hono-cli-')))
  dirs.push(dir)
  for (const [name, content] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(dir, name)), { recursive: true })
    fs.writeFileSync(path.join(dir, name), content)
  }
  process.chdir(dir)
  return dir
}

afterEach(() => {
  process.chdir(originalCwd)
  for (const dir of dirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true })
})

describe('takibi-hono', { timeout: 30_000 }, () => {
  it('runs ./takibi-hono.config.ts and reports what it generated from', async () => {
    useTmpDir({
      'openapi.yaml': SPEC,
      'takibi-hono.config.ts': "export default { input: 'openapi.yaml', schema: 'zod' }\n",
    })

    const result = await runCli([])

    expect(result).toStrictEqual({
      ok: true,
      stdout: '🔥 takibi-hono: openapi.yaml (zod) ✅',
      stderr: '',
    })
    expect(fs.readFileSync('src/handlers/ping.ts', 'utf8')).toBe(`import { Hono } from 'hono'

export const pingHandler = new Hono().get('/ping', (c) => {})
`)
  })

  it.each([['--config'], ['-c']])('runs the config file named by %s', async (flag) => {
    useTmpDir({
      'spec/openapi.yaml': SPEC,
      'config/api.config.ts': "export default { input: 'spec/openapi.yaml', schema: 'valibot' }\n",
    })

    const result = await runCli([flag, 'config/api.config.ts'])

    expect(result.stdout).toBe('🔥 takibi-hono: spec/openapi.yaml (valibot) ✅')
    expect(fs.existsSync('src/handlers/ping.ts')).toBe(true)
  })

  it('answers a missing default config with the usage and the path it looked for', async () => {
    const dir = useTmpDir()

    const result = await runCli([])

    expect(result.ok).toBe(false)
    expect(result.stdout.startsWith('DESCRIPTION\n')).toBe(true)
    expect(result.stderr.trim()).toBe(
      `ERROR\n  Config not found: ${path.join(dir, 'takibi-hono.config.ts')}\nCreate takibi-hono.config.ts in the current directory. See https://github.com/nakita628/takibi-hono#configuration for an example.`,
    )
  })

  it('rejects a --config file that does not exist', async () => {
    const dir = useTmpDir()

    const result = await runCli(['--config', 'nope.config.ts'])

    expect(result.ok).toBe(false)
    expect(result.stderr.trim()).toBe(
      `ERROR\n  Invalid value for flag --config: "nope.config.ts". Expected: Path does not exist: ${path.join(dir, 'nope.config.ts')}`,
    )
  })

  it('reports an invalid config without the usage', async () => {
    useTmpDir({ 'takibi-hono.config.ts': "export default { input: 'a.yaml', schema: 'yup' }\n" })

    const result = await runCli([])

    expect(result).toStrictEqual({
      ok: false,
      stdout: '',
      stderr:
        '\nERROR\n  Invalid config: schema: Expected "zod" | "valibot" | "typebox" | "arktype" | "effect"',
    })
  })

  it('reports a generation failure', async () => {
    useTmpDir({
      'takibi-hono.config.ts': "export default { input: 'missing.yaml', schema: 'zod' }\n",
    })

    const result = await runCli([])

    expect(result.ok).toBe(false)
    expect(result.stderr.trim().startsWith('ERROR\n  Error opening file ')).toBe(true)
  })

  it('rejects an unknown flag', async () => {
    useTmpDir()

    const result = await runCli(['--watch'])

    expect(result.ok).toBe(false)
    expect(result.stderr.trim()).toBe('ERROR\n  Unrecognized flag: --watch in command takibi-hono')
  })

  it('lists its flags in --help', async () => {
    useTmpDir()

    const result = await runCli(['--help'])

    const flags = result.stdout
      .slice(result.stdout.indexOf('FLAGS\n'), result.stdout.indexOf('GLOBAL FLAGS'))
      .split('\n')
      .filter((line) => line.startsWith('  --'))
      .map((line) => line.trim().replaceAll(/ {2,}/gu, '  '))
    expect(flags).toStrictEqual([
      '--output, -o output.ts  One-shot mode: write the schemas and the defineHandler definition of every operation to this file',
      '--schema, -s choice  Schema library of the one-shot mode (default: zod) (choices: zod, valibot, arktype, effect)',
      '--config, -c file  Config file to run (default: ./takibi-hono.config.ts)',
    ])
  })

  describe('one-shot mode', () => {
    const PING = `import { defineHandler } from 'hono/factory'

export const getPingHandler = defineHandler({})
`

    it('writes the schemas and the definition of every operation to -o', async () => {
      useTmpDir({ 'spec/openapi.yaml': SPEC })

      const result = await runCli(['spec/openapi.yaml', '-o', 'src/api.ts'])

      expect(result).toStrictEqual({
        ok: true,
        stdout: '🔥 takibi-hono: spec/openapi.yaml (zod) → src/api.ts ✅',
        stderr: '',
      })
      expect(fs.readFileSync('src/api.ts', 'utf8')).toBe(PING)
    })

    it('generates from the one conventional document in the current directory', async () => {
      useTmpDir({
        'openapi.json': JSON.stringify({
          openapi: '3.1.0',
          info: { title: 'Ping', version: '1.0.0' },
          paths: { '/ping': { get: { responses: { '200': { description: 'pong' } } } } },
        }),
      })

      const result = await runCli(['--output', 'api.ts'])

      expect(result.stdout).toBe('🔥 takibi-hono: openapi.json (zod) → api.ts ✅')
      expect(fs.readFileSync('api.ts', 'utf8')).toBe(PING)
    })

    it('validates with the library --schema names', async () => {
      useTmpDir({
        'openapi.yaml': `openapi: 3.1.0
info: { title: Pets, version: 1.0.0 }
paths:
  /pets:
    post:
      requestBody:
        content:
          application/json:
            schema: { $ref: '#/components/schemas/Pet' }
      responses:
        '201': { description: created }
components:
  schemas:
    Pet: { type: object, required: [name], properties: { name: { type: string } } }
`,
      })

      const result = await runCli(['-o', 'api.ts', '--schema', 'valibot'])

      expect(result.stdout).toBe('🔥 takibi-hono: openapi.yaml (valibot) → api.ts ✅')
      expect(fs.readFileSync('api.ts', 'utf8')).toBe(`import { defineHandler } from 'hono/factory'
import * as v from 'valibot'

export const PetSchema = v.object({ name: v.string() })

export type Pet = v.InferOutput<typeof PetSchema>

export const postPetsHandler = defineHandler({ json: PetSchema })
`)
    })

    it('writes over an existing output file: nothing in it is the user’s', async () => {
      useTmpDir({ 'openapi.yaml': SPEC, 'api.ts': 'export const stale = 1\n' })

      const result = await runCli(['-o', 'api.ts'])

      expect(result.ok).toBe(true)
      expect(fs.readFileSync('api.ts', 'utf8')).toBe(PING)
    })

    it.each([
      [
        'none of the conventional documents is there',
        {},
        '-o <output.ts> needs an <input> document: none of openapi.yaml, openapi.json, main.tsp is in the current directory.',
      ],
      [
        'two conventional documents are there',
        { 'openapi.yaml': SPEC, 'main.tsp': '' },
        '-o <output.ts> needs an <input> document: openapi.yaml and main.tsp are both in the current directory.',
      ],
    ])('asks for the input when %s', async (_, files, message) => {
      useTmpDir(files)

      const result = await runCli(['-o', 'api.ts'])

      expect(result.ok).toBe(false)
      expect(result.stdout.startsWith('DESCRIPTION\n')).toBe(true)
      expect(result.stderr.trim()).toBe(`ERROR\n  ${message}`)
    })

    it.each([
      [
        ['openapi.yaml'],
        '<input> and --schema are the one-shot mode, which writes to -o <output.ts>. Without -o, takibi-hono runs a config file.',
      ],
      [
        ['--schema', 'zod'],
        '<input> and --schema are the one-shot mode, which writes to -o <output.ts>. Without -o, takibi-hono runs a config file.',
      ],
      [
        ['-o', 'api.ts', '--config', 'takibi-hono.config.ts'],
        '--config cannot be combined with <input>, --output or --schema: a config file names its own input, outputs and schema library.',
      ],
    ])('rejects %j with the usage', async (argv, message) => {
      useTmpDir({
        'openapi.yaml': SPEC,
        'takibi-hono.config.ts': "export default { input: 'openapi.yaml', schema: 'zod' }\n",
      })

      const result = await runCli(argv)

      expect(result.ok).toBe(false)
      expect(result.stdout.startsWith('DESCRIPTION\n')).toBe(true)
      expect(result.stderr.trim()).toBe(`ERROR\n  ${message}`)
    })

    it('rejects typebox, which has no Standard Schema interface', async () => {
      useTmpDir({ 'openapi.yaml': SPEC })

      const result = await runCli(['-o', 'api.ts', '--schema', 'typebox'])

      expect(result.ok).toBe(false)
      expect(result.stderr.trim()).toBe(
        'ERROR\n  Invalid value for flag --schema: "typebox". Expected: "zod" | "valibot" | "arktype" | "effect"',
      )
    })
  })

  it('prints the version from package.json', async () => {
    useTmpDir()
    const manifest: unknown = JSON.parse(
      fs.readFileSync(new URL('../../package.json', import.meta.url), 'utf8'),
    )
    const version =
      typeof manifest === 'object' && manifest !== null && 'version' in manifest
        ? String(manifest.version)
        : ''

    const result = await runCli(['--version'])

    expect(result).toStrictEqual({ ok: true, stdout: `takibi-hono v${version}`, stderr: '' })
  })
})
