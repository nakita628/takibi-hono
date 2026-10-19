// A TypeSpec document as the input (cases/typespec: specs/main.tsp, valibot, hono-openapi).
//
// The TypeSpec compiler runs for real in the CLI, so this proves the chain end to end: a
// `@query done?: boolean` arrives as a boolean, an `int32` path parameter as a number, and
// the model behind `@body` validates the JSON body.
import type { Hono } from 'hono'
import { describe, expect, it } from 'vite-plus/test'

async function request(path: string, init?: RequestInit) {
  const mod = (await import('../__app__/typespec/src/index.ts')) as { default: Hono }
  return mod.default.request(path, init)
}

const json = (body: unknown): RequestInit => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})

describe('typespec', () => {
  it('serves the welcome route', async () => {
    const res = await request('/hono')
    expect(res.status).toBe(200)
    expect(await res.json()).toStrictEqual({})
  })

  it('coerces a boolean query parameter and an int32 path parameter', async () => {
    const listed = await request('/todos?done=true')
    expect(listed.status).toBe(200)
    expect(await listed.json()).toStrictEqual({ query: { done: true } })
    const read = await request('/todos/12')
    expect(read.status).toBe(200)
    expect(await read.json()).toStrictEqual({ param: { id: 12 } })
  })

  it.each(['/todos?done=maybe', '/todos/twelve'])('rejects %s with 400', async (path) => {
    const res = await request(path)
    expect(res.status).toBe(400)
  })

  it('validates the body against the model', async () => {
    const todo = { id: 1, title: 'write tests', done: false }
    const created = await request('/todos', json(todo))
    expect(created.status).toBe(200)
    expect(await created.json()).toStrictEqual({ json: todo })
    const rejected = await request('/todos', json({ id: 'one', title: 'write tests' }))
    expect(rejected.status).toBe(400)
  })
})
