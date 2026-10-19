import type { InferRequestType, ClientRequestOptions } from 'hono/client'
import { parseResponse } from 'hono/client'
import { client } from '../lib'

export async function headPets(
  args: InferRequestType<typeof client.pets.$head>,
  options?: ClientRequestOptions,
) {
  return await parseResponse(client.pets.$head(args, options))
}
