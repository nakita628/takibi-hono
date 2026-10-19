import { createMutation, mutationOptions } from '@tanstack/solid-query'
import type { CreateMutationOptions } from '@tanstack/solid-query'
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

export function createPostPetsPetIdPhotos<TError = unknown, TOnMutateResult = unknown>(
  options?: () => {
    mutation?: ReturnType<
      CreateMutationOptions<
        Awaited<
          ReturnType<
            typeof parseResponse<
              Awaited<ReturnType<(typeof client.pets)[':petId']['photos']['$post']>>
            >
          >
        >,
        TError,
        InferRequestType<(typeof client.pets)[':petId']['photos']['$post']>,
        TOnMutateResult
      >
    >
    options?: ClientRequestOptions
  },
) {
  return createMutation(() => {
    const { mutation, options: clientOptions } = options?.() ?? {}
    return {
      ...mutation,
      ...getPostPetsPetIdPhotosMutationOptions<TError, TOnMutateResult>(clientOptions),
    }
  })
}
