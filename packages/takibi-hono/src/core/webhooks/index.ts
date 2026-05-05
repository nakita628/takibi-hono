import path from 'node:path'

import { emit } from '../../emit/index.js'
import { makeWebhooksCode } from '../../generator/hono-openapi/webhooks/index.js'
import type { OpenAPI } from '../../openapi/index.js'
import type { Layout, SchemaLib, TakibiHonoOptions } from '../layout.js'

/**
 * Emits the OAS 3.1 webhooks file, if the spec defines any webhooks.
 *
 * The output path defaults to `<componentsBaseOutput>/webhooks/index.ts` when
 * a base output dir is set, or to a `webhooks.ts` sibling of the handlers dir
 * otherwise. A user-supplied `components.webhooks.output` overrides both.
 */
export async function makeWebhooks(
  openapi: OpenAPI,
  schemaLib: SchemaLib,
  ohConfig: TakibiHonoOptions | undefined,
  layout: Layout,
) {
  if (!openapi.webhooks) return { ok: true, value: undefined } as const
  const webhooksCode = makeWebhooksCode(openapi, schemaLib, {
    componentPaths: layout.componentPaths,
  })
  if (!webhooksCode) return { ok: true, value: undefined } as const
  const webhooksConfig = ohConfig?.components?.webhooks
  const webhooksOutput =
    webhooksConfig?.output ??
    (layout.componentsBaseOutput
      ? `${layout.componentsBaseOutput}/webhooks/index.ts`
      : path.join(layout.handlersDir, 'webhooks.ts'))
  const webhooksDir = webhooksOutput.endsWith('.ts') ? path.dirname(webhooksOutput) : webhooksOutput
  const webhooksFile = webhooksOutput.endsWith('.ts')
    ? webhooksOutput
    : path.join(webhooksOutput, 'index.ts')
  return emit(webhooksCode, webhooksDir, webhooksFile)
}
