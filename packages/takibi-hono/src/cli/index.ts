import { readConfig } from '../config/index.js'
import { hono } from '../core/index.js'

/**
 * CLI entry point for takibi-hono code generation.
 *
 * Reads `takibi-hono.config.ts` from the current directory and generates code.
 */
export async function takibiHono(): Promise<
  { readonly ok: true; readonly value: string } | { readonly ok: false; readonly error: string }
> {
  const configResult = await readConfig()
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
}
