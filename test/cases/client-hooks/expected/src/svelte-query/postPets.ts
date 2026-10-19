import { createMutation } from '@tanstack/svelte-query'
import type { CreateMutationOptions } from '@tanstack/svelte-query'
import type { ClientRequestOptions, InferRequestType } from 'hono/client'
import { parseResponse } from 'hono/client'
import { client } from '../lib'

export function getPostPetsMutationOptions(options?: ClientRequestOptions) {
  return {
    mutationKey: ['pets', '/pets', 'POST'] as const,
    async mutationFn(args: InferRequestType<typeof client.pets.$post>) {
      return parseResponse(client.pets.$post(args, options))
    },
  }
}

export function createPostPets<TError = unknown, TOnMutateResult = unknown>(
  options?: () => {
    mutation?: CreateMutationOptions<
      Awaited<ReturnType<typeof parseResponse<Awaited<ReturnType<typeof client.pets.$post>>>>>,
      TError,
      InferRequestType<typeof client.pets.$post>,
      TOnMutateResult
    >
    options?: ClientRequestOptions
  },
) {
  return createMutation(() => {
    const { mutation, options: clientOptions } = options?.() ?? {}
    return { ...mutation, ...getPostPetsMutationOptions(clientOptions) }
  })
}
