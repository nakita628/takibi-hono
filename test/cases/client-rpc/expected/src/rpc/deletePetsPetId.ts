import type { InferRequestType, ClientRequestOptions } from 'hono/client'
import { parseResponse } from 'hono/client'
import { client } from '../lib'

export async function deletePetsPetId(
  args: InferRequestType<(typeof client.pets)[':petId']['$delete']>,
  options?: ClientRequestOptions,
) {
  return await parseResponse(client.pets[':petId'].$delete(args, options))
}
