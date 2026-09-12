import { describe, expect, it } from 'vite-plus/test'

import {
  collectRoutes,
  collectWebhookRoutes,
  makeHandlerFileName,
  resolveRef,
} from './operations.js'

const ok = { responses: { '200': { description: 'ok' } } }

const openapi = {
  openapi: '3.1.0',
  info: { title: 't', version: '1' },
  paths: {
    '/': { get: ok },
    '/users': { get: ok, post: ok },
    '/users/{id}': {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      get: ok,
      head: ok,
      summary: 'not an operation',
    },
    '/shared': { $ref: '#/components/pathItems/Shared' },
    '/empty': { summary: 'no operations' },
  },
  webhooks: { newUser: { post: ok } },
  components: { pathItems: { Shared: { delete: ok } } },
} as never

describe('collectRoutes', () => {
  it('groups operations by first path segment, with Hono paths and Path Item parameters', () => {
    expect([...collectRoutes(openapi)]).toStrictEqual([
      ['__root', [{ method: 'get', path: '/', operation: ok, parameters: [] }]],
      [
        'users',
        [
          { method: 'get', path: '/users', operation: ok, parameters: [] },
          { method: 'post', path: '/users', operation: ok, parameters: [] },
          {
            method: 'get',
            path: '/users/:id',
            operation: ok,
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          },
          {
            method: 'head',
            path: '/users/:id',
            operation: ok,
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          },
        ],
      ],
      ['shared', [{ method: 'delete', path: '/shared', operation: ok, parameters: [] }]],
    ])
  })
})

describe('collectWebhookRoutes', () => {
  it('serves each webhook as /<name>', () => {
    expect(collectWebhookRoutes(openapi)).toStrictEqual([
      { method: 'post', path: '/newUser', operation: ok, parameters: [] },
    ])
  })
})

describe('makeHandlerFileName', () => {
  it.each([
    ['/', '__root'],
    ['/Users/{id}', 'users'],
    ['/v1/items', 'v1'],
  ])('%s → %s', (path, expected) => {
    expect(makeHandlerFileName(path)).toBe(expected)
  })
})

describe('resolveRef', () => {
  const map = { A: { name: 'a' } }

  it.each([
    [{ $ref: '#/components/parameters/A' }, { name: 'a' }],
    [{ $ref: '#/components/parameters/Missing' }, undefined],
    [{ name: 'inline' }, { name: 'inline' }],
    [undefined, undefined],
  ])('%j', (value, expected) => {
    expect(resolveRef(value as never, map)).toStrictEqual(expected)
  })
})
