// Regeneration over hand-edited output, as a running app (cases/merge).
//
// The case seeds __generated__/merge with a handler file and an app entry edited the way a
// user edits them — implemented handler bodies, a helper constant, extra imports, a JSDoc
// comment on a route, middleware and a custom 404 in the app entry — plus a handler file no
// path maps to any more, and then runs the CLI over it. The golden test pins the merged
// source; this file proves the user's code is the code that runs: the implemented routes
// answer with their implementation, the route the spec added answers with its stub, and
// the app entry's additions are in effect.
import type { Hono } from 'hono'
import { describe, expect, it } from 'vite-plus/test'

async function request(path: string, init?: RequestInit) {
  const mod = (await import('../__app__/merge/src/index.ts')) as { default: Hono }
  return mod.default.request(path, init)
}

describe('merge', () => {
  it('runs the hand-written handler bodies behind the regenerated validators', async () => {
    // The user's GET body answers the in-memory list; the regenerated query validator still
    // runs in front of it.
    const empty = await request('/api/pets')
    expect(empty.status).toBe(200)
    expect(await empty.json()).toStrictEqual([])
    const rejected = await request('/api/pets?limit=abc')
    expect(rejected.status).toBe(400)

    // The user's POST body stores what the regenerated body validator let through.
    const created = await request('/api/pets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Rex', tag: 'dog' }),
    })
    expect(created.status).toBe(201)
    expect(await created.json()).toStrictEqual({ id: 1, name: 'Rex', tag: 'dog' })
    const listed = await request('/api/pets?limit=10')
    expect(await listed.json()).toStrictEqual([{ id: 1, name: 'Rex', tag: 'dog' }])

    // A `.on('HEAD', ...)` body and a body on a parameterized path survive too.
    const head = await request('/api/pets', { method: 'HEAD' })
    expect(head.status).toBe(200)
    const moved = await request('/api/pets/5')
    expect(moved.status).toBe(200)
    expect(await moved.json()).toStrictEqual({ gone: 'this route moved to another file' })
  })

  it('serves a route the spec added with its generated stub', async () => {
    const deleted = await request('/api/pets/7', { method: 'DELETE' })
    expect(deleted.status).toBe(200)
    expect(await deleted.json()).toStrictEqual({ param: { petId: 7 } })
  })

  it.each(['/api/nothing', '/api/old'])(
    'answers %s with the custom not-found handler the app entry kept',
    async (path) => {
      const res = await request(path)
      expect(res.status).toBe(404)
      expect(await res.text()).toBe('custom not found')
    },
  )
})
