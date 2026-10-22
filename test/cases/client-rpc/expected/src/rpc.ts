import type { InferRequestType, ClientRequestOptions } from 'hono/client'
import { parseResponse } from 'hono/client'
import { client } from './lib'

/**
 * Health
 *
 * GET /
 */
export async function get(options?: ClientRequestOptions) {
  return await parseResponse(client.index.$get(undefined, options))
}

/**
 * List pets
 *
 * Lists the pets, newest first.
 *
 * GET /pets
 */
export async function getPets(
  args: InferRequestType<typeof client.pets.$get>,
  options?: ClientRequestOptions,
) {
  return await parseResponse(client.pets.$get(args, options))
}

/**
 * Create a pet
 *
 * POST /pets
 */
export async function postPets(
  args: InferRequestType<typeof client.pets.$post>,
  options?: ClientRequestOptions,
) {
  return await parseResponse(client.pets.$post(args, options))
}

export async function headPets(
  args: InferRequestType<typeof client.pets.$head>,
  options?: ClientRequestOptions,
) {
  return await parseResponse(client.pets.$head(args, options))
}

export async function getPetsPetId(
  args: InferRequestType<(typeof client.pets)[':petId']['$get']>,
  options?: ClientRequestOptions,
) {
  return await parseResponse(client.pets[':petId'].$get(args, options))
}

export async function deletePetsPetId(
  args: InferRequestType<(typeof client.pets)[':petId']['$delete']>,
  options?: ClientRequestOptions,
) {
  return await parseResponse(client.pets[':petId'].$delete(args, options))
}

export async function postPetsPetIdPhotos(
  args: InferRequestType<(typeof client.pets)[':petId']['photos']['$post']>,
  options?: ClientRequestOptions,
) {
  return await parseResponse(client.pets[':petId'].photos.$post(args, options))
}

export async function get202401Reports(options?: ClientRequestOptions) {
  return await parseResponse(client['2024-01'].reports.$get(undefined, options))
}
