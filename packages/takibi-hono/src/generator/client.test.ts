import { describe, expect, it } from 'vite-plus/test'

import { makeClientCode } from './client.js'

const HEADER = `import{hc}from'hono/client'
import type{api}from'..'`

const TYPED = `type Client=ReturnType<typeof hc<typeof api>>

const hcWithType=(...args:Parameters<typeof hc>):Client=>hc<typeof api>(...args)`

describe('makeClientCode', () => {
  it('creates the client for the same origin, with its type declared once', () => {
    expect(
      makeClientCode({
        appImport: '..',
        baseUrl: '/',
        basePath: undefined,
        credentials: undefined,
      }),
    ).toBe(`${HEADER}

${TYPED}

export const client=hcWithType('/')`)
  })

  it('hands the client out from below the base path', () => {
    expect(
      makeClientCode({
        appImport: '..',
        baseUrl: '/',
        basePath: '/api/v1',
        credentials: undefined,
      }),
    ).toBe(`${HEADER}

${TYPED}

export const client=hcWithType('/').api.v1`)
  })

  it('reaches a base-path segment that is not an identifier by its quoted name', () => {
    expect(
      makeClientCode({
        appImport: '..',
        baseUrl: '/',
        basePath: "/2024-01/it's",
        credentials: undefined,
      }),
    ).toBe(`${HEADER}

${TYPED}

export const client=hcWithType('/')['2024-01']['it\\'s']`)
  })

  it('reads the base URL from an environment variable, asserted present', () => {
    expect(
      makeClientCode({
        appImport: '..',
        baseUrl: { env: 'API_URL', source: 'process.env' },
        basePath: undefined,
        credentials: undefined,
      }),
    ).toBe(`${HEADER}

const baseUrl=process.env.API_URL!

${TYPED}

export const client=hcWithType(baseUrl)`)
  })

  it('reads the base URL from the environment object a module exports', () => {
    expect(
      makeClientCode({
        appImport: '..',
        baseUrl: { env: 'API_URL', import: '@/env', name: 'env' },
        basePath: undefined,
        credentials: undefined,
      }),
    ).toBe(`${HEADER}
import{env}from'@/env'

${TYPED}

export const client=hcWithType(env.API_URL)`)
  })

  it('imports the app under another name when the environment object is called api', () => {
    expect(
      makeClientCode({
        appImport: '..',
        baseUrl: { env: 'URL', import: './config', name: 'api' },
        basePath: undefined,
        credentials: undefined,
      }),
    ).toBe(`import{hc}from'hono/client'
import type{api as apiApp}from'..'
import{api}from'./config'

type Client=ReturnType<typeof hc<typeof apiApp>>

const hcWithType=(...args:Parameters<typeof hc>):Client=>hc<typeof apiApp>(...args)

export const client=hcWithType(api.URL)`)
  })

  it('sends every request with the configured credentials', () => {
    expect(
      makeClientCode({ appImport: '..', baseUrl: '/', basePath: '/api', credentials: 'include' }),
    ).toBe(`${HEADER}

${TYPED}

export const client=hcWithType('/',{init:{credentials:"include"}}).api`)
  })
})
