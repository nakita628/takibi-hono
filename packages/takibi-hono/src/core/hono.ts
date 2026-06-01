import { setFormatOptions } from '../format/index.js'
import { parseOpenAPI } from '../openapi/index.js'
import { makeApp } from './app/index.js'
import { makeClients } from './client/index.js'
import { makeComponents } from './components/index.js'
import { makeHandlers } from './handlers/index.js'
import type { TakibiHonoOptions } from './layout.js'
import { resolveLayout } from './layout.js'
import { makeSchemas } from './schemas/index.js'
import { makeWebhooks } from './webhooks/index.js'

/**
 * Single-call orchestrator: parses the input spec and runs every generator
 * in order. Used by the CLI and the Vite plugin.
 */
export async function hono(config: {
  readonly input: string
  readonly schema: 'zod' | 'valibot' | 'typebox' | 'arktype' | 'effect'
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
  const componentsResult = await makeComponents(
    openapi,
    config.schema,
    useOpenAPI,
    ohConfig,
    layout,
  )
  if (!componentsResult.ok) return componentsResult
  const handlersResult = await makeHandlers(openapi, config.schema, useOpenAPI, layout)
  if (!handlersResult.ok) return handlersResult
  if (useOpenAPI) {
    const webhooksResult = await makeWebhooks(openapi, config.schema, layout)
    if (!webhooksResult.ok) return webhooksResult
  }
  const appResult = await makeApp(
    openapi,
    handlersResult.value.handlerFileNames,
    config.basePath,
    layout,
  )
  if (!appResult.ok) return appResult
  if (ohConfig?.client) {
    const clientResult = await makeClients(openapi, ohConfig.client, process.cwd(), config.basePath)
    if (!clientResult.ok) return clientResult
  }
  return appResult
}
