import { setFormatOptions } from '../format/index.js'
import { parseOpenAPI } from '../openapi/index.js'
import { makeJob } from '../shared/index.js'
import type { TakibiHonoOptions } from './layout.js'
import { resolveLayout } from './layout.js'

/**
 * Single-call orchestrator: parses the input spec and runs every generation job
 * in order. Used by the CLI and the Vite plugin. The job list is built by
 * `makeJob` (the single source of truth); this function parses, resolves the
 * layout, and runs the jobs sequentially.
 */
export async function hono(
  config: {
    readonly input: string
    readonly schema: 'zod' | 'valibot' | 'typebox' | 'arktype' | 'effect'
    readonly basePath?: string | undefined
    readonly format?: Record<string, unknown> | undefined
    readonly openapi?: boolean | undefined
  } & TakibiHonoOptions,
) {
  if (config.format) setFormatOptions(config.format)
  const parseResult = await parseOpenAPI(config.input)
  if (!parseResult.ok) return parseResult
  const openapi = parseResult.value
  const layout = resolveLayout(config)
  const jobs = makeJob(openapi, config, layout)
  const lastIndex = jobs.length - 1
  for (const [index, job] of jobs.entries()) {
    const result = await job.run()
    if (!result.ok) return result
    if (index === lastIndex) return result
  }
  return { ok: true, value: undefined } as const
}
