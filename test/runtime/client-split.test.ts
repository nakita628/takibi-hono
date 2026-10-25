// The clients and rpc of cases/client-split (`split: true`), against the app they are typed by.
//
// Each group has a client of its own, but every group is registered on the one app, so a call
// through any of them reaches it. `fetch` is replaced by the app's own `request`, as in
// client.test.ts.
import type { Hono } from 'hono'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vite-plus/test'

const urls: string[] = []

beforeAll(async () => {
  const mod = (await import('../__app__/client-split/src/index.ts')) as { default: Hono }
  vi.stubGlobal('fetch', (...[input, init]: Parameters<typeof fetch>) => {
    urls.push(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url)
    return mod.default.request(input, init)
  })
})

// cspell:ignore unstub -- vitest's `unstubAllGlobals`
afterAll(() => {
  vi.unstubAllGlobals()
})

describe('client-split', () => {
  it('reaches the one app through the client of each group', async () => {
    const { get, get202401Reports, getPetsPetId } =
      await import('../__app__/client-split/src/rpc.ts')
    expect(await getPetsPetId({ param: { petId: '7' } })).toStrictEqual({ param: { petId: 7 } })
    expect(await get202401Reports()).toStrictEqual({})
    expect(await get()).toStrictEqual({})
    expect(urls).toStrictEqual(['/api/pets/7', '/api/2024-01/reports', '/api'])
  })
})
