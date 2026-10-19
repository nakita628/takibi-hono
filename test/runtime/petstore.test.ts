// The petstore cases, as running apps.
//
// Each case under test is cases/<mode>-<lib> (specs/petstore.yaml, `basePath: '/api'`), with
// the handler stubs filled by scripts/generate.mjs: every handler answers, by validation
// target, the data the validators in front of it let through. So a 200 carries what reached
// the handler — the value after the generated schema coerced and validated it, not the raw
// request — and a 400 is a rejection by a generated validator. The assertions are the same
// across the four libraries and both modes: hono-openapi's `validator` and the plain
// `sValidator` must agree on what a request means.
//
// What is asserted per library is the shape the spec promises: an integer query / path
// parameter arrives as a number, a value outside its bounds or enum is rejected, a body is
// validated whether JSON or a form, a cookie is read. Header values are not asserted: the
// generated header schema keys the parameter as the spec spells it (`X-Request-Id`) while
// Hono hands validators lowercase header names, so what the handler sees differs by library.
import type { Hono } from 'hono'
import { describe, expect, it } from 'vite-plus/test'

const LIBRARIES = ['zod', 'valibot', 'arktype', 'effect'] as const
const MODES = ['openapi', 'plain'] as const

const cases = MODES.flatMap((mode) => LIBRARIES.map((lib) => ({ name: `${mode}-${lib}` })))

async function request(name: string, path: string, init?: RequestInit) {
  const mod = (await import(`../__app__/${name}/src/index.ts`)) as { default: Hono }
  return mod.default.request(path, init)
}

async function status(name: string, path: string, init?: RequestInit) {
  const res = await request(name, path, init)
  return res.status
}

/** What the filled handler answers: the validated data, by target. */
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

const form = (body: string): RequestInit => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body,
})

describe.each(cases)('$name', ({ name }) => {
  describe('routing', () => {
    it('serves the root path under the base path', async () => {
      expect(await validated(name, '/api')).toStrictEqual({})
    })

    it('serves a path whose first segment starts with a digit', async () => {
      expect(await status(name, '/api/2024-01/reports')).toBe(200)
    })

    it('serves a HEAD operation through .on()', async () => {
      expect(await status(name, '/api/pets', { method: 'HEAD' })).toBe(200)
    })

    it.each(['/pets', '/api/nothing'])('answers 404 for %s', async (path) => {
      expect(await status(name, path)).toBe(404)
    })
  })

  describe('query and cookie parameters', () => {
    it('coerces an integer query parameter and reads a cookie', async () => {
      const body = await validated(name, '/api/pets?limit=5&tag=dog', {
        headers: { Cookie: 'session=s1' },
      })
      expect(body['query']).toStrictEqual({ limit: 5, tag: 'dog' })
      expect(body['cookie']).toStrictEqual({ session: 's1' })
    })

    it('accepts a request with no optional parameter', async () => {
      const body = await validated(name, '/api/pets')
      expect(body['query']).toStrictEqual({})
      expect(body['cookie']).toStrictEqual({})
    })

    it.each([
      ['a non-integer', '/api/pets?limit=abc'],
      ['a value above the maximum', '/api/pets?limit=101'],
      ['a value outside the enum', '/api/pets?tag=fish'],
    ])('rejects %s with 400', async (_, path) => {
      expect(await status(name, path)).toBe(400)
    })
  })

  describe('path parameters', () => {
    it('coerces an integer path parameter', async () => {
      const got = await validated(name, '/api/pets/42')
      expect(got['param']).toStrictEqual({ petId: 42 })
      const deleted = await validated(name, '/api/pets/7', { method: 'DELETE' })
      expect(deleted['param']).toStrictEqual({ petId: 7 })
    })

    it.each([
      ['a value below the minimum', '/api/pets/0'],
      ['a non-integer', '/api/pets/abc'],
    ])('rejects %s with 400', async (_, path) => {
      expect(await status(name, path)).toBe(400)
    })
  })

  describe('request bodies', () => {
    it('validates a JSON body against the referenced request body schema', async () => {
      const created = await validated(name, '/api/pets', json({ name: 'Rex', tag: 'dog' }))
      expect(created['json']).toStrictEqual({ name: 'Rex', tag: 'dog' })
      expect(await status(name, '/api/pets', json({ name: '' }))).toBe(400)
    })

    it('validates a form body', async () => {
      expect(await validated(name, '/api/pets/7/photos', form('caption=hi'))).toStrictEqual({
        param: { petId: 7 },
        form: { caption: 'hi' },
      })
      expect(await status(name, '/api/pets/7/photos', form('caption='))).toBe(400)
    })
  })
})

// typebox without hono-openapi goes through `tbValidator`, which checks a value against the
// schema but does not run the `Codec` the generator emits for query and path coercion: an
// integer parameter reaches the handler as the string it arrived as, and a non-integer is not
// rejected. Only what tbValidator enforces is asserted here; the coercion gap is a known one.
describe('plain-typebox', () => {
  it.each([
    ['a value inside the enum', '/api/pets?tag=dog', undefined, 200],
    ['a value outside the enum', '/api/pets?tag=fish', undefined, 400],
    ['a JSON body', '/api/pets', json({ name: 'Rex' }), 200],
    ['a JSON body below minLength', '/api/pets', json({ name: '' }), 400],
    ['a form body', '/api/pets/7/photos', form('caption=hi'), 200],
    ['a form body below minLength', '/api/pets/7/photos', form('caption='), 400],
    ['the root path', '/api', undefined, 200],
    ['a HEAD operation', '/api/pets', { method: 'HEAD' }, 200],
    ['a path starting with a digit', '/api/2024-01/reports', undefined, 200],
    ['a path outside the base path', '/pets', undefined, 404],
  ])('%s answers %i', async (_, path, init, expected) => {
    expect(await status('plain-typebox', path, init)).toBe(expected)
  })
})
