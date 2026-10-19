import { useMutation, mutationOptions } from '@tanstack/react-query'
import type { UseMutationOptions } from '@tanstack/react-query'
import type { ClientRequestOptions, InferRequestType } from 'hono/client'
import { parseResponse } from 'hono/client'
import { client } from '../lib'

export function getPostPetsPetIdPhotosMutationOptions<TError = unknown, TOnMutateResult = unknown>(
  options?: ClientRequestOptions,
) {
  return mutationOptions<
    Awaited<
      ReturnType<
        typeof parseResponse<Awaited<ReturnType<(typeof client.pets)[':petId']['photos']['$post']>>>
      >
    >,
    TError,
    InferRequestType<(typeof client.pets)[':petId']['photos']['$post']>,
    TOnMutateResult
  >({
    mutationKey: ['pets', '/pets/:petId/photos', 'POST'] as const,
    async mutationFn(args: InferRequestType<(typeof client.pets)[':petId']['photos']['$post']>) {
      return parseResponse(client.pets[':petId'].photos.$post(args, options))
    },
  })
}

export function usePostPetsPetIdPhotos<TError = unknown, TOnMutateResult = unknown>(options?: {
  mutation?: UseMutationOptions<
    Awaited<
      ReturnType<
        typeof parseResponse<Awaited<ReturnType<(typeof client.pets)[':petId']['photos']['$post']>>>
      >
    >,
    TError,
    InferRequestType<(typeof client.pets)[':petId']['photos']['$post']>,
    TOnMutateResult
  >
  options?: ClientRequestOptions
}) {
  const { mutation: mutationOptions, options: clientOptions } = options ?? {}
  return useMutation({
    ...mutationOptions,
    ...getPostPetsPetIdPhotosMutationOptions<TError, TOnMutateResult>(clientOptions),
  })
}
