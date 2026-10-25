import type { InferRequestType, ClientRequestOptions } from 'hono/client'
import { client } from './client'

export async function get(options?: ClientRequestOptions) {
  return await client.$get(undefined, options)
}

export async function getPets(
  args: InferRequestType<typeof client.pets.$get>,
  options?: ClientRequestOptions,
) {
  return await client.pets.$get(args, options)
}

export async function postPets(
  args: InferRequestType<typeof client.pets.$post>,
  options?: ClientRequestOptions,
) {
  return await client.pets.$post(args, options)
}

export async function headPets(
  args: InferRequestType<typeof client.pets.$head>,
  options?: ClientRequestOptions,
) {
  return await client.pets.$head(args, options)
}

export async function getPetsPetId(
  args: InferRequestType<(typeof client.pets)[':petId']['$get']>,
  options?: ClientRequestOptions,
) {
  return await client.pets[':petId'].$get(args, options)
}

export async function deletePetsPetId(
  args: InferRequestType<(typeof client.pets)[':petId']['$delete']>,
  options?: ClientRequestOptions,
) {
  return await client.pets[':petId'].$delete(args, options)
}

export async function postPetsPetIdPhotos(
  args: InferRequestType<(typeof client.pets)[':petId']['photos']['$post']>,
  options?: ClientRequestOptions,
) {
  return await client.pets[':petId'].photos.$post(args, options)
}

export async function get202401Reports(options?: ClientRequestOptions) {
  return await client['2024-01'].reports.$get(undefined, options)
}
