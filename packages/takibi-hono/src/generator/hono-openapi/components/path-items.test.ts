import { describe, expect, it } from 'vite-plus/test'

import type { Components } from '../../../openapi/index.js'
import { makePathItemsCode } from './path-items.js'

describe('makePathItemsCode', () => {
  it.concurrent('should generate path item as const object', () => {
    const pathItems: NonNullable<Components['pathItems']> = {
      HealthCheck: {
        get: {
          responses: { '200': { description: 'Healthy' } },
        },
      },
    }
    expect(makePathItemsCode(pathItems)).toBe(
      'export const HealthCheckPathItem = {"get":{"responses":{"200":{"description":"Healthy"}}}}',
    )
  })

  it.concurrent('should append as const with readonly flag', () => {
    const pathItems: NonNullable<Components['pathItems']> = {
      HealthCheck: {
        get: { responses: { '200': { description: 'OK' } } },
      },
    }
    expect(makePathItemsCode(pathItems, true)).toBe(
      'export const HealthCheckPathItem = {"get":{"responses":{"200":{"description":"OK"}}}} as const',
    )
  })

  it.concurrent('should generate multiple path items', () => {
    const pathItems: NonNullable<Components['pathItems']> = {
      HealthCheck: {
        get: { responses: { '200': { description: 'OK' } } },
      },
      ReadinessCheck: {
        get: { responses: { '200': { description: 'Ready' } } },
      },
    }
    expect(makePathItemsCode(pathItems)).toBe(
      [
        'export const HealthCheckPathItem = {"get":{"responses":{"200":{"description":"OK"}}}}',
        'export const ReadinessCheckPathItem = {"get":{"responses":{"200":{"description":"Ready"}}}}',
      ].join('\n\n'),
    )
  })

  it.concurrent('should generate path item with multiple methods', () => {
    const pathItems: NonNullable<Components['pathItems']> = {
      UserResource: {
        get: { responses: { '200': { description: 'Get user' } } },
        put: { responses: { '200': { description: 'Update user' } } },
        delete: { responses: { '204': { description: 'Deleted' } } },
      },
    }
    expect(makePathItemsCode(pathItems)).toBe(
      'export const UserResourcePathItem = {"get":{"responses":{"200":{"description":"Get user"}}},"put":{"responses":{"200":{"description":"Update user"}}},"delete":{"responses":{"204":{"description":"Deleted"}}}}',
    )
  })

  it.concurrent('should return empty string for empty pathItems', () => {
    expect(makePathItemsCode({})).toBe('')
  })
})
