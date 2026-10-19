import { createMutation } from '@tanstack/svelte-query'
import type { CreateMutationOptions } from '@tanstack/svelte-query'
import type { ClientRequestOptions, InferRequestType } from 'hono/client'
import { parseResponse } from 'hono/client'
import { client } from '../lib'

export function getPostPetsPetIdPhotosMutationOptions(options?: ClientRequestOptions) {
  return {
    mutationKey: ['pets', '/pets/:petId/photos', 'POST'] as const,
    async mutationFn(args: InferRequestType<(typeof client.pets)[':petId']['photos']['$post']>) {
      return parseResponse(client.pets[':petId'].photos.$post(args, options))
    },
  }
}

export function createPostPetsPetIdPhotos<TError = unknown, TOnMutateResult = unknown>(
  options?: () => {
    mutation?: CreateMutationOptions<
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
    options?: ClientRequestOptions
  },
) {
  return createMutation(() => {
    const { mutation, options: clientOptions } = options?.() ?? {}
    return { ...mutation, ...getPostPetsPetIdPhotosMutationOptions(clientOptions) }
  })
}
