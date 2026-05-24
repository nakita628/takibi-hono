import path from 'node:path'

import { emit } from '../../emit/index.js'
import { makeWebhooksCode } from '../../generator/hono-openapi/webhooks/index.js'
import type { OpenAPI } from '../../openapi/index.js'
import type { Layout, SchemaLib } from '../layout.js'

/** OAS 3.1 webhooks. Always emit to `<handlersDir>/webhooks.ts` (not user-configurable). */
export async function makeWebhooks(openapi: OpenAPI, schemaLib: SchemaLib, layout: Layout) {
  if (!openapi.webhooks) return { ok: true, value: undefined } as const
  const webhooksCode = makeWebhooksCode(openapi, schemaLib, {
    componentPaths: layout.componentPaths,
  })
  if (!webhooksCode) return { ok: true, value: undefined } as const
  const webhooksFile = path.join(layout.handlersDir, 'webhooks.ts')
  return emit(webhooksCode, layout.handlersDir, webhooksFile)
}
