// The defineHandler cases, as running apps.
//
// cases/define-<lib> generate the petstore with `defineHandler: true`: src/routes.ts defines
// every operation as a `defineHandler` whose options validate the request targets and the
// response, and each group's Hono calls its definitions with the handlers. The stubs are filled
// by scripts/generate.mjs with a handler that
// answers, by target, the data `c.req.valid()` holds — what `defineHandler` validated and
// coerced — as a body Response, which a response schema lets through unvalidated. So a 200
// carries what reached the handler, and a 400 is `defineHandler`'s rejection, with the
// `{ error, issues }` body it writes.
import type { Hono } from 'hono'
import { describe, expect, it } from 'vite-plus/test'

const LIBRARIES = ['zod', 'valibot', 'arktype', 'effect'] as const

async function request(name: string, path: string, init?: RequestInit) {
  const mod = (await import(`../__app__/${name}/src/index.ts`)) as { default: Hono }
  return mod.default.request(path, init)
}

async function status(name: string, path: string, init?: RequestInit) {
  const res = await request(name, path, init)
  return res.status
}

async function validated(name: string, path: string, init?: RequestInit) {
  const res = await request(name, path, init)
  expect(res.status).toBe(200)
  return (await res.json()) as { readonly [target: string]: unknown }
}

const json = (body: unknown): RequestInit => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})

describe.each(LIBRARIES.map((lib) => ({ name: `define-${lib}` })))('$name', ({ name }) => {
  it('coerces a query parameter, reads a cookie and a path parameter', async () => {
    const listed = await validated(name, '/api/pets?limit=5&tag=dog', {
      headers: { Cookie: 'session=s1' },
    })
    expect(listed['query']).toStrictEqual({ limit: 5, tag: 'dog' })
    expect(listed['cookie']).toStrictEqual({ session: 's1' })
    const got = await validated(name, '/api/pets/42')
    expect(got['param']).toStrictEqual({ petId: 42 })
  })

  it('validates a JSON body against the referenced request body schema', async () => {
    const created = await validated(name, '/api/pets', json({ name: 'Rex', tag: 'dog' }))
    expect(created['json']).toStrictEqual({ name: 'Rex', tag: 'dog' })
  })

  it.each([
    ['a non-integer query parameter', '/api/pets?limit=abc', undefined],
    ['a value outside the enum', '/api/pets?tag=fish', undefined],
    ['a path parameter below the minimum', '/api/pets/0', undefined],
    ['a JSON body below minLength', '/api/pets', json({ name: '' })],
  ])('rejects %s with defineHandler’s 400', async (_, path, init) => {
    const res = await request(name, path, init)
    expect(res.status).toBe(400)
    const body = (await res.json()) as { error: string; issues: { slot: string }[] }
    expect(body.error).toBe('Validation failed')
    expect(body.issues.length).toBeGreaterThan(0)
  })

  it('serves a HEAD operation, the root and a path starting with a digit', async () => {
    expect(await status(name, '/api/pets', { method: 'HEAD' })).toBe(200)
    expect(await status(name, '/api')).toBe(200)
    expect(await status(name, '/api/2024-01/reports')).toBe(200)
  })
})

// Regeneration over hand-edited defineHandler output (cases/define-merge): the user's handlers
// run behind the regenerated options, with the middleware they put before one.
describe('define-merge', () => {
  it('runs the hand-written handlers behind the regenerated validators', async () => {
    const empty = await request('define-merge', '/api/pets')
    expect(empty.status).toBe(200)
    expect(await empty.json()).toStrictEqual([])
    expect(empty.headers.get('X-Requests-Seen')).toBe('0')
    // The regenerated query validator still runs in front of the user's handler.
    expect(await status('define-merge', '/api/pets?limit=abc')).toBe(400)

    const created = await request('define-merge', '/api/pets', json({ name: 'Rex', tag: 'dog' }))
    expect(created.status).toBe(201)
    expect(await created.json()).toStrictEqual({ id: 1, name: 'Rex', tag: 'dog' })
    const listed = await request('define-merge', '/api/pets?limit=10')
    expect(await listed.json()).toStrictEqual([{ id: 1, name: 'Rex', tag: 'dog' }])
    expect(listed.headers.get('X-Requests-Seen')).toBe('1')

    // A definition called with a handler of the user's keeps it.
    expect(await status('define-merge', '/api/pets', { method: 'HEAD' })).toBe(200)
  })

  it('serves an operation the spec added with its generated stub', async () => {
    const deleted = await request('define-merge', '/api/pets/7', { method: 'DELETE' })
    expect(deleted.status).toBe(200)
    expect(await deleted.json()).toStrictEqual({ param: { petId: 7 } })
  })

  it('answers with the custom not-found handler the app entry kept', async () => {
    const res = await request('define-merge', '/api/nothing')
    expect(res.status).toBe(404)
    expect(await res.text()).toBe('custom not found')
  })
})
