import { injectMutation } from '@tanstack/angular-query-experimental'
import type { CreateMutationOptions } from '@tanstack/angular-query-experimental'
import type { ClientRequestOptions, InferRequestType } from 'hono/client'
import { parseResponse } from 'hono/client'
import { client } from '../lib'

export function getDeletePetsPetIdMutationOptions(options?: ClientRequestOptions) {
  return {
    mutationKey: ['pets', '/pets/:petId', 'DELETE'] as const,
    async mutationFn(args: InferRequestType<(typeof client.pets)[':petId']['$delete']>) {
      return parseResponse(client.pets[':petId'].$delete(args, options))
    },
  }
}

export function injectDeletePetsPetId<TError = unknown, TOnMutateResult = unknown>(
  options?: () => {
    mutation?: CreateMutationOptions<
      | Awaited<
          ReturnType<
            typeof parseResponse<Awaited<ReturnType<(typeof client.pets)[':petId']['$delete']>>>
          >
        >
      | undefined,
      TError,
      InferRequestType<(typeof client.pets)[':petId']['$delete']>,
      TOnMutateResult
    >
    options?: ClientRequestOptions
  },
) {
  return injectMutation(() => {
    const { mutation, options: clientOptions } = options?.() ?? {}
    return { ...mutation, ...getDeletePetsPetIdMutationOptions(clientOptions) }
  })
}
