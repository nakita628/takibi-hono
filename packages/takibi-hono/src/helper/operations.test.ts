import { describe, expect, it } from 'vite-plus/test'

import type { OpenAPI } from '../openapi/index.js'
import { collectOperations, collectWebhookOperations } from './operations.js'

describe('collectOperations', () => {
  it.concurrent('groups operations by first path segment', () => {
    const openapi = {
      openapi: '3.0.0',
      info: { title: 'T', version: '1.0' },
      paths: {
        '/': { get: { responses: { '200': { description: 'OK' } } } },
        '/users': { get: { responses: { '200': { description: 'OK' } } } },
        '/users/{id}': { get: { responses: { '200': { description: 'OK' } } } },
        '/pets': { get: { responses: { '200': { description: 'OK' } } } },
      },
    } as unknown as OpenAPI
    const result = collectOperations(openapi)
    expect(result.has('__root')).toBe(true)
    expect(result.has('users')).toBe(true)
    expect(result.has('pets')).toBe(true)
    expect(result.get('__root')?.length).toBe(1)
    expect(result.get('users')?.length).toBe(2)
    expect(result.get('pets')?.length).toBe(1)
  })

  it.concurrent('skips paths with no http-method operations', () => {
    const openapi = {
      openapi: '3.0.0',
      info: { title: 'T', version: '1.0' },
      paths: {
        '/parameterless': { parameters: [] },
      },
    } as unknown as OpenAPI
    const result = collectOperations(openapi)
    expect(result.size).toBe(0)
  })

  it.concurrent('forwards path-item-level parameters to each operation', () => {
    const openapi = {
      openapi: '3.0.0',
      info: { title: 'T', version: '1.0' },
      paths: {
        '/items/{id}': {
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          get: { responses: { '200': { description: 'OK' } } },
          delete: { responses: { '204': { description: 'OK' } } },
        },
      },
    } as unknown as OpenAPI
    const result = collectOperations(openapi)
    const ops = result.get('items') ?? []
    expect(ops.length).toBe(2)
    expect(ops[0].pathItemParameters?.length).toBe(1)
    expect(ops[1].pathItemParameters?.length).toBe(1)
  })

  it.concurrent('returns empty map when paths is empty', () => {
    const openapi = {
      openapi: '3.0.0',
      info: { title: 'T', version: '1.0' },
      paths: {},
    } as unknown as OpenAPI
    expect(collectOperations(openapi).size).toBe(0)
  })
})

describe('collectWebhookOperations', () => {
  it.concurrent('returns empty array when webhooks is undefined', () => {
    const openapi = {
      openapi: '3.1.0',
      info: { title: 'T', version: '1.0' },
      paths: {},
    } as unknown as OpenAPI
    expect(collectWebhookOperations(openapi)).toStrictEqual([])
  })

  it.concurrent('returns empty array when webhooks is empty object', () => {
    const openapi = {
      openapi: '3.1.0',
      info: { title: 'T', version: '1.0' },
      paths: {},
      webhooks: {},
    } as unknown as OpenAPI
    expect(collectWebhookOperations(openapi)).toStrictEqual([])
  })

  it.concurrent('extracts each method × webhook name combination', () => {
    const openapi = {
      openapi: '3.1.0',
      info: { title: 'T', version: '1.0' },
      paths: {},
      webhooks: {
        newUser: { post: { responses: { '200': { description: 'OK' } } } },
        userDeleted: {
          post: { responses: { '200': { description: 'OK' } } },
          put: { responses: { '200': { description: 'OK' } } },
        },
      },
    } as unknown as OpenAPI
    const result = collectWebhookOperations(openapi)
    expect(result.length).toBe(3)
    expect(result.map((r) => `${r.webhookName}.${r.method}`).sort()).toStrictEqual([
      'newUser.post',
      'userDeleted.post',
      'userDeleted.put',
    ])
  })

  it.concurrent('forwards path-item-level parameters when present', () => {
    const openapi = {
      openapi: '3.1.0',
      info: { title: 'T', version: '1.0' },
      paths: {},
      webhooks: {
        userEvent: {
          parameters: [
            { name: 'X-Token', in: 'header', required: true, schema: { type: 'string' } },
          ],
          post: { responses: { '200': { description: 'OK' } } },
        },
      },
    } as unknown as OpenAPI
    const result = collectWebhookOperations(openapi)
    expect(result.length).toBe(1)
    expect(result[0].pathItemParameters?.length).toBe(1)
    expect(result[0].pathItemParameters?.[0].name).toBe('X-Token')
  })

  it.concurrent('skips webhook entries with no http methods', () => {
    const openapi = {
      openapi: '3.1.0',
      info: { title: 'T', version: '1.0' },
      paths: {},
      webhooks: {
        empty: { parameters: [] },
        active: { post: { responses: { '200': { description: 'OK' } } } },
      },
    } as unknown as OpenAPI
    const result = collectWebhookOperations(openapi)
    expect(result.length).toBe(1)
    expect(result[0].webhookName).toBe('active')
  })
})

describe('collectOperations: pathItem $ref resolution', () => {
  it('resolves path-level $ref to components.pathItems[X] and collects its operations', () => {
    const openapi = {
      paths: {
        '/admin/pets/{id}': { $ref: '#/components/pathItems/AdminPet' },
      },
      components: {
        pathItems: {
          AdminPet: {
            get: { operationId: 'adminGetPet', responses: { '200': { description: 'OK' } } },
            delete: { operationId: 'adminDeletePet', responses: { '204': { description: 'OK' } } },
          },
        },
      },
    } as unknown as OpenAPI
    const groups = collectOperations(openapi)
    const ops = groups.get('admin')
    expect(ops).toBeDefined()
    expect(ops!.length).toBe(2)
    expect(ops!.map((o) => o.method).sort()).toStrictEqual(['delete', 'get'])
    for (const op of ops!) expect(op.path).toBe('/admin/pets/{id}')
  })

  it('drops the path silently when $ref target is missing (no crash)', () => {
    const openapi = {
      paths: { '/missing': { $ref: '#/components/pathItems/Nope' } },
      components: { pathItems: {} },
    } as unknown as OpenAPI
    const groups = collectOperations(openapi)
    expect(groups.size).toBe(0)
  })

  it('merges $ref-resolved pathItem.parameters before processing operations', () => {
    const openapi = {
      paths: {
        '/admin/pets/{id}': { $ref: '#/components/pathItems/AdminPet' },
      },
      components: {
        parameters: {
          IdPath: {
            name: 'id',
            in: 'path' as const,
            required: true,
            schema: { type: 'integer' as const },
          },
        },
        pathItems: {
          AdminPet: {
            parameters: [{ $ref: '#/components/parameters/IdPath' }],
            get: { responses: { '200': { description: 'OK' } } },
          },
        },
      },
    } as unknown as OpenAPI
    const groups = collectOperations(openapi)
    const ops = groups.get('admin')
    expect(ops).toBeDefined()
    expect(ops![0].pathItemParameters?.length).toBe(1)
    expect(ops![0].pathItemParameters?.[0].name).toBe('id')
  })
})
