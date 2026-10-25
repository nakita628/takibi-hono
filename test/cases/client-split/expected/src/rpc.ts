import type { InferRequestType, ClientRequestOptions } from 'hono/client'
import { parseResponse } from 'hono/client'
import { __rootClient, petsClient, _202401Client } from './client'

export async function get(options?: ClientRequestOptions) {
  return await parseResponse(__rootClient.$get(undefined, options))
}

export async function getPets(
  args: InferRequestType<typeof petsClient.pets.$get>,
  options?: ClientRequestOptions,
) {
  return await parseResponse(petsClient.pets.$get(args, options))
}

export async function postPets(
  args: InferRequestType<typeof petsClient.pets.$post>,
  options?: ClientRequestOptions,
) {
  return await parseResponse(petsClient.pets.$post(args, options))
}

export async function headPets(
  args: InferRequestType<typeof petsClient.pets.$head>,
  options?: ClientRequestOptions,
) {
  return await parseResponse(petsClient.pets.$head(args, options))
}

export async function getPetsPetId(
  args: InferRequestType<(typeof petsClient.pets)[':petId']['$get']>,
  options?: ClientRequestOptions,
) {
  return await parseResponse(petsClient.pets[':petId'].$get(args, options))
}

export async function deletePetsPetId(
  args: InferRequestType<(typeof petsClient.pets)[':petId']['$delete']>,
  options?: ClientRequestOptions,
) {
  return await parseResponse(petsClient.pets[':petId'].$delete(args, options))
}

export async function postPetsPetIdPhotos(
  args: InferRequestType<(typeof petsClient.pets)[':petId']['photos']['$post']>,
  options?: ClientRequestOptions,
) {
  return await parseResponse(petsClient.pets[':petId'].photos.$post(args, options))
}

export async function get202401Reports(options?: ClientRequestOptions) {
  return await parseResponse(_202401Client['2024-01'].reports.$get(undefined, options))
}
