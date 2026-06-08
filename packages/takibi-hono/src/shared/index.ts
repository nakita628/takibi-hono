import { makeApp } from '../core/app/index.js'
import { makeClients } from '../core/client/index.js'
import { makeComponents } from '../core/components/index.js'
import { makeHandlers } from '../core/handlers/index.js'
import type { Layout, TakibiHonoOptions } from '../core/layout.js'
import { makeSchemas } from '../core/schemas/index.js'
import { makeWebhooks } from '../core/webhooks/index.js'
import { collectOperations } from '../helper/operations.js'
import type { OpenAPI } from '../openapi/index.js'

/**
 * Builds the ordered generation jobs for one run, mirroring hono-takibi's `shared`
 * contract: a single source of truth shared by the CLI and the Vite plugin.
 *
 * Unlike hono-takibi's independent single-output jobs, takibi-hono's generators
 * write to several paths derived from one `Layout`, so each job is `{ name, run }`
 * with the layout captured in the closure (no per-job `output`). The caller runs
 * them sequentially in array order; `app` depends on the handler file names, which
 * are derived once from the spec here and shared with the `app` job.
 */
export function makeJob(
  openapi: OpenAPI,
  config: {
    readonly schema: 'zod' | 'valibot' | 'typebox' | 'arktype' | 'effect'
    readonly basePath?: string | undefined
    readonly openapi?: boolean | undefined
  } & TakibiHonoOptions,
  layout: Layout,
) {
  const ohConfig = config
  const client = ohConfig.client
  const useOpenAPI = config.openapi === true
  const handlerFileNames = Array.from(collectOperations(openapi).keys())
  return [
    // In single-file mode the components job emits schemas too, so skip the separate schemas job.
    layout.componentsSingleFile
      ? undefined
      : {
          name: 'schemas',
          run: () => makeSchemas(openapi, config.schema, useOpenAPI, ohConfig, layout),
        },
    {
      name: 'components',
      run: () => makeComponents(openapi, config.schema, useOpenAPI, ohConfig, layout),
    },
    {
      name: 'handlers',
      run: () => makeHandlers(openapi, config.schema, useOpenAPI, layout),
    },
    useOpenAPI
      ? { name: 'webhooks', run: () => makeWebhooks(openapi, config.schema, layout) }
      : undefined,
    {
      name: 'app',
      run: () => makeApp(openapi, handlerFileNames, config.basePath, layout),
    },
    client
      ? { name: 'clients', run: () => makeClients(openapi, client, process.cwd(), config.basePath) }
      : undefined,
  ].filter((job) => job !== undefined)
}
