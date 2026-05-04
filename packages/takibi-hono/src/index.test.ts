import fs from 'node:fs'
import fsp from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

import { afterAll, beforeAll, describe, expect, it } from 'vite-plus/test'

import { parseConfig } from './config/index.js'
import { hono } from './core/index.js'

/**
 * Entry point integration test helper.
 *
 * Replicates the exact logic of src/index.ts + src/cli/index.ts:
 *   1. readConfig() → parseConfig(mod.default)
 *   2. hono(config)
 *   3. Return success message or error
 */
async function runEntryPoint(
  dir: string,
): Promise<
  { readonly ok: true; readonly value: string } | { readonly ok: false; readonly error: string }
> {
  const originalCwd = process.cwd()
  process.chdir(dir)
  try {
    const configPath = path.resolve(dir, 'takibi-hono.config.ts')
    if (!fs.existsSync(configPath)) return { ok: false, error: `Config not found: ${configPath}` }

    const url = pathToFileURL(configPath).href
    const mod: { default?: unknown } = await import(`${url}?t=${Date.now()}`)
    if (!('default' in mod) || mod.default === undefined)
      return { ok: false, error: 'Config must export default object' }

    const configResult = parseConfig(mod.default)
    if (!configResult.ok) return configResult

    const config = configResult.value
    const result = await hono({
      input: config.input,
      schema: config.schema,
      basePath: config.basePath,
      format: config.format,
      openapi: config.openapi,
      'takibi-hono': config['takibi-hono'],
    })
    if (!result.ok) return result
    return { ok: true, value: `🔥 takibi-hono: ${config.input} (${config.schema}) ✅` }
  } finally {
    process.chdir(originalCwd)
  }
}

const PETSTORE_YAML = `openapi: 3.0.3
info:
  title: Petstore
  version: 1.0.0
paths:
  /pets:
    get:
      summary: List all pets
      parameters:
        - name: limit
          in: query
          required: false
          schema:
            type: integer
      responses:
        '200':
          description: A list of pets
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Pet'
    post:
      summary: Create a pet
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreatePet'
      responses:
        '201':
          description: Created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Pet'
components:
  schemas:
    Pet:
      type: object
      required:
        - id
        - name
      description: A pet in the store
      properties:
        id:
          type: integer
        name:
          type: string
        tag:
          type: string
    CreatePet:
      type: object
      required:
        - name
      description: Data for creating a new pet
      properties:
        name:
          type: string
        tag:
          type: string
`

let tempBase: string

beforeAll(async () => {
  tempBase = fs.mkdtempSync(path.join(os.tmpdir(), 'takibi-hono-index-test-'))
})

const tmpDirs: string[] = []
afterAll(async () => {
  for (const d of tmpDirs) await fsp.rm(d, { recursive: true, force: true }).catch(() => {})
  if (tempBase) await fsp.rm(tempBase, { recursive: true, force: true }).catch(() => {})
})

function tmpDir(label: string): string {
  const d = path.join(os.tmpdir(), `takibi-hono-idx-__test_${label}_${Date.now()}`)
  tmpDirs.push(d)
  return d
}

async function setupProject(
  dir: string,
  config: Record<string, unknown>,
  specFileName: string,
  specContent: string,
): Promise<void> {
  await fsp.mkdir(dir, { recursive: true })
  await fsp.writeFile(path.join(dir, specFileName), specContent)
  await fsp.writeFile(
    path.join(dir, 'takibi-hono.config.ts'),
    `export default ${JSON.stringify(config, null, 2)}\n`,
  )
}

describe('src/index.ts entry point', () => {
  describe('return value format', () => {
    it('returns { ok: true, value: string } on success', { timeout: 30000 }, async () => {
      const d = tmpDir('idx_ok')
      await setupProject(
        d,
        {
          input: 'petstore.yaml',
          schema: 'zod',
          'takibi-hono': {
            handlers: { output: 'src/handlers' },
            components: { schemas: { output: 'src/schemas.ts' } },
          },
        },
        'petstore.yaml',
        PETSTORE_YAML,
      )

      const result = await runEntryPoint(d)
      expect(result).toStrictEqual({
        ok: true,
        value: '🔥 takibi-hono: petstore.yaml (zod) ✅',
      })
    })

    it(
      'returns { ok: false, error: string } when config not found',
      { timeout: 30000 },
      async () => {
        const d = tmpDir('idx_no_config')
        await fsp.mkdir(d, { recursive: true })

        const result = await runEntryPoint(d)
        expect(result).toStrictEqual({
          ok: false,
          error: `Config not found: ${path.resolve(d, 'takibi-hono.config.ts')}`,
        })
      },
    )

    it(
      'returns { ok: false, error: string } when input file missing',
      { timeout: 30000 },
      async () => {
        const d = tmpDir('idx_no_input')
        await setupProject(d, { input: 'nonexistent.yaml', schema: 'zod' }, 'placeholder.yaml', '')
        await fsp.unlink(path.join(d, 'placeholder.yaml'))

        const result = await runEntryPoint(d)
        expect(result.ok).toBe(false)
      },
    )

    it('returns { ok: false } when config has invalid schema', { timeout: 30000 }, async () => {
      const d = tmpDir('idx_invalid')
      await fsp.mkdir(d, { recursive: true })
      await fsp.writeFile(
        path.join(d, 'takibi-hono.config.ts'),
        `export default { input: 'api.yaml', schema: 'invalid' }\n`,
      )

      const result = await runEntryPoint(d)
      expect(result).toStrictEqual({
        ok: false,
        error:
          'Invalid config: schema: schema must be "zod" | "valibot" | "typebox" | "arktype" | "effect"',
      })
    })
  })

  describe('success message format', () => {
    it('zod: message includes input and schema library', { timeout: 30000 }, async () => {
      const d = tmpDir('idx_msg_zod')
      await setupProject(
        d,
        {
          input: 'petstore.yaml',
          schema: 'zod',
          'takibi-hono': {
            handlers: { output: 'src/handlers' },
            components: { schemas: { output: 'src/schemas.ts' } },
          },
        },
        'petstore.yaml',
        PETSTORE_YAML,
      )

      const result = await runEntryPoint(d)
      expect(result).toStrictEqual({
        ok: true,
        value: '🔥 takibi-hono: petstore.yaml (zod) ✅',
      })
    })

    it('effect: message includes input and schema library', { timeout: 30000 }, async () => {
      const d = tmpDir('idx_msg_effect')
      await setupProject(
        d,
        {
          input: 'petstore.yaml',
          schema: 'effect',
          'takibi-hono': {
            handlers: { output: 'src/handlers' },
            components: { schemas: { output: 'src/schemas.ts' } },
          },
        },
        'petstore.yaml',
        PETSTORE_YAML,
      )

      const result = await runEntryPoint(d)
      expect(result).toStrictEqual({
        ok: true,
        value: '🔥 takibi-hono: petstore.yaml (effect) ✅',
      })
    })
  })

  describe('file generation verification', () => {
    it('generates complete file structure', { timeout: 30000 }, async () => {
      const d = tmpDir('idx_files')
      await setupProject(
        d,
        {
          input: 'petstore.yaml',
          schema: 'zod',
          'takibi-hono': {
            handlers: { output: 'src/handlers' },
            components: { schemas: { output: 'src/schemas.ts' } },
          },
        },
        'petstore.yaml',
        PETSTORE_YAML,
      )

      const result = await runEntryPoint(d)
      expect(result.ok).toBe(true)

      expect(fs.existsSync(path.join(d, 'src/schemas.ts'))).toBe(true)
      expect(fs.existsSync(path.join(d, 'src/handlers/pets.ts'))).toBe(true)
      expect(fs.existsSync(path.join(d, 'src/handlers/index.ts'))).toBe(true)
      expect(fs.existsSync(path.join(d, 'src/index.ts'))).toBe(true)

      const schemas = await fsp.readFile(path.join(d, 'src/schemas.ts'), 'utf-8')
      expect(schemas).toBe(`import * as z from 'zod'

export const PetSchema = z
  .object({ id: z.int(), name: z.string(), tag: z.string().optional() })
  .meta({ description: 'A pet in the store' })

export const CreatePetSchema = z
  .object({ name: z.string(), tag: z.string().optional() })
  .meta({ description: 'Data for creating a new pet' })
`)
    })

    it('components.output generates to base directory', { timeout: 30000 }, async () => {
      const d = tmpDir('idx_co')
      await setupProject(
        d,
        {
          input: 'petstore.yaml',
          schema: 'zod',
          'takibi-hono': {
            handlers: { output: 'src/handlers' },
            components: { output: 'src/openapi' },
            exportSchemasTypes: true,
          },
        },
        'petstore.yaml',
        PETSTORE_YAML,
      )

      const result = await runEntryPoint(d)
      expect(result.ok).toBe(true)

      expect(fs.existsSync(path.join(d, 'src/openapi/index.ts'))).toBe(true)

      const schemas = await fsp.readFile(path.join(d, 'src/openapi/index.ts'), 'utf-8')
      expect(schemas).toBe(`import * as z from 'zod'

export const PetSchema = z
  .object({ id: z.int(), name: z.string(), tag: z.string().optional() })
  .meta({ description: 'A pet in the store' })

export type Pet = z.infer<typeof PetSchema>

export const CreatePetSchema = z
  .object({ name: z.string(), tag: z.string().optional() })
  .meta({ description: 'Data for creating a new pet' })

export type CreatePet = z.infer<typeof CreatePetSchema>
`)
    })

    it('readonly: true adds .readonly() to schemas', { timeout: 30000 }, async () => {
      const d = tmpDir('idx_readonly')
      await setupProject(
        d,
        {
          input: 'petstore.yaml',
          schema: 'zod',
          'takibi-hono': {
            readonly: true,
            handlers: { output: 'src/handlers' },
            components: { schemas: { output: 'src/schemas.ts' } },
          },
        },
        'petstore.yaml',
        PETSTORE_YAML,
      )

      const result = await runEntryPoint(d)
      expect(result.ok).toBe(true)

      const schemas = await fsp.readFile(path.join(d, 'src/schemas.ts'), 'utf-8')
      expect(schemas).toBe(`import * as z from 'zod'

export const PetSchema = z
  .object({ id: z.int(), name: z.string(), tag: z.string().optional() })
  .meta({ description: 'A pet in the store' })
  .readonly()

export const CreatePetSchema = z
  .object({ name: z.string(), tag: z.string().optional() })
  .meta({ description: 'Data for creating a new pet' })
  .readonly()
`)
    })

    it(
      'readonly + components.output + exportSchemasTypes + effect',
      { timeout: 30000 },
      async () => {
        const d = tmpDir('idx_ro_co_et')
        await setupProject(
          d,
          {
            input: 'petstore.yaml',
            schema: 'effect',
            openapi: true,
            'takibi-hono': {
              readonly: true,
              handlers: { output: 'src/handlers' },
              components: { output: 'src/openapi' },
              exportSchemasTypes: true,
            },
          },
          'petstore.yaml',
          PETSTORE_YAML,
        )

        const result = await runEntryPoint(d)
        expect(result).toStrictEqual({
          ok: true,
          value: '🔥 takibi-hono: petstore.yaml (effect) ✅',
        })

        expect(fs.existsSync(path.join(d, 'src/openapi/index.ts'))).toBe(true)
        expect(fs.existsSync(path.join(d, 'src/handlers/pets.ts'))).toBe(true)
        expect(fs.existsSync(path.join(d, 'src/index.ts'))).toBe(true)

        const schemas = await fsp.readFile(path.join(d, 'src/openapi/index.ts'), 'utf-8')
        expect(schemas).toBe(`import { Schema } from 'effect'

export const PetSchema = Schema.Struct({
  id: Schema.Number.pipe(Schema.int()),
  name: Schema.String,
  tag: Schema.optional(Schema.String),
}).annotations({ description: 'A pet in the store' })

export type Pet = typeof PetSchema.Encoded

export const CreatePetSchema = Schema.Struct({
  name: Schema.String,
  tag: Schema.optional(Schema.String),
}).annotations({ description: 'Data for creating a new pet' })

export type CreatePet = typeof CreatePetSchema.Encoded
`)
      },
    )
  })
})
