import { readConfig } from '../config/index.js'
import { hono } from '../core/hono.js'

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
  const honoResult = await hono(config)
  if (!honoResult.ok) return honoResult
  return { ok: true, value: `🔥 takibi-hono: ${config.input} (${config.schema}) ✅` } as const
}
