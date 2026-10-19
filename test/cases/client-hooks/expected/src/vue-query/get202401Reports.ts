import { useQuery } from '@tanstack/vue-query'
import type { UseQueryOptions, QueryFunctionContext } from '@tanstack/vue-query'
import type { ClientRequestOptions } from 'hono/client'
import { parseResponse } from 'hono/client'
import { client } from '../lib'

export function get202401ReportsQueryKey() {
  return ['2024-01', '/2024-01/reports'] as const
}

export function get202401ReportsQueryOptions(options?: ClientRequestOptions) {
  return {
    queryKey: get202401ReportsQueryKey(),
    queryFn({ signal }: QueryFunctionContext) {
      return parseResponse(
        client['2024-01'].reports.$get(undefined, {
          ...options,
          init: { ...options?.init, signal },
        }),
      )
    },
  }
}

export function use202401Reports<
  TData = Awaited<
    ReturnType<
      typeof parseResponse<Awaited<ReturnType<(typeof client)['2024-01']['reports']['$get']>>>
    >
  >,
  TError = unknown,
>(options?: {
  query?: Omit<
    Extract<
      UseQueryOptions<
        Awaited<
          ReturnType<
            typeof parseResponse<Awaited<ReturnType<(typeof client)['2024-01']['reports']['$get']>>>
          >
        >,
        TError,
        TData,
        Awaited<
          ReturnType<
            typeof parseResponse<Awaited<ReturnType<(typeof client)['2024-01']['reports']['$get']>>>
          >
        >,
        ReturnType<typeof get202401ReportsQueryKey>
      >,
      { queryKey: unknown }
    >,
    'queryKey' | 'queryFn'
  >
  options?: ClientRequestOptions
}) {
  const { query: queryOptions, options: clientOptions } = options ?? {}
  return useQuery({
    ...queryOptions,
    queryKey: get202401ReportsQueryKey(),
    queryFn({ signal }) {
      return parseResponse(
        client['2024-01'].reports.$get(undefined, {
          ...clientOptions,
          init: { ...clientOptions?.init, signal },
        }),
      )
    },
  })
}
