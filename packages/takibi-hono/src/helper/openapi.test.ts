import { describe, expect, test } from 'vite-plus/test'

import {
  groupParametersByLocation,
  makeContent,
  makeExternalDocsPart,
  makeHeader,
  makeObjectExpression,
  makeOptional,
  makeResponse,
  makeServersPart,
  resolveSchema,
  wrapSchemaForValidator,
} from './openapi.js'

// ─── makeOptional ───

describe('makeOptional', () => {
  const ALL_LIBS: ('zod' | 'valibot' | 'typebox' | 'arktype' | 'effect')[] = [
    'zod',
    'valibot',
    'typebox',
    'arktype',
    'effect',
  ]

  test('zod', () => {
    expect(makeOptional('z.string()', 'zod')).toBe('z.string().optional()')
  })

  test('valibot', () => {
    expect(makeOptional('v.string()', 'valibot')).toBe('v.optional(v.string())')
  })

  test('typebox', () => {
    expect(makeOptional('Type.String()', 'typebox')).toBe('Type.Optional(Type.String())')
  })

  test('arktype', () => {
    expect(makeOptional("type('string')", 'arktype')).toBe("type('string').optional()")
  })

  test('effect', () => {
    expect(makeOptional('Schema.String', 'effect')).toBe('Schema.optional(Schema.String)')
  })

  test('all libs return a string', () => {
    for (const lib of ALL_LIBS) {
      expect(typeof makeOptional('expr', lib)).toBe('string')
    }
  })
})

// ─── makeObjectExpression ───

describe('makeObjectExpression', () => {
  test('zod', () => {
    expect(makeObjectExpression(['name:z.string()'], 'zod')).toBe('z.object({name:z.string()})')
  })

  test('valibot', () => {
    expect(makeObjectExpression(['name:v.string()'], 'valibot')).toBe('v.object({name:v.string()})')
  })

  test('typebox', () => {
    expect(makeObjectExpression(['name:Type.String()'], 'typebox')).toBe(
      'Type.Object({name:Type.String()})',
    )
  })

  test('arktype', () => {
    expect(makeObjectExpression(["name:type('string')"], 'arktype')).toBe(
      "type({name:type('string')})",
    )
  })

  test('effect', () => {
    expect(makeObjectExpression(['name:Schema.String'], 'effect')).toBe(
      'Schema.Struct({name:Schema.String})',
    )
  })

  test('multiple fields', () => {
    expect(makeObjectExpression(['a:z.string()', 'b:z.number()'], 'zod')).toBe(
      'z.object({a:z.string(),b:z.number()})',
    )
  })

  test('empty fields', () => {
    expect(makeObjectExpression([], 'zod')).toBe('z.object({})')
  })
})

// ─── wrapSchemaForValidator ───

describe('wrapSchemaForValidator', () => {
  test('zod returns expr unchanged', () => {
    expect(wrapSchemaForValidator('z.string()', 'zod')).toBe('z.string()')
  })

  test('valibot returns expr unchanged', () => {
    expect(wrapSchemaForValidator('v.string()', 'valibot')).toBe('v.string()')
  })

  test('arktype returns expr unchanged', () => {
    expect(wrapSchemaForValidator("type('string')", 'arktype')).toBe("type('string')")
  })

  test('typebox wraps with Compile', () => {
    expect(wrapSchemaForValidator('Type.String()', 'typebox')).toBe('Compile(Type.String())')
  })

  test('effect wraps with standardSchemaV1', () => {
    expect(wrapSchemaForValidator('Schema.String', 'effect')).toBe(
      'standardSchemaV1(Schema.String)',
    )
  })
})

// ─── makeExternalDocsPart ───

describe('makeExternalDocsPart', () => {
  test('url only', () => {
    expect(makeExternalDocsPart({ url: 'https://example.com' })).toBe(
      'externalDocs:{url:"https://example.com"}',
    )
  })

  test('url and description', () => {
    expect(makeExternalDocsPart({ url: 'https://example.com', description: 'More info' })).toBe(
      'externalDocs:{url:"https://example.com",description:"More info"}',
    )
  })
})

// ─── makeServersPart ───

describe('makeServersPart', () => {
  test('single server with url only', () => {
    expect(makeServersPart([{ url: 'https://api.example.com' }])).toBe(
      'servers:[{url:"https://api.example.com"}]',
    )
  })

  test('server with description', () => {
    expect(makeServersPart([{ url: 'https://api.example.com', description: 'Production' }])).toBe(
      'servers:[{url:"https://api.example.com",description:"Production"}]',
    )
  })

  test('server with variables', () => {
    const result = makeServersPart([
      {
        url: 'https://{env}.example.com',
        variables: {
          env: { default: 'prod', enum: ['prod', 'staging'] },
        },
      },
    ])
    expect(result).toBe(
      'servers:[{url:"https://{env}.example.com",variables:{env:{enum:["prod","staging"],default:"prod"}}}]',
    )
  })

  test('multiple servers', () => {
    const result = makeServersPart([{ url: 'https://a.com' }, { url: 'https://b.com' }])
    expect(result).toBe('servers:[{url:"https://a.com"},{url:"https://b.com"}]')
  })
})

// ─── groupParametersByLocation ───

describe('groupParametersByLocation', () => {
  test('groups by location', () => {
    const params = [
      { name: 'id', in: 'path' as const, schema: { type: 'string' as const }, required: true },
      { name: 'q', in: 'query' as const, schema: { type: 'string' as const } },
    ]
    const result = groupParametersByLocation(params)
    expect(result).toStrictEqual({
      path: [{ name: 'id', schema: { type: 'string' }, required: true }],
      query: [{ name: 'q', schema: { type: 'string' }, required: false }],
    })
  })

  test('filters out $ref objects', () => {
    const params = [
      { $ref: '#/components/parameters/Foo' },
      { name: 'id', in: 'path' as const, schema: { type: 'string' as const }, required: true },
    ]
    const result = groupParametersByLocation(params)
    expect(result).toStrictEqual({
      path: [{ name: 'id', schema: { type: 'string' }, required: true }],
    })
  })

  test('empty params', () => {
    expect(groupParametersByLocation([])).toStrictEqual({})
  })
})

// ─── resolveSchema ───

describe('resolveSchema', () => {
  test('$ref schema - zod', () => {
    expect(resolveSchema({ $ref: '#/components/schemas/Pet' }, 'zod')).toBe('resolver(PetSchema)')
  })

  test('$ref schema - typebox wraps with Compile', () => {
    expect(resolveSchema({ $ref: '#/components/schemas/Pet' }, 'typebox')).toBe(
      'resolver(Compile(PetSchema))',
    )
  })

  test('$ref schema - effect wraps with standardSchemaV1', () => {
    expect(resolveSchema({ $ref: '#/components/schemas/Pet' }, 'effect')).toBe(
      'resolver(standardSchemaV1(PetSchema))',
    )
  })

  test('inline string schema - zod', () => {
    expect(resolveSchema({ type: 'string' }, 'zod')).toBe('resolver(z.string())')
  })

  test('inline string schema - valibot', () => {
    expect(resolveSchema({ type: 'string' }, 'valibot')).toBe('resolver(v.string())')
  })

  test('inline string schema - typebox', () => {
    expect(resolveSchema({ type: 'string' }, 'typebox')).toBe('resolver(Compile(Type.String()))')
  })

  test('inline string schema - arktype', () => {
    expect(resolveSchema({ type: 'string' }, 'arktype')).toBe("resolver(type('string'))")
  })

  test('inline string schema - effect', () => {
    expect(resolveSchema({ type: 'string' }, 'effect')).toBe(
      'resolver(standardSchemaV1(Schema.String))',
    )
  })
})

// ─── makeContent ───

describe('makeContent', () => {
  test('single media type with inline schema - zod', () => {
    const content = {
      'application/json': { schema: { type: 'string' as const } },
    }
    const result = makeContent(content, 'zod')
    expect(result).toStrictEqual(["'application/json':{schema:resolver(z.string())}"])
  })

  test('$ref schema', () => {
    const content = {
      'application/json': { schema: { $ref: '#/components/schemas/Pet' as const } },
    }
    const result = makeContent(content, 'zod')
    expect(result).toStrictEqual(["'application/json':{schema:resolver(PetSchema)}"])
  })

  test('filters out media without schema', () => {
    const content = {
      'application/json': { schema: { type: 'string' as const } },
      'text/plain': {},
    }
    const result = makeContent(content, 'zod')
    expect(result).toStrictEqual(["'application/json':{schema:resolver(z.string())}"])
  })

  test('wrapWithResolver option uses resolveSchema', () => {
    const content = {
      'application/json': { schema: { type: 'string' as const } },
    }
    const result = makeContent(content, 'typebox', { wrapWithResolver: true })
    expect(result).toStrictEqual(["'application/json':{schema:resolver(Compile(Type.String()))}"])
  })

  test('empty content', () => {
    expect(makeContent({}, 'zod')).toStrictEqual([])
  })
})

// ─── makeHeader ───

describe('makeHeader', () => {
  test('$ref header', () => {
    expect(makeHeader('X-Rate-Limit', { $ref: '#/components/headers/RateLimit' })).toBe(
      '"X-Rate-Limit":RateLimitHeaderSchema',
    )
  })

  test('inline header with description and schema', () => {
    const result = makeHeader('X-Custom', {
      description: 'Custom header',
      schema: { type: 'string' },
    })
    expect(result).toBe(
      '"X-Custom":{description:"Custom header",schema:{"type":"string"} as const}',
    )
  })

  test('inline header with required and deprecated', () => {
    const result = makeHeader('X-Required', {
      required: true,
      deprecated: true,
    })
    expect(result).toBe('"X-Required":{required:true,deprecated:true}')
  })

  test('inline header with no properties', () => {
    expect(makeHeader('X-Empty', {})).toBe('"X-Empty":{}')
  })
})

// ─── makeResponse ───

describe('makeResponse', () => {
  test('$ref response', () => {
    expect(makeResponse('200', { $ref: '#/components/responses/Success' }, 'zod')).toBe(
      '200:SuccessResponse',
    )
  })

  test('response with description only', () => {
    expect(makeResponse('204', { description: 'No content' }, 'zod')).toBe(
      '204:{description:"No content"}',
    )
  })

  test('response with content - zod', () => {
    const result = makeResponse(
      '200',
      {
        description: 'OK',
        content: { 'application/json': { schema: { type: 'string' } } },
      },
      'zod',
    )
    expect(result).toBe(
      '200:{description:"OK",content:{\'application/json\':{schema:resolver(z.string())}}}',
    )
  })

  test('response with content - typebox', () => {
    const result = makeResponse(
      '200',
      {
        description: 'OK',
        content: { 'application/json': { schema: { type: 'string' } } },
      },
      'typebox',
    )
    expect(result).toBe(
      '200:{description:"OK",content:{\'application/json\':{schema:resolver(Compile(Type.String()))}}}',
    )
  })

  test('response with headers', () => {
    const result = makeResponse(
      '200',
      {
        description: 'OK',
        headers: {
          'X-Rate-Limit': { description: 'Rate limit', schema: { type: 'integer' } },
        },
      },
      'zod',
    )
    expect(result).toBe(
      '200:{description:"OK",headers:{"X-Rate-Limit":{description:"Rate limit",schema:{"type":"integer"} as const}}}',
    )
  })

  test('response with $ref header', () => {
    const result = makeResponse(
      '200',
      {
        description: 'OK',
        headers: {
          'X-Rate-Limit': { $ref: '#/components/headers/RateLimit' },
        },
      },
      'zod',
    )
    expect(result).toBe('200:{description:"OK",headers:{"X-Rate-Limit":RateLimitHeaderSchema}}')
  })

  test('response with content and headers combined', () => {
    const result = makeResponse(
      '200',
      {
        description: 'OK',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Pet' } } },
        headers: { 'X-Total': { schema: { type: 'integer' } } },
      },
      'zod',
    )
    expect(result).toBe(
      '200:{description:"OK",content:{\'application/json\':{schema:resolver(PetSchema)}},headers:{"X-Total":{schema:{"type":"integer"} as const}}}',
    )
  })

  // --- inline schema with meta is registered with hono-openapi via .meta() ---
  // For $ref schemas, meta lives on the referenced component (e.g.,
  // `UserSchema.meta({...})`) and propagates through `resolver(UserSchema)`.
  // For inline schemas, the meta is encoded directly into the resolver arg
  // using each library's idiomatic form.

  test('inline schema with description: zod emits .meta in resolver()', () => {
    const result = makeResponse(
      '200',
      {
        description: 'OK',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              description: 'A user',
              properties: { id: { type: 'integer' } },
              required: ['id'],
            },
          },
        },
      },
      'zod',
    )
    expect(result).toBe(
      '200:{description:"OK",content:{\'application/json\':{schema:resolver(z.object({id:z.int()}).meta({description:"A user"}))}}}',
    )
  })

  test('inline schema with description+example: zod emits meta with examples array', () => {
    const result = makeResponse(
      '200',
      {
        description: 'OK',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              description: 'A user',
              example: { id: 1 },
              properties: { id: { type: 'integer' } },
              required: ['id'],
            },
          },
        },
      },
      'zod',
    )
    expect(result).toBe(
      '200:{description:"OK",content:{\'application/json\':{schema:resolver(z.object({id:z.int()}).meta({description:"A user",examples:[{id:1}]}))}}}',
    )
  })

  test('inline schema with meta: valibot wraps in v.pipe inside resolver()', () => {
    const result = makeResponse(
      '200',
      {
        description: 'OK',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              description: 'A user',
              properties: { id: { type: 'integer' } },
              required: ['id'],
            },
          },
        },
      },
      'valibot',
    )
    expect(result).toBe(
      '200:{description:"OK",content:{\'application/json\':{schema:resolver(v.pipe(v.object({id:v.pipe(v.number(),v.integer())}),v.description("A user")))}}}',
    )
  })

  test('inline schema with meta: typebox passes options as constructor arg inside Compile', () => {
    const result = makeResponse(
      '200',
      {
        description: 'OK',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              description: 'A user',
              properties: { id: { type: 'integer' } },
              required: ['id'],
            },
          },
        },
      },
      'typebox',
    )
    expect(result).toBe(
      '200:{description:"OK",content:{\'application/json\':{schema:resolver(Compile(Type.Object({id:Type.Integer()},{description:"A user"})))}}}',
    )
  })

  test('inline schema with meta: effect uses .annotations inside standardSchemaV1', () => {
    const result = makeResponse(
      '200',
      {
        description: 'OK',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              description: 'A user',
              properties: { id: { type: 'integer' } },
              required: ['id'],
            },
          },
        },
      },
      'effect',
    )
    expect(result).toBe(
      '200:{description:"OK",content:{\'application/json\':{schema:resolver(standardSchemaV1(Schema.Struct({id:Schema.Number.pipe(Schema.int())}).annotations({description:"A user"})))}}}',
    )
  })

  test('$ref response: meta is NOT duplicated at the resolver call site', () => {
    // The referenced component (PetSchema) carries its own meta; the response
    // here only needs a bare resolver(PetSchema). This documents that we do
    // not re-emit meta when the schema is a $ref.
    const result = makeResponse(
      '200',
      {
        description: 'OK',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Pet' } } },
      },
      'zod',
    )
    expect(result).toBe(
      '200:{description:"OK",content:{\'application/json\':{schema:resolver(PetSchema)}}}',
    )
  })
})
