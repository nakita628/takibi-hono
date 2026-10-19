import { createMutation } from '@tanstack/svelte-query'
import type { CreateMutationOptions } from '@tanstack/svelte-query'
import type { ClientRequestOptions, InferRequestType } from 'hono/client'
import { parseResponse } from 'hono/client'
import { client } from '../lib'

export function getHeadPetsMutationOptions(options?: ClientRequestOptions) {
  return {
    mutationKey: ['pets', '/pets', 'HEAD'] as const,
    async mutationFn(args: InferRequestType<typeof client.pets.$head>) {
      return parseResponse(client.pets.$head(args, options))
    },
  }
}

export function createHeadPets<TError = unknown, TOnMutateResult = unknown>(
  options?: () => {
    mutation?: CreateMutationOptions<
      Awaited<ReturnType<typeof parseResponse<Awaited<ReturnType<typeof client.pets.$head>>>>>,
      TError,
      InferRequestType<typeof client.pets.$head>,
      TOnMutateResult
    >
    options?: ClientRequestOptions
  },
) {
  return createMutation(() => {
    const { mutation, options: clientOptions } = options?.() ?? {}
    return { ...mutation, ...getHeadPetsMutationOptions(clientOptions) }
  })
}
