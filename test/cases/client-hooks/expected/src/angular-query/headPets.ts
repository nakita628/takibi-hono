import { injectMutation } from '@tanstack/angular-query-experimental'
import type { CreateMutationOptions } from '@tanstack/angular-query-experimental'
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

export function injectHeadPets<TError = unknown, TOnMutateResult = unknown>(
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
  return injectMutation(() => {
    const { mutation, options: clientOptions } = options?.() ?? {}
    return { ...mutation, ...getHeadPetsMutationOptions(clientOptions) }
  })
}
