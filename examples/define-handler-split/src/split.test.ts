// The split app end to end: rpc calls the client of each operation's group, every client reaches
// the one app, and its `defineHandler`s answer. `fetch` is the app's own `request`, so no server
// runs.
import { afterAll, beforeAll, describe, expect, it, vi } from 'vite-plus/test'

import app from '.'
import { getHealth, getPosts, getUsers, getUsersUserId, postPosts, postUsers } from './rpc'

const urls: string[] = []

beforeAll(() => {
  vi.stubGlobal('fetch', (...[input, init]: Parameters<typeof fetch>) => {
    urls.push(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url)
    return app.request(input, init)
  })
})

// cspell:ignore unstub -- vitest's `unstubAllGlobals`
afterAll(() => {
  vi.unstubAllGlobals()
})

describe('define-handler-split', () => {
  it('answers through the client of each group', async () => {
    expect(await getHealth()).toStrictEqual({ status: 'ok' })
    expect(await getUsers({ query: {} })).toStrictEqual([{ id: 1, name: 'Ada' }])
    expect(await postUsers({ json: { name: 'Grace' } })).toStrictEqual({ id: 2, name: 'Grace' })
    expect(await getUsersUserId({ param: { userId: '2' } })).toStrictEqual({ id: 2, name: 'Grace' })
    expect(await postPosts({ json: { authorId: 2, title: 'Notes' } })).toStrictEqual({
      id: 2,
      authorId: 2,
      title: 'Notes',
    })
    expect(await getPosts({ query: { authorId: '2' } })).toStrictEqual([
      { id: 2, authorId: 2, title: 'Notes' },
    ])
    expect(urls).toStrictEqual([
      '/api/health',
      '/api/users',
      '/api/users',
      '/api/users/2',
      '/api/posts',
      '/api/posts?authorId=2',
    ])
  })

  it('rejects what defineHandler rejects, and answers a missing user with 404', async () => {
    // `userId` has `minimum: 1`; parseResponse throws, with the status, on a response not ok.
    await expect(getUsersUserId({ param: { userId: '0' } })).rejects.toMatchObject({
      statusCode: 400,
    })
    await expect(getUsersUserId({ param: { userId: '99' } })).rejects.toMatchObject({
      statusCode: 404,
    })
    expect(urls.slice(-2)).toStrictEqual(['/api/users/0', '/api/users/99'])
  })
})
