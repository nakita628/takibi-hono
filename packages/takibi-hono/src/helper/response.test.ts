import { describe, expect, it } from 'vite-plus/test'

import { HANDLER_STUB } from './response.js'

describe('HANDLER_STUB', () => {
  it.concurrent('should be empty handler stub', () => {
    expect(HANDLER_STUB).toBe('(c)=>{}')
  })
})
