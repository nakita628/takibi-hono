import { describe, expect, it } from 'vite-plus/test'

import type { Components } from '../../../openapi/index.js'
import { makeResponsesCode } from './responses.js'

describe('makeResponsesCode', () => {
  it.concurrent('should generate response with resolver-wrapped schemas', async () => {
    const responses: NonNullable<Components['responses']> = {
      UserListResponse: {
        description: 'A list of users',
        content: {
          'application/json': {
            schema: { type: 'array', items: { $ref: '#/components/schemas/User' } },
          },
        },
        headers: {
          'X-Total-Count': {
            description: 'Total number of users',
            schema: { type: 'integer' },
          },
        },
      },
    }
    const result = await makeResponsesCode(responses, 'zod')
    expect(result).toBe(
      'export const UserListResponseResponse = {description:"A list of users",content:{\'application/json\':{schema:resolver(z.array(UserSchema))}},headers:{"X-Total-Count":{description:"Total number of users",schema:{"type":"integer"} as const}}}',
    )
  })

  it.concurrent('should generate response with $ref schema wrapped in resolver', async () => {
    const responses: NonNullable<Components['responses']> = {
      UnauthorizedResponse: {
        description: 'Authentication required',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
          },
        },
      },
    }
    const result = await makeResponsesCode(responses, 'zod')
    expect(result).toBe(
      'export const UnauthorizedResponseResponse = {description:"Authentication required",content:{\'application/json\':{schema:resolver(ErrorSchema)}}}',
    )
  })

  it.concurrent('should add as const when readonly is true', async () => {
    const responses: NonNullable<Components['responses']> = {
      NotFound: {
        description: 'Not found',
      },
    }
    const result = await makeResponsesCode(responses, 'zod', true)
    expect(result).toBe('export const NotFoundResponse = {description:"Not found"} as const')
  })

  it.concurrent('should skip $ref responses', async () => {
    const responses: NonNullable<Components['responses']> = {
      Alias: { $ref: '#/components/responses/NotFound' } as any,
      Real: { description: 'OK' },
    }
    const result = await makeResponsesCode(responses, 'zod')
    expect(result).toBe('export const RealResponse = {description:"OK"}')
  })

  it.concurrent('should handle response with $ref header', async () => {
    const responses: NonNullable<Components['responses']> = {
      WithHeader: {
        description: 'OK',
        headers: {
          'X-Req-Id': { $ref: '#/components/headers/X-Request-Id' },
        },
      },
    }
    const result = await makeResponsesCode(responses, 'zod')
    expect(result).toBe(
      'export const WithHeaderResponse = {description:"OK",headers:{"X-Req-Id":XRequestIdHeaderSchema}}',
    )
  })

  it.concurrent('should handle response without content (description only)', async () => {
    const responses: NonNullable<Components['responses']> = {
      NoContent: { description: 'Deleted' },
    }
    const result = await makeResponsesCode(responses, 'zod')
    expect(result).toBe('export const NoContentResponse = {description:"Deleted"}')
  })

  // ============================================================
  // Regression: `resolver(...)` requires a StandardSchemaV1-compatible
  // value. effect schemas need `standardSchemaV1(...)` wrap; typebox
  // schemas need `Compile(...)` wrap. Both must be applied at the
  // response component output too — not only inside route handlers.
  // ============================================================
  it.concurrent('wraps effect schema $ref with standardSchemaV1 inside resolver', async () => {
    const responses: NonNullable<Components['responses']> = {
      UserListResponse: {
        description: 'List',
        content: {
          'application/json': { schema: { $ref: '#/components/schemas/UserList' } },
        },
      },
    }
    const result = await makeResponsesCode(responses, 'effect')
    expect(result.includes('resolver(standardSchemaV1(UserListSchema))')).toBe(true)
    expect(result.includes('resolver(UserListSchema)')).toBe(false)
  })

  it.concurrent('wraps effect inline schema with standardSchemaV1 inside resolver', async () => {
    const responses: NonNullable<Components['responses']> = {
      InlineResponse: {
        description: 'Inline',
        content: {
          'application/json': {
            schema: { type: 'object', properties: { id: { type: 'integer' } } },
          },
        },
      },
    }
    const result = await makeResponsesCode(responses, 'effect')
    // `resolver(standardSchemaV1(Schema.Struct({...})))`
    expect(result.includes('resolver(standardSchemaV1(Schema.Struct')).toBe(true)
  })

  it.concurrent('wraps typebox schema $ref with Compile inside resolver', async () => {
    const responses: NonNullable<Components['responses']> = {
      UserResponse: {
        description: 'User',
        content: {
          'application/json': { schema: { $ref: '#/components/schemas/User' } },
        },
      },
    }
    const result = await makeResponsesCode(responses, 'typebox')
    expect(result.includes('resolver(Compile(UserSchema))')).toBe(true)
  })

  it.concurrent('does NOT wrap zod / valibot / arktype schemas (already StandardSchemaV1)', async () => {
    const responses: NonNullable<Components['responses']> = {
      UserResponse: {
        description: 'User',
        content: {
          'application/json': { schema: { $ref: '#/components/schemas/User' } },
        },
      },
    }
    for (const lib of ['zod', 'valibot', 'arktype'] as const) {
      const result = await makeResponsesCode(responses, lib)
      expect(result.includes('resolver(UserSchema)')).toBe(true)
      expect(result.includes('standardSchemaV1')).toBe(false)
      expect(result.includes('Compile(')).toBe(false)
    }
  })
})
