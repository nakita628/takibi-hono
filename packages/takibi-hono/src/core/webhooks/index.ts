import path from 'node:path'

import { emit } from '../../emit/index.js'
import { makeWebhooksCode } from '../../generator/hono-openapi/webhooks/index.js'
import type { OpenAPI } from '../../openapi/index.js'
import type { Layout, SchemaLib } from '../layout.js'

/**
 * Emits the OAS 3.1 webhooks file, if the spec defines any webhooks.
 *
 * Webhooks are not user-configurable — they always emit to a `webhooks.ts`
 * sibling of the handlers dir whenever the spec defines any.
 */
export async function makeWebhooks(openapi: OpenAPI, schemaLib: SchemaLib, layout: Layout) {
  if (!openapi.webhooks) return { ok: true, value: undefined } as const
  const webhooksCode = makeWebhooksCode(openapi, schemaLib, {
    componentPaths: layout.componentPaths,
  })
  if (!webhooksCode) return { ok: true, value: undefined } as const
  const webhooksFile = path.join(layout.handlersDir, 'webhooks.ts')
  return emit(webhooksCode, layout.handlersDir, webhooksFile)
}
