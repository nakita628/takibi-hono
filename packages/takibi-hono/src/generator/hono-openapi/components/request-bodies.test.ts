import { describe, expect, it } from 'vite-plus/test'

import type { Components } from '../../../openapi/index.js'
import { makeRequestBodiesCode } from './request-bodies.js'

describe('makeRequestBodiesCode', () => {
  it.concurrent('should generate request body with $ref schema', async () => {
    const requestBodies: NonNullable<Components['requestBodies']> = {
      CreateUserBody: {
        description: 'User to create',
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/CreateUser' },
          },
        },
      },
    }
    expect(await makeRequestBodiesCode(requestBodies, 'zod')).toBe(
      'export const CreateUserBodyRequestBody = {description:"User to create",required:true,content:{\'application/json\':{schema:CreateUserSchema}}}',
    )
  })

  it.concurrent('should generate request body with inline schema (typebox)', async () => {
    const requestBodies: NonNullable<Components['requestBodies']> = {
      LoginBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                username: { type: 'string' },
                password: { type: 'string' },
              },
              required: ['username', 'password'],
            },
          },
        },
      },
    }
    expect(await makeRequestBodiesCode(requestBodies, 'typebox')).toBe(
      "export const LoginBodyRequestBody = {required:true,content:{'application/json':{schema:Type.Object({username:Type.String(),password:Type.String()})}}}",
    )
  })

  it.concurrent('should filter out $ref request bodies', async () => {
    const requestBodies: NonNullable<Components['requestBodies']> = {
      SharedBody: { $ref: '#/components/requestBodies/Shared' } as any,
      DirectBody: {
        content: {
          'application/json': {
            schema: { type: 'string' },
          },
        },
      },
    }
    expect(await makeRequestBodiesCode(requestBodies, 'zod')).toBe(
      "export const DirectBodyRequestBody = {content:{'application/json':{schema:z.string()}}}",
    )
  })

  it.concurrent('should append as const with readonly flag', async () => {
    const requestBodies: NonNullable<Components['requestBodies']> = {
      CreateBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Item' },
          },
        },
      },
    }
    expect(await makeRequestBodiesCode(requestBodies, 'zod', true)).toBe(
      "export const CreateBodyRequestBody = {required:true,content:{'application/json':{schema:ItemSchema}}} as const",
    )
  })

  it.concurrent('should generate request body with valibot', async () => {
    const requestBodies: NonNullable<Components['requestBodies']> = {
      SimpleBody: {
        content: {
          'application/json': {
            schema: { type: 'string' },
          },
        },
      },
    }
    expect(await makeRequestBodiesCode(requestBodies, 'valibot')).toBe(
      "export const SimpleBodyRequestBody = {content:{'application/json':{schema:v.string()}}}",
    )
  })

  it.concurrent('should generate multiple request bodies', async () => {
    const requestBodies: NonNullable<Components['requestBodies']> = {
      BodyA: {
        content: { 'application/json': { schema: { type: 'string' } } },
      },
      BodyB: {
        description: 'Second body',
        content: { 'application/json': { schema: { type: 'number' } } },
      },
    }
    expect(await makeRequestBodiesCode(requestBodies, 'zod')).toBe(
      [
        "export const BodyARequestBody = {content:{'application/json':{schema:z.string()}}}",
        'export const BodyBRequestBody = {description:"Second body",content:{\'application/json\':{schema:z.number()}}}',
      ].join('\n\n'),
    )
  })

  it.concurrent('should return empty string for empty request bodies', async () => {
    expect(await makeRequestBodiesCode({}, 'zod')).toBe('')
  })
})
