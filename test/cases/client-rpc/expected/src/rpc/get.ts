import type { ClientRequestOptions } from 'hono/client'
import { parseResponse } from 'hono/client'
import { client } from '../lib'

/**
 * Health
 *
 * GET /
 */
export async function get(options?: ClientRequestOptions) {
  return await parseResponse(client.index.$get(undefined, options))
}
