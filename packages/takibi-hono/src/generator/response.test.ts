import { describe, expect, it } from 'vite-plus/test'

import { makeHandlerStub } from './response.js'

describe('makeHandlerStub', () => {
  it.concurrent('should return empty handler stub', () => {
    expect(makeHandlerStub()).toBe('(c)=>{}')
  })
})
