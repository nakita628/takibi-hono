import { describe, expect, it } from 'vite-plus/test'

import type { OpenAPI } from '../openapi/index.js'
import { makeAppCode } from './app.js'

const minimalOpenAPI = {
  info: { title: 'My API', version: '2.0.0' },
  paths: {},
} as unknown as OpenAPI

describe('makeAppCode', () => {
  it.concurrent('should generate app code with handlers', () => {
    const code = makeAppCode(minimalOpenAPI, ['__root', 'users', 'todos'])
    expect(code).toBe(
      [
        "import{Hono}from'hono'",
        "import{rootHandler,todosHandler,usersHandler}from'./handlers'",
        '',
        'const app=new Hono()',
        '',
        "export const api=app.route('/',rootHandler).route('/',todosHandler).route('/',usersHandler)",
        '',
        'export default app',
      ].join('\n'),
    )
  })

  it.concurrent('should add basePath when configured', () => {
    const code = makeAppCode(minimalOpenAPI, ['users'], { basePath: '/api' })
    expect(code).toBe(
      [
        "import{Hono}from'hono'",
        "import{usersHandler}from'./handlers'",
        '',
        "const app=new Hono().basePath('/api')",
        '',
        "export const api=app.route('/',usersHandler)",
        '',
        'export default app',
      ].join('\n'),
    )
  })

  it.concurrent('should not add basePath by default', () => {
    const code = makeAppCode(minimalOpenAPI, ['users'])
    expect(code).toBe(
      [
        "import{Hono}from'hono'",
        "import{usersHandler}from'./handlers'",
        '',
        'const app=new Hono()',
        '',
        "export const api=app.route('/',usersHandler)",
        '',
        'export default app',
      ].join('\n'),
    )
  })

  it.concurrent('should use custom handlers import path', () => {
    const code = makeAppCode(minimalOpenAPI, ['users'], { handlersImportPath: './routes' })
    expect(code).toBe(
      [
        "import{Hono}from'hono'",
        "import{usersHandler}from'./routes'",
        '',
        'const app=new Hono()',
        '',
        "export const api=app.route('/',usersHandler)",
        '',
        'export default app',
      ].join('\n'),
    )
  })

  it.concurrent('should handle empty handler list', () => {
    const code = makeAppCode(minimalOpenAPI, [])
    expect(code).toBe(
      [
        "import{Hono}from'hono'",
        "import{}from'./handlers'",
        '',
        'const app=new Hono()',
        '',
        'export const api=app',
        '',
        'export default app',
      ].join('\n'),
    )
  })

  it.concurrent('should handle __root handler', () => {
    const code = makeAppCode(minimalOpenAPI, ['__root'])
    expect(code).toBe(
      [
        "import{Hono}from'hono'",
        "import{rootHandler}from'./handlers'",
        '',
        'const app=new Hono()',
        '',
        "export const api=app.route('/',rootHandler)",
        '',
        'export default app',
      ].join('\n'),
    )
  })

  // =========================================================================
  // Robustness: handler names with hyphens, special chars, edge cases
  // =========================================================================

  it.concurrent('should handle hyphenated handler names', () => {
    expect(makeAppCode(minimalOpenAPI, ['user-profiles'])).toBe(
      [
        "import{Hono}from'hono'",
        "import{userProfilesHandler}from'./handlers'",
        '',
        'const app=new Hono()',
        '',
        "export const api=app.route('/',userProfilesHandler)",
        '',
        'export default app',
      ].join('\n'),
    )
  })

  it.concurrent('should handle multiple hyphenated and normal handlers sorted', () => {
    expect(makeAppCode(minimalOpenAPI, ['api-v1', 'users', 'health-check'])).toBe(
      [
        "import{Hono}from'hono'",
        "import{apiV1Handler,healthCheckHandler,usersHandler}from'./handlers'",
        '',
        'const app=new Hono()',
        '',
        "export const api=app.route('/',apiV1Handler).route('/',healthCheckHandler).route('/',usersHandler)",
        '',
        'export default app',
      ].join('\n'),
    )
  })

  it.concurrent('should handle single character handler name', () => {
    expect(makeAppCode(minimalOpenAPI, ['x'])).toBe(
      [
        "import{Hono}from'hono'",
        "import{xHandler}from'./handlers'",
        '',
        'const app=new Hono()',
        '',
        "export const api=app.route('/',xHandler)",
        '',
        'export default app',
      ].join('\n'),
    )
  })

  it.concurrent('should handle basePath with hyphenated handlers', () => {
    expect(makeAppCode(minimalOpenAPI, ['user-profiles'], { basePath: '/api/v2' })).toBe(
      [
        "import{Hono}from'hono'",
        "import{userProfilesHandler}from'./handlers'",
        '',
        "const app=new Hono().basePath('/api/v2')",
        '',
        "export const api=app.route('/',userProfilesHandler)",
        '',
        'export default app',
      ].join('\n'),
    )
  })

  it.concurrent('should produce stable output for same input', () => {
    const first = makeAppCode(minimalOpenAPI, ['b', 'a', 'c'])
    const second = makeAppCode(minimalOpenAPI, ['c', 'a', 'b'])
    expect(first).toBe(second)
  })
})
