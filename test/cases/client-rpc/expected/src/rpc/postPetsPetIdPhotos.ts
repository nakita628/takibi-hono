import type { InferRequestType, ClientRequestOptions } from 'hono/client'
import { parseResponse } from 'hono/client'
import { client } from '../lib'

export async function postPetsPetIdPhotos(
  args: InferRequestType<(typeof client.pets)[':petId']['photos']['$post']>,
  options?: ClientRequestOptions,
) {
  return await parseResponse(client.pets[':petId'].photos.$post(args, options))
}
