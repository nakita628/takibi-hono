import { setFormatOptions } from '../format/index.js'
import { parseOpenAPI } from '../openapi/index.js'
import { makeApp } from './app/index.js'
import { makeComponents } from './components/index.js'
import { makeHandlers } from './handlers/index.js'
import type { SchemaLib, TakibiHonoOptions } from './layout.js'
import { resolveLayout } from './layout.js'
import { makeSchemas } from './schemas/index.js'
import { makeWebhooks } from './webhooks/index.js'

/**
 * Single-call orchestrator: parses the input spec and runs every generator
 * in order.
 *
 * Used by the vite plugin (which only knows about a single entry point) and
 * kept as a convenience for callers who want one-shot generation. The CLI
 * inlines the same sequence so it can short-circuit cleanly on failure.
 */
export async function hono(config: {
  readonly input: string
  readonly schema: SchemaLib
  readonly basePath?: string | undefined
  readonly format?: Record<string, unknown> | undefined
  readonly openapi?: boolean | undefined
  readonly 'takibi-hono'?: TakibiHonoOptions | undefined
}) {
  if (config.format) setFormatOptions(config.format)
  const parseResult = await parseOpenAPI(config.input)
  if (!parseResult.ok) return parseResult
  const openapi = parseResult.value
  const ohConfig = config['takibi-hono']
  const useOpenAPI = config.openapi === true
  const layout = resolveLayout(ohConfig)
  const schemasResult = await makeSchemas(openapi, config.schema, useOpenAPI, ohConfig, layout)
  if (!schemasResult.ok) return schemasResult
  if (useOpenAPI) {
    const componentsResult = await makeComponents(openapi, config.schema, ohConfig, layout)
    if (!componentsResult.ok) return componentsResult
  }
  const handlersResult = await makeHandlers(openapi, config.schema, useOpenAPI, layout)
  if (!handlersResult.ok) return handlersResult
  if (useOpenAPI) {
    const webhooksResult = await makeWebhooks(openapi, config.schema, layout)
    if (!webhooksResult.ok) return webhooksResult
  }
  return makeApp(openapi, handlersResult.value.handlerFileNames, config.basePath, layout)
}
