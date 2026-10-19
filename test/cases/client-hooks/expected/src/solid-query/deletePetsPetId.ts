import { createMutation, mutationOptions } from '@tanstack/solid-query'
import type { CreateMutationOptions } from '@tanstack/solid-query'
import type { ClientRequestOptions, InferRequestType } from 'hono/client'
import { parseResponse } from 'hono/client'
import { client } from '../lib'

export function getDeletePetsPetIdMutationOptions<TError = unknown, TOnMutateResult = unknown>(
  options?: ClientRequestOptions,
) {
  return mutationOptions<
    | Awaited<
        ReturnType<
          typeof parseResponse<Awaited<ReturnType<(typeof client.pets)[':petId']['$delete']>>>
        >
      >
    | undefined,
    TError,
    InferRequestType<(typeof client.pets)[':petId']['$delete']>,
    TOnMutateResult
  >({
    mutationKey: ['pets', '/pets/:petId', 'DELETE'] as const,
    async mutationFn(args: InferRequestType<(typeof client.pets)[':petId']['$delete']>) {
      return parseResponse(client.pets[':petId'].$delete(args, options))
    },
  })
}

export function createDeletePetsPetId<TError = unknown, TOnMutateResult = unknown>(
  options?: () => {
    mutation?: ReturnType<
      CreateMutationOptions<
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
    >
    options?: ClientRequestOptions
  },
) {
  return createMutation(() => {
    const { mutation, options: clientOptions } = options?.() ?? {}
    return {
      ...mutation,
      ...getDeletePetsPetIdMutationOptions<TError, TOnMutateResult>(clientOptions),
    }
  })
}
