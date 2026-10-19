import { createQuery, queryOptions } from '@tanstack/solid-query'
import type { UndefinedInitialDataOptions, QueryFunctionContext } from '@tanstack/solid-query'
import type { ClientRequestOptions } from 'hono/client'
import { parseResponse } from 'hono/client'
import { client } from '../lib'

export function get202401ReportsQueryKey() {
  return ['2024-01', '/2024-01/reports'] as const
}

export function get202401ReportsQueryOptions(options?: ClientRequestOptions) {
  return queryOptions({
    queryKey: get202401ReportsQueryKey(),
    queryFn({ signal }) {
      return parseResponse(
        client['2024-01'].reports.$get(undefined, {
          ...options,
          init: { ...options?.init, signal },
        }),
      )
    },
  })
}

export function create202401Reports<
  TData = Awaited<
    ReturnType<
      typeof parseResponse<Awaited<ReturnType<(typeof client)['2024-01']['reports']['$get']>>>
    >
  >,
  TError = unknown,
>(
  options?: () => {
    query?: Omit<
      ReturnType<
        UndefinedInitialDataOptions<
          Awaited<
            ReturnType<
              typeof parseResponse<
                Awaited<ReturnType<(typeof client)['2024-01']['reports']['$get']>>
              >
            >
          >,
          TError,
          TData
        >
      >,
      'queryKey' | 'queryFn'
    >
    options?: ClientRequestOptions
  },
) {
  return createQuery(() => {
    const { query, options: clientOptions } = options?.() ?? {}
    return {
      ...query,
      queryKey: get202401ReportsQueryKey(),
      queryFn({ signal }: QueryFunctionContext) {
        return parseResponse(
          client['2024-01'].reports.$get(undefined, {
            ...clientOptions,
            init: { ...clientOptions?.init, signal },
          }),
        )
      },
    }
  })
}
