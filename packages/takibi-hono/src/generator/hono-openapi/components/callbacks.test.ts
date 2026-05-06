import { describe, expect, it } from 'vite-plus/test'

import type { Components } from '../../../openapi/index.js'
import { makeCallbacksCode } from './callbacks.js'

describe('makeCallbacksCode', () => {
  it.concurrent('should generate callback as const object', () => {
    const callbacks: NonNullable<Components['callbacks']> = {
      onEvent: {
        '{$request.body#/callbackUrl}': {
          post: {
            responses: { '200': { description: 'OK' } },
          },
        },
      },
    }
    expect(makeCallbacksCode(callbacks)).toBe(
      'export const OnEventCallback = {"{$request.body#/callbackUrl}":{"post":{"responses":{"200":{"description":"OK"}}}}}',
    )
  })

  it.concurrent('should filter out $ref callbacks', () => {
    const callbacks: NonNullable<Components['callbacks']> = {
      onEvent: { $ref: '#/components/callbacks/Shared' } as any,
      onDirect: {
        '{$request.body#/url}': {
          post: { responses: { '200': { description: 'OK' } } },
        },
      },
    }
    expect(makeCallbacksCode(callbacks)).toBe(
      'export const OnDirectCallback = {"{$request.body#/url}":{"post":{"responses":{"200":{"description":"OK"}}}}}',
    )
  })

  it.concurrent('should append as const with readonly flag', () => {
    const callbacks: NonNullable<Components['callbacks']> = {
      onEvent: {
        '{$request.body#/callbackUrl}': {
          post: { responses: { '200': { description: 'OK' } } },
        },
      },
    }
    expect(makeCallbacksCode(callbacks, true)).toBe(
      'export const OnEventCallback = {"{$request.body#/callbackUrl}":{"post":{"responses":{"200":{"description":"OK"}}}}} as const',
    )
  })

  it.concurrent('should generate multiple callbacks', () => {
    const callbacks: NonNullable<Components['callbacks']> = {
      onUserCreated: {
        '{$request.body#/userCallback}': {
          post: { responses: { '200': { description: 'User created' } } },
        },
      },
      onOrderPlaced: {
        '{$request.body#/orderCallback}': {
          post: { responses: { '200': { description: 'Order placed' } } },
        },
      },
    }
    expect(makeCallbacksCode(callbacks)).toBe(
      [
        'export const OnUserCreatedCallback = {"{$request.body#/userCallback}":{"post":{"responses":{"200":{"description":"User created"}}}}}',
        'export const OnOrderPlacedCallback = {"{$request.body#/orderCallback}":{"post":{"responses":{"200":{"description":"Order placed"}}}}}',
      ].join('\n\n'),
    )
  })

  it.concurrent('should return empty string for empty callbacks', () => {
    expect(makeCallbacksCode({})).toBe('')
  })

  it.concurrent('should inline schema $ref to component identifier', () => {
    const callbacks: NonNullable<Components['callbacks']> = {
      UserCreated: {
        '{$request.body#/callbackUrl}': {
          post: {
            requestBody: {
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/User' },
                },
              },
            },
            responses: { '200': { description: 'OK' } },
          },
        },
      },
    }
    expect(makeCallbacksCode(callbacks)).toBe(
      'export const UserCreatedCallback = {"{$request.body#/callbackUrl}":{"post":{"requestBody":{"content":{"application/json":{"schema":UserSchema}}},"responses":{"200":{"description":"OK"}}}}}',
    )
  })
})
