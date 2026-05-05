import { describe, expect, it } from 'vite-plus/test'

import type { Media, Operation } from '../openapi/index.js'
import { makeDescribeRoute } from './describe-route.js'

describe('makeDescribeRoute', () => {
  it.concurrent('should generate describeRoute with description', () => {
    const operation: Operation = {
      description: 'Get all users',
      responses: {
        '200': { description: 'Successful response' },
      },
    }
    const result = makeDescribeRoute(operation, 'zod')
    expect(result).toBe(
      'describeRoute({description:"Get all users",responses:{200:{description:"Successful response"}}})',
    )
  })

  it.concurrent('should generate describeRoute with response schema', () => {
    const operation: Operation = {
      responses: {
        '200': {
          description: 'Success',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/User' },
            },
          },
        },
      },
    }
    const result = makeDescribeRoute(operation, 'zod')
    expect(result).toBe(
      'describeRoute({responses:{200:{description:"Success",content:{\'application/json\':{schema:resolver(UserSchema)}}}}})',
    )
  })

  it.concurrent('should handle multiple status codes', () => {
    const operation: Operation = {
      responses: {
        '200': { description: 'Success' },
        '404': { description: 'Not found' },
      },
    }
    const result = makeDescribeRoute(operation, 'zod')
    expect(result).toBe(
      'describeRoute({responses:{200:{description:"Success"},404:{description:"Not found"}}})',
    )
  })

  it.concurrent('should include tags', () => {
    const operation: Operation = {
      tags: ['users', 'admin'],
      responses: {
        '200': { description: 'OK' },
      },
    }
    const result = makeDescribeRoute(operation, 'zod')
    expect(result).toBe(
      'describeRoute({tags:["users","admin"],responses:{200:{description:"OK"}}})',
    )
  })

  it.concurrent('should include operationId', () => {
    const operation: Operation = {
      operationId: 'getUsers',
      responses: {
        '200': { description: 'OK' },
      },
    }
    const result = makeDescribeRoute(operation, 'zod')
    expect(result).toBe(
      'describeRoute({operationId:"getUsers",responses:{200:{description:"OK"}}})',
    )
  })

  it.concurrent('should include deprecated', () => {
    const operation: Operation = {
      deprecated: true,
      responses: {
        '200': { description: 'OK' },
      },
    }
    const result = makeDescribeRoute(operation, 'zod')
    expect(result).toBe('describeRoute({deprecated:true,responses:{200:{description:"OK"}}})')
  })

  it.concurrent('should not include deprecated when false', () => {
    const operation: Operation = {
      deprecated: false,
      responses: {
        '200': { description: 'OK' },
      },
    }
    const result = makeDescribeRoute(operation, 'zod')
    expect(result).toBe('describeRoute({responses:{200:{description:"OK"}}})')
  })

  it.concurrent('should include security', () => {
    const operation: Operation = {
      security: { name: ['bearerAuth'] },
      responses: {
        '200': { description: 'OK' },
      },
    }
    const result = makeDescribeRoute(operation, 'zod')
    expect(result).toBe(
      'describeRoute({security:{"name":["bearerAuth"]},responses:{200:{description:"OK"}}})',
    )
  })

  it.concurrent('should include externalDocs', () => {
    const operation: Operation = {
      externalDocs: {
        url: 'https://example.com/docs',
        description: 'More info',
      },
      responses: {
        '200': { description: 'OK' },
      },
    }
    const result = makeDescribeRoute(operation, 'zod')
    expect(result).toBe(
      'describeRoute({externalDocs:{url:"https://example.com/docs",description:"More info"},responses:{200:{description:"OK"}}})',
    )
  })

  it.concurrent('should include externalDocs without description', () => {
    const operation: Operation = {
      externalDocs: {
        url: 'https://example.com/docs',
      },
      responses: {
        '200': { description: 'OK' },
      },
    }
    const result = makeDescribeRoute(operation, 'zod')
    expect(result).toBe(
      'describeRoute({externalDocs:{url:"https://example.com/docs"},responses:{200:{description:"OK"}}})',
    )
  })

  it.concurrent('should include servers', () => {
    const operation: Operation = {
      servers: [{ url: 'https://api.example.com', description: 'Production' }],
      responses: {
        '200': { description: 'OK' },
      },
    }
    const result = makeDescribeRoute(operation, 'zod')
    expect(result).toBe(
      'describeRoute({servers:[{url:"https://api.example.com",description:"Production"}],responses:{200:{description:"OK"}}})',
    )
  })

  it.concurrent('should include servers with variables', () => {
    const operation: Operation = {
      servers: [
        {
          url: 'https://{env}.example.com',
          variables: {
            env: { default: 'prod', enum: ['prod', 'staging'], description: 'Environment' },
          },
        },
      ],
      responses: {
        '200': { description: 'OK' },
      },
    }
    const result = makeDescribeRoute(operation, 'zod')
    expect(result).toBe(
      'describeRoute({servers:[{url:"https://{env}.example.com",variables:{env:{enum:["prod","staging"],default:"prod",description:"Environment"}}}],responses:{200:{description:"OK"}}})',
    )
  })

  it.concurrent('should include response headers', () => {
    const operation: Operation = {
      responses: {
        '200': {
          description: 'OK',
          headers: {
            'X-Rate-Limit': {
              description: 'Rate limit',
              schema: { type: 'integer' },
            },
          },
        },
      },
    }
    const result = makeDescribeRoute(operation, 'zod')
    expect(result).toBe(
      'describeRoute({responses:{200:{description:"OK",headers:{"X-Rate-Limit":{description:"Rate limit",schema:{"type":"integer"} as const}}}}})',
    )
  })

  it.concurrent('should include all fields together', () => {
    const operation: Operation = {
      description: 'Get users',
      summary: 'List users',
      tags: ['users'],
      operationId: 'listUsers',
      deprecated: true,
      responses: {
        '200': { description: 'OK' },
      },
    }
    const result = makeDescribeRoute(operation, 'zod')
    expect(result).toBe(
      'describeRoute({description:"Get users",summary:"List users",tags:["users"],operationId:"listUsers",deprecated:true,responses:{200:{description:"OK"}}})',
    )
  })

  it.concurrent('should handle oneOf response schema', () => {
    const operation: Operation = {
      responses: {
        '200': {
          description: 'OK',
          content: {
            'application/json': {
              schema: {
                oneOf: [{ $ref: '#/components/schemas/Cat' }, { $ref: '#/components/schemas/Dog' }],
              },
            },
          },
        },
      },
    }
    const result = makeDescribeRoute(operation, 'zod')
    expect(result).toBe(
      'describeRoute({responses:{200:{description:"OK",content:{\'application/json\':{schema:resolver(z.union([CatSchema,DogSchema]))}}}}})',
    )
  })

  it.concurrent('should handle allOf response schema', () => {
    const operation: Operation = {
      responses: {
        '200': {
          description: 'OK',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/Base' },
                  { $ref: '#/components/schemas/Extra' },
                ],
              },
            },
          },
        },
      },
    }
    const result = makeDescribeRoute(operation, 'zod')
    expect(result).toBe(
      'describeRoute({responses:{200:{description:"OK",content:{\'application/json\':{schema:resolver(z.intersection(BaseSchema,ExtraSchema))}}}}})',
    )
  })

  it.concurrent('should handle $ref response', () => {
    const operation: Operation = {
      responses: {
        '200': { $ref: '#/components/responses/UserList' },
      },
    }
    const result = makeDescribeRoute(operation, 'zod')
    expect(result).toBe('describeRoute({responses:{200:UserListResponse}})')
  })

  it.concurrent('should generate response with no responses field', () => {
    const operation = {
      description: 'No responses',
    } as Operation
    const result = makeDescribeRoute(operation, 'zod')
    expect(result).toBe('describeRoute({description:"No responses"})')
  })

  it.concurrent('should generate response with empty responses object', () => {
    const operation: Operation = {
      responses: {},
    }
    const result = makeDescribeRoute(operation, 'zod')
    expect(result).toBe('describeRoute({})')
  })

  it.concurrent('should generate response schema with valibot', () => {
    const operation: Operation = {
      responses: {
        '200': {
          description: 'OK',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/User' },
            },
          },
        },
      },
    }
    const result = makeDescribeRoute(operation, 'valibot')
    expect(result).toBe(
      'describeRoute({responses:{200:{description:"OK",content:{\'application/json\':{schema:resolver(UserSchema)}}}}})',
    )
  })

  it.concurrent('should generate response schema with typebox', () => {
    const operation: Operation = {
      responses: {
        '200': {
          description: 'OK',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Item' },
            },
          },
        },
      },
    }
    const result = makeDescribeRoute(operation, 'typebox')
    expect(result).toBe(
      'describeRoute({responses:{200:{description:"OK",content:{\'application/json\':{schema:resolver(Compile(ItemSchema))}}}}})',
    )
  })

  it.concurrent('should generate response schema with arktype', () => {
    const operation: Operation = {
      responses: {
        '200': {
          description: 'OK',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Pet' },
            },
          },
        },
      },
    }
    const result = makeDescribeRoute(operation, 'arktype')
    expect(result).toBe(
      'describeRoute({responses:{200:{description:"OK",content:{\'application/json\':{schema:resolver(PetSchema)}}}}})',
    )
  })

  it.concurrent('should generate response schema with effect', () => {
    const operation: Operation = {
      responses: {
        '200': {
          description: 'OK',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Order' },
            },
          },
        },
      },
    }
    const result = makeDescribeRoute(operation, 'effect')
    expect(result).toBe(
      'describeRoute({responses:{200:{description:"OK",content:{\'application/json\':{schema:resolver(standardSchemaV1(OrderSchema))}}}}})',
    )
  })

  it.concurrent('should generate inline response schema with valibot', () => {
    const operation: Operation = {
      responses: {
        '200': {
          description: 'OK',
          content: {
            'application/json': {
              schema: { type: 'object', properties: { id: { type: 'integer' } }, required: ['id'] },
            },
          },
        },
      },
    }
    const result = makeDescribeRoute(operation, 'valibot')
    expect(result).toBe(
      'describeRoute({responses:{200:{description:"OK",content:{\'application/json\':{schema:resolver(v.object({id:v.number()}))}}}}})',
    )
  })

  it.concurrent('should handle response content with no schema', () => {
    const operation: Operation = {
      responses: {
        '204': {
          description: 'No Content',
          content: {
            'application/json': {} as Media,
          },
        },
      },
    }
    const result = makeDescribeRoute(operation, 'zod')
    expect(result).toBe('describeRoute({responses:{204:{description:"No Content"}}})')
  })

  it.concurrent('should handle multiple content types in response', () => {
    const operation: Operation = {
      responses: {
        '200': {
          description: 'OK',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/User' },
            },
            'application/xml': {
              schema: { $ref: '#/components/schemas/User' },
            },
          },
        },
      },
    }
    const result = makeDescribeRoute(operation, 'zod')
    expect(result).toBe(
      "describeRoute({responses:{200:{description:\"OK\",content:{'application/json':{schema:resolver(UserSchema)},'application/xml':{schema:resolver(UserSchema)}}}}})",
    )
  })

  it.concurrent('should handle summary without description', () => {
    const operation: Operation = {
      summary: 'List items',
      responses: {
        '200': { description: 'OK' },
      },
    }
    const result = makeDescribeRoute(operation, 'zod')
    expect(result).toBe('describeRoute({summary:"List items",responses:{200:{description:"OK"}}})')
  })

  it.concurrent('should handle empty tags array', () => {
    const operation: Operation = {
      tags: [],
      responses: {
        '200': { description: 'OK' },
      },
    }
    const result = makeDescribeRoute(operation, 'zod')
    expect(result).toBe('describeRoute({responses:{200:{description:"OK"}}})')
  })

  it.concurrent('should handle empty servers array', () => {
    const operation: Operation = {
      servers: [],
      responses: {
        '200': { description: 'OK' },
      },
    }
    const result = makeDescribeRoute(operation, 'zod')
    expect(result).toBe('describeRoute({responses:{200:{description:"OK"}}})')
  })

  it.concurrent('should handle multiple status codes including errors', () => {
    const operation: Operation = {
      responses: {
        '200': {
          description: 'OK',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } },
        },
        '404': {
          description: 'Not found',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
        '500': { description: 'Internal error' },
      },
    }
    const result = makeDescribeRoute(operation, 'zod')
    expect(result).toBe(
      'describeRoute({responses:{200:{description:"OK",content:{\'application/json\':{schema:resolver(UserSchema)}}},404:{description:"Not found",content:{\'application/json\':{schema:resolver(ErrorSchema)}}},500:{description:"Internal error"}}})',
    )
  })

  // --- field ordering and edge cases ---

  it.concurrent('emits fields in fixed order: description, summary, tags, operationId, deprecated, security, externalDocs, servers, responses', () => {
    // `security` is typed as a single object; we exercise the array form which
    // the impl JSON-stringifies as-is. Cast at the test boundary.
    const result = makeDescribeRoute(
      {
        security: [{ name: ['s1'] }],
        responses: { 200: { description: 'OK' } },
        summary: 's',
        tags: ['t1', 't2'],
        deprecated: true,
        operationId: 'op',
        description: 'd',
      } as never,
      'zod',
    )
    expect(result).toBe(
      'describeRoute({description:"d",summary:"s",tags:["t1","t2"],operationId:"op",deprecated:true,security:[{"name":["s1"]}],responses:{200:{description:"OK"}}})',
    )
  })

  it.concurrent('omits responses key when operation has no responses object', () => {
    // Operation type marks `responses` as required; cast for this edge case.
    expect(makeDescribeRoute({ summary: 'X' } as never, 'zod')).toBe('describeRoute({summary:"X"})')
  })

  it.concurrent('omits empty tags array entirely', () => {
    expect(
      makeDescribeRoute(
        { summary: 'X', tags: [], responses: { 200: { description: 'OK' } } },
        'zod',
      ),
    ).toBe('describeRoute({summary:"X",responses:{200:{description:"OK"}}})')
  })

  it.concurrent('omits empty servers array entirely', () => {
    expect(
      makeDescribeRoute(
        { summary: 'X', servers: [], responses: { 200: { description: 'OK' } } },
        'zod',
      ),
    ).toBe('describeRoute({summary:"X",responses:{200:{description:"OK"}}})')
  })

  it.concurrent('emits empty security array (truthy check, not length-gated)', () => {
    // Documented behavior: an empty `security: []` is emitted as-is, which is a
    // valid OpenAPI signal meaning "no security required". The generator does
    // not strip it the way it strips empty `tags` / `servers`.
    expect(
      makeDescribeRoute(
        { summary: 'X', security: [], responses: { 200: { description: 'OK' } } } as never,
        'zod',
      ),
    ).toBe('describeRoute({summary:"X",security:[],responses:{200:{description:"OK"}}})')
  })

  it.concurrent('escapes embedded newlines and quotes in description via JSON.stringify', () => {
    expect(
      makeDescribeRoute(
        {
          description: 'Line one\nLine "two"',
          responses: { 200: { description: 'OK' } },
        },
        'zod',
      ),
    ).toBe(
      'describeRoute({description:"Line one\\nLine \\"two\\"",responses:{200:{description:"OK"}}})',
    )
  })

  it.concurrent('preserves status-code key order from input object iteration', () => {
    // Object.entries follows insertion order for string keys: numeric-like
    // keys are sorted ascending, so 200,400,404,500 always serialize in that order.
    expect(
      makeDescribeRoute(
        {
          summary: 'X',
          responses: {
            500: { description: 'Err' },
            200: { description: 'OK' },
            404: { description: 'NF' },
            400: { description: 'Bad' },
          },
        },
        'zod',
      ),
    ).toBe(
      'describeRoute({summary:"X",responses:{200:{description:"OK"},400:{description:"Bad"},404:{description:"NF"},500:{description:"Err"}}})',
    )
  })
})
