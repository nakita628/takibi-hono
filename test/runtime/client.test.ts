// The typed client and rpc of cases/client-rpc, against the app they are typed by.
//
// The client is `hcWithType('/', { init: { credentials: 'include' } }).api` and rpc calls it.
// `fetch` is replaced by the app's own `request`, so a call goes out with the URL and the init
// the client builds and reaches the generated app, whose handler stubs answer what their
// validators let through (scripts/generate.mjs).
import type { Hono } from 'hono'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vite-plus/test'

type Call = { readonly url: string; readonly credentials: RequestInit['credentials'] }

const calls: Call[] = []

beforeAll(async () => {
  const mod = (await import('../__app__/client-rpc/src/index.ts')) as { default: Hono }
  vi.stubGlobal('fetch', (...[input, init]: Parameters<typeof fetch>) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    calls.push({ url, credentials: init?.credentials })
    return mod.default.request(input, init)
  })
})

beforeEach(() => {
  calls.length = 0
})

// cspell:ignore unstub -- vitest's `unstubAllGlobals`
afterAll(() => {
  vi.unstubAllGlobals()
})

const rpc = () => import('../__app__/client-rpc/src/rpc.ts')

describe('client-rpc', () => {
  it('sends a call below the base path, with the configured credentials', async () => {
    const { getPets } = await rpc()
    // listPets also validates its header and cookie parameters, which this call leaves out.
    expect(await getPets({ query: { limit: '5' }, header: {}, cookie: {} })).toStrictEqual({
      query: { limit: 5 },
      header: {},
      cookie: {},
    })
    expect(calls).toStrictEqual([{ url: '/api/pets?limit=5', credentials: 'include' }])
  })

  it('sends a path parameter and a JSON body through the generated validators', async () => {
    const { getPetsPetId, postPets } = await rpc()
    expect(await getPetsPetId({ param: { petId: '7' } })).toStrictEqual({ param: { petId: 7 } })
    expect(await postPets({ header: {}, json: { name: 'Rex', tag: 'dog' } })).toStrictEqual({
      header: {},
      json: { name: 'Rex', tag: 'dog' },
    })
    expect(calls.map((call) => call.url)).toStrictEqual(['/api/pets/7', '/api/pets'])
  })
})
