import { readConfig } from '../config/index.js'
import {
  makeApp,
  makeComponents,
  makeHandlers,
  makeSchemas,
  makeWebhooks,
  resolveLayout,
} from '../core/index.js'
import { setFormatOptions } from '../format/index.js'
import { parseOpenAPI } from '../openapi/index.js'

const HELP_TEXT = `Usage: takibi-hono

Reads ./takibi-hono.config.ts and generates Hono handlers from an OpenAPI / TypeSpec spec.

Options:
  -h, --help                  display help for command`

function parseCli(args: readonly string[]) {
  if (args.length === 1 && (args[0] === '--help' || args[0] === '-h')) {
    return { ok: true, value: { help: true } } as const
  }
  if (args.length === 0) {
    return { ok: true, value: { help: false } } as const
  }
  return { ok: false, error: HELP_TEXT } as const
}

export async function takibiHono() {
  const cliResult = parseCli(process.argv.slice(2))
  if (!cliResult.ok) return cliResult
  if (cliResult.value.help) return { ok: true, value: HELP_TEXT } as const
  const configResult = await readConfig()
  if (!configResult.ok) return configResult
  const config = configResult.value
  if (config.format) setFormatOptions(config.format)
  const openAPIResult = await parseOpenAPI(config.input)
  if (!openAPIResult.ok) return openAPIResult
  const openapi = openAPIResult.value
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
  const appResult = await makeApp(
    openapi,
    handlersResult.value.handlerFileNames,
    config.basePath,
    layout,
  )
  if (!appResult.ok) return appResult
  return { ok: true, value: `🔥 takibi-hono: ${config.input} (${config.schema}) ✅` } as const
}
