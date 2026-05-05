import { describe, expect, it } from 'vite-plus/test'

import { makeBarrelCode } from './barrel.js'

describe('makeBarrelCode', () => {
  it.concurrent('should generate sorted barrel exports', () => {
    const result = makeBarrelCode(['users', '__root', 'todos'])
    expect(result).toBe(
      ["export*from'./__root'", "export*from'./todos'", "export*from'./users'"].join('\n'),
    )
  })

  it.concurrent('should handle single handler', () => {
    const result = makeBarrelCode(['users'])
    expect(result).toBe("export*from'./users'")
  })

  it.concurrent('should handle empty array', () => {
    expect(makeBarrelCode([])).toBe('')
  })

  it.concurrent('should sort alphabetically with __root first', () => {
    expect(makeBarrelCode(['pets', '__root', 'auth'])).toBe(
      ["export*from'./__root'", "export*from'./auth'", "export*from'./pets'"].join('\n'),
    )
  })

  it.concurrent('should handle hyphenated file names', () => {
    expect(makeBarrelCode(['user-profiles', 'health-check'])).toBe(
      ["export*from'./health-check'", "export*from'./user-profiles'"].join('\n'),
    )
  })

  it.concurrent('should produce stable output regardless of input order', () => {
    const a = makeBarrelCode(['c', 'a', 'b'])
    const b = makeBarrelCode(['b', 'c', 'a'])
    expect(a).toBe(b)
  })

  it.concurrent('should handle many handlers', () => {
    expect(makeBarrelCode(['users', 'todos', 'auth', 'pets', 'admin', 'health', 'docs'])).toBe(
      [
        "export*from'./admin'",
        "export*from'./auth'",
        "export*from'./docs'",
        "export*from'./health'",
        "export*from'./pets'",
        "export*from'./todos'",
        "export*from'./users'",
      ].join('\n'),
    )
  })
})
