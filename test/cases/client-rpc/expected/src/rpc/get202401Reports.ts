import type { ClientRequestOptions } from 'hono/client'
import { parseResponse } from 'hono/client'
import { client } from '../lib'

export async function get202401Reports(options?: ClientRequestOptions) {
  return await parseResponse(client['2024-01'].reports.$get(undefined, options))
}
