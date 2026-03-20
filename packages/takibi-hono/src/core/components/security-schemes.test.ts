import { describe, expect, it } from 'vite-plus/test'

import type { Components } from '../../openapi/index.js'
import { makeSecuritySchemesCode } from './security-schemes.js'

describe('makeSecuritySchemesCode', () => {
  it.concurrent('should generate bearer auth scheme', () => {
    const securitySchemes: NonNullable<Components['securitySchemes']> = {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT Bearer token',
      },
    }
    const result = makeSecuritySchemesCode(securitySchemes)
    expect(result).toBe(
      'export const BearerAuthSecurityScheme = {type:"http",description:"JWT Bearer token",scheme:"bearer",bearerFormat:"JWT"}',
    )
  })

  it.concurrent('should generate apiKey scheme', () => {
    const securitySchemes: NonNullable<Components['securitySchemes']> = {
      apiKey: {
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
        description: 'API key authentication',
      },
    }
    const result = makeSecuritySchemesCode(securitySchemes)
    expect(result).toBe(
      'export const ApiKeySecurityScheme = {type:"apiKey",description:"API key authentication",name:"X-API-Key",in:"header"}',
    )
  })

  it.concurrent('should generate multiple security schemes', () => {
    const securitySchemes: NonNullable<Components['securitySchemes']> = {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
      },
      apiKey: {
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
      },
    }
    const result = makeSecuritySchemesCode(securitySchemes)
    expect(result).toBe(
      'export const BearerAuthSecurityScheme = {type:"http",scheme:"bearer"}\n\nexport const ApiKeySecurityScheme = {type:"apiKey",name:"X-API-Key",in:"header"}',
    )
  })
})
