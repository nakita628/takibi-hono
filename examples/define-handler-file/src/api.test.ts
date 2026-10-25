// The one-file app end to end, through the app's own `request`: every operation answers with
// what its handler returns, `defineHandler` rejects what its options reject, and a miss is the
// HTTPException the handler throws.
import { describe, expect, it } from 'vite-plus/test'

import app from '.'

const json = (body: unknown): RequestInit => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})

describe('define-handler-file', () => {
  it('answers every operation with what its handler returns', async () => {
    const health = await app.request('/api/health')
    expect(await health.json()).toStrictEqual({ status: 'ok' })

    const created = await app.request('/api/users', json({ name: 'Grace' }))
    expect(created.status).toBe(201)
    expect(await created.json()).toStrictEqual({ id: 2, name: 'Grace' })

    const users = await app.request('/api/users?limit=1')
    expect(await users.json()).toStrictEqual([{ id: 1, name: 'Ada' }])

    const user = await app.request('/api/users/2')
    expect(await user.json()).toStrictEqual({ id: 2, name: 'Grace' })

    const post = await app.request('/api/posts', json({ authorId: 2, title: 'Notes' }))
    expect(post.status).toBe(201)
    const posts = await app.request('/api/posts?authorId=2')
    expect(await posts.json()).toStrictEqual([{ id: 2, authorId: 2, title: 'Notes' }])
  })

  it('rejects what the defineHandler options reject, with the issues', async () => {
    const res = await app.request('/api/users/0')
    expect(res.status).toBe(400)
    const body = (await res.json()) as { error: string; issues: { slot: string }[] }
    expect(body.error).toBe('Validation failed')
    expect(body.issues.map((issue) => issue.slot)).toStrictEqual(['param'])

    const empty = await app.request('/api/users', json({ name: '' }))
    expect(empty.status).toBe(400)
  })

  it('answers a missing user with the 404 the handler throws', async () => {
    const res = await app.request('/api/users/99')
    expect(res.status).toBe(404)
    expect(await res.json()).toStrictEqual({ message: 'user not found' })
  })

  it('answers an unknown route with the app’s not-found handler', async () => {
    const res = await app.request('/api/nothing')
    expect(res.status).toBe(404)
    expect(await res.json()).toStrictEqual({ message: 'no such route' })
  })
})
