import { describe, expect, it } from 'vite-plus/test'

import type { OpenAPI } from '../../../openapi/index.js'
import { makeWebhooksCode } from './index.js'

const webhookOpenAPI = {
  openapi: '3.0.0',
  info: { title: 'Test', version: '1.0.0' },
  paths: {},
  webhooks: {
    userCreated: {
      post: {
        summary: 'User created event',
        tags: ['webhooks'],
        operationId: 'onUserCreated',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UserEvent' },
            },
          },
        },
        responses: {
          '200': { description: 'Webhook processed' },
        },
      },
    },
    orderCompleted: {
      post: {
        summary: 'Order completed event',
        operationId: 'onOrderCompleted',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/OrderEvent' },
            },
          },
        },
        responses: {
          '200': { description: 'Webhook processed' },
        },
      },
    },
  },
} as unknown as OpenAPI

const webhookWithGet = {
  openapi: '3.0.0',
  info: { title: 'Test', version: '1.0.0' },
  paths: {},
  webhooks: {
    healthCheck: {
      get: {
        summary: 'Health check webhook',
        operationId: 'onHealthCheck',
        responses: {
          '200': { description: 'OK' },
        },
      },
    },
  },
} as unknown as OpenAPI

const webhookMultipleMethods = {
  openapi: '3.0.0',
  info: { title: 'Test', version: '1.0.0' },
  paths: {},
  webhooks: {
    resource: {
      get: {
        summary: 'Get resource',
        operationId: 'getResource',
        responses: {
          '200': { description: 'OK' },
        },
      },
      post: {
        summary: 'Create resource',
        operationId: 'createResource',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Resource' },
            },
          },
        },
        responses: {
          '201': { description: 'Created' },
        },
      },
    },
  },
} as unknown as OpenAPI

const noWebhookOpenAPI = {
  openapi: '3.0.0',
  info: { title: 'Test', version: '1.0.0' },
  paths: {},
} as unknown as OpenAPI

describe('makeWebhooksCode', () => {
  it.concurrent('should generate webhook handler code (zod)', () => {
    const result = makeWebhooksCode(webhookOpenAPI, 'zod')
    expect(result).toBe(
      [
        "import{Hono}from'hono'",
        "import{describeRoute,validator}from'hono-openapi'",
        "import{OrderEventSchema,UserEventSchema}from'../components'",
        '',
        'export const webhooksHandler=new Hono().post(\'/userCreated\',describeRoute({summary:"User created event",tags:["webhooks"],operationId:"onUserCreated",responses:{200:{description:"Webhook processed"}}}),validator(\'json\',UserEventSchema),(c)=>{}).post(\'/orderCompleted\',describeRoute({summary:"Order completed event",operationId:"onOrderCompleted",responses:{200:{description:"Webhook processed"}}}),validator(\'json\',OrderEventSchema),(c)=>{})',
      ].join('\n'),
    )
  })

  it.concurrent('should return undefined when no webhooks', () => {
    const result = makeWebhooksCode(noWebhookOpenAPI, 'zod')
    expect(result).toBe(undefined)
  })

  it.concurrent('should generate webhook handler code for GET method', () => {
    const result = makeWebhooksCode(webhookWithGet, 'zod')
    expect(result).toBe(
      [
        "import{Hono}from'hono'",
        "import{describeRoute}from'hono-openapi'",
        '',
        'export const webhooksHandler=new Hono().get(\'/healthCheck\',describeRoute({summary:"Health check webhook",operationId:"onHealthCheck",responses:{200:{description:"OK"}}}),(c)=>{})',
      ].join('\n'),
    )
  })

  it.concurrent('should generate webhook handler code for multiple methods on same path', () => {
    const result = makeWebhooksCode(webhookMultipleMethods, 'zod')
    expect(result).toBe(
      [
        "import{Hono}from'hono'",
        "import{describeRoute,validator}from'hono-openapi'",
        "import{ResourceSchema}from'../components'",
        '',
        'export const webhooksHandler=new Hono().get(\'/resource\',describeRoute({summary:"Get resource",operationId:"getResource",responses:{200:{description:"OK"}}}),(c)=>{}).post(\'/resource\',describeRoute({summary:"Create resource",operationId:"createResource",responses:{201:{description:"Created"}}}),validator(\'json\',ResourceSchema),(c)=>{})',
      ].join('\n'),
    )
  })

  it.concurrent('should generate webhook handler code with custom componentPaths', () => {
    const result = makeWebhooksCode(webhookOpenAPI, 'zod', {
      componentPaths: { schemas: '../custom/schemas' },
    })
    expect(result).toBe(
      [
        "import{Hono}from'hono'",
        "import{describeRoute,validator}from'hono-openapi'",
        "import{OrderEventSchema,UserEventSchema}from'../custom/schemas'",
        '',
        'export const webhooksHandler=new Hono().post(\'/userCreated\',describeRoute({summary:"User created event",tags:["webhooks"],operationId:"onUserCreated",responses:{200:{description:"Webhook processed"}}}),validator(\'json\',UserEventSchema),(c)=>{}).post(\'/orderCompleted\',describeRoute({summary:"Order completed event",operationId:"onOrderCompleted",responses:{200:{description:"Webhook processed"}}}),validator(\'json\',OrderEventSchema),(c)=>{})',
      ].join('\n'),
    )
  })
})
