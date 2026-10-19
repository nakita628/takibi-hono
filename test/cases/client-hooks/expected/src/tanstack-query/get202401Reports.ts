import { useQuery, useSuspenseQuery, queryOptions } from '@tanstack/react-query'
import type {
  UseQueryOptions,
  QueryFunctionContext,
  UseSuspenseQueryOptions,
} from '@tanstack/react-query'
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

export function use202401Reports<
  TData = Awaited<
    ReturnType<
      typeof parseResponse<Awaited<ReturnType<(typeof client)['2024-01']['reports']['$get']>>>
    >
  >,
  TError = unknown,
>(options?: {
  query?: Omit<
    UseQueryOptions<
      Awaited<
        ReturnType<
          typeof parseResponse<Awaited<ReturnType<(typeof client)['2024-01']['reports']['$get']>>>
        >
      >,
      TError,
      TData
    >,
    'queryKey' | 'queryFn'
  >
  options?: ClientRequestOptions
}) {
  const { query: queryOptions, options: clientOptions } = options ?? {}
  return useQuery({
    ...queryOptions,
    queryKey: get202401ReportsQueryKey(),
    queryFn({ signal }: QueryFunctionContext) {
      return parseResponse(
        client['2024-01'].reports.$get(undefined, {
          ...clientOptions,
          init: { ...clientOptions?.init, signal },
        }),
      )
    },
  })
}

export function useSuspense202401Reports<
  TData = Awaited<
    ReturnType<
      typeof parseResponse<Awaited<ReturnType<(typeof client)['2024-01']['reports']['$get']>>>
    >
  >,
  TError = unknown,
>(options?: {
  query?: Omit<
    UseSuspenseQueryOptions<
      Awaited<
        ReturnType<
          typeof parseResponse<Awaited<ReturnType<(typeof client)['2024-01']['reports']['$get']>>>
        >
      >,
      TError,
      TData
    >,
    'queryKey' | 'queryFn'
  >
  options?: ClientRequestOptions
}) {
  const { query: queryOptions, options: clientOptions } = options ?? {}
  return useSuspenseQuery({
    ...queryOptions,
    queryKey: get202401ReportsQueryKey(),
    queryFn({ signal }: QueryFunctionContext) {
      return parseResponse(
        client['2024-01'].reports.$get(undefined, {
          ...clientOptions,
          init: { ...clientOptions?.init, signal },
        }),
      )
    },
  })
}
