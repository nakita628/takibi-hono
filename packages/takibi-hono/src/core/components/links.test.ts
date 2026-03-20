import { describe, expect, it } from 'vite-plus/test'

import type { Components } from '../../openapi/index.js'
import { makeLinksCode } from './links.js'

describe('makeLinksCode', () => {
  it.concurrent('should generate link with operationId and parameters', () => {
    const links: NonNullable<Components['links']> = {
      GetUserById: {
        operationId: 'getUserById',
        parameters: { userId: '$response.body#/id' },
        description: 'Get user by the ID returned in the response',
      },
    }
    expect(makeLinksCode(links)).toBe(
      'export const GetUserByIdLink = {operationId:"getUserById",parameters:{"userId":"$response.body#/id"},description:"Get user by the ID returned in the response"}',
    )
  })

  it.concurrent('should generate link with operationRef', () => {
    const links: NonNullable<Components['links']> = {
      GetNextPage: {
        operationRef: '#/paths/~1users/get',
        description: 'Next page of users',
      },
    }
    expect(makeLinksCode(links)).toBe(
      'export const GetNextPageLink = {operationRef:"#/paths/~1users/get",description:"Next page of users"}',
    )
  })

  it.concurrent('should filter out $ref links', () => {
    const links: NonNullable<Components['links']> = {
      SharedLink: { $ref: '#/components/links/Shared' } as any,
      DirectLink: {
        operationId: 'getUser',
        description: 'Direct link',
      },
    }
    expect(makeLinksCode(links)).toBe(
      'export const DirectLinkLink = {operationId:"getUser",description:"Direct link"}',
    )
  })

  it.concurrent('should append as const with readonly flag', () => {
    const links: NonNullable<Components['links']> = {
      GetUser: { operationId: 'getUser' },
    }
    expect(makeLinksCode(links, true)).toBe(
      'export const GetUserLink = {operationId:"getUser"} as const',
    )
  })

  it.concurrent('should generate link with requestBody and server', () => {
    const links: NonNullable<Components['links']> = {
      CreateOrder: {
        operationId: 'createOrder',
        requestBody: { orderId: '$response.body#/id' },
        server: { url: 'https://api.example.com', name: 'prod' },
      },
    }
    expect(makeLinksCode(links)).toBe(
      'export const CreateOrderLink = {operationId:"createOrder",requestBody:{"orderId":"$response.body#/id"},server:{"url":"https://api.example.com","name":"prod"}}',
    )
  })

  it.concurrent('should generate multiple links', () => {
    const links: NonNullable<Components['links']> = {
      GetUser: { operationId: 'getUser' },
      ListPosts: { operationId: 'listPosts' },
    }
    expect(makeLinksCode(links)).toBe(
      [
        'export const GetUserLink = {operationId:"getUser"}',
        'export const ListPostsLink = {operationId:"listPosts"}',
      ].join('\n\n'),
    )
  })

  it.concurrent('should return empty string for empty links', () => {
    expect(makeLinksCode({})).toBe('')
  })
})
