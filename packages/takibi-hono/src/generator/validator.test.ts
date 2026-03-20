import { describe, expect, it } from 'vite-plus/test'

import type { Operation, Parameter } from '../openapi/index.js'
import { makeStandardValidators, makeValidators } from './validator.js'

describe('makeValidators', () => {
  it.concurrent('should generate query validator', () => {
    const operation: Operation = {
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer' } },
        { name: 'limit', in: 'query', required: true, schema: { type: 'integer' } },
      ],
      responses: { '200': { description: 'OK' } },
    }
    const result = makeValidators(operation, undefined, 'zod')
    expect(result).toStrictEqual([
      "validator('query',z.object({page:z.int().optional(),limit:z.int()}))",
    ])
  })

  it.concurrent('should generate param validator', () => {
    const operation: Operation = {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: { '200': { description: 'OK' } },
    }
    const result = makeValidators(operation, undefined, 'zod')
    expect(result).toStrictEqual(["validator('param',z.object({id:z.string()}))"])
  })

  it.concurrent('should generate json body validator with $ref', () => {
    const operation: Operation = {
      requestBody: {
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/CreateUser' },
          },
        },
      },
      responses: { '201': { description: 'Created' } },
    }
    const result = makeValidators(operation, undefined, 'zod')
    expect(result).toStrictEqual(["validator('json',CreateUserSchema)"])
  })

  it.concurrent('should handle valibot library', () => {
    const operation: Operation = {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: { '200': { description: 'OK' } },
    }
    const result = makeValidators(operation, undefined, 'valibot')
    expect(result).toStrictEqual(["validator('param',v.object({id:v.string()}))"])
  })

  it.concurrent('should merge path-level parameters', () => {
    const pathParams: readonly Parameter[] = [
      { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
    ]
    const operation: Operation = {
      responses: { '200': { description: 'OK' } },
    }
    const result = makeValidators(operation, pathParams, 'zod')
    expect(result).toStrictEqual(["validator('param',z.object({id:z.string()}))"])
  })

  it.concurrent('should skip unresolved $ref parameters', () => {
    const operation: Operation = {
      parameters: [
        { $ref: '#/components/parameters/PageParam' } as unknown as Parameter,
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
      ],
      responses: { '200': { description: 'OK' } },
    }
    const result = makeValidators(operation, undefined, 'zod')
    expect(result).toStrictEqual(["validator('param',z.object({id:z.string()}))"])
  })

  it.concurrent('should generate json body validator with allOf schema', () => {
    const operation: Operation = {
      requestBody: {
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
      responses: { '200': { description: 'OK' } },
    }
    const result = makeValidators(operation, undefined, 'zod')
    expect(result).toStrictEqual(["validator('json',z.intersection(BaseSchema,ExtraSchema))"])
  })
})

describe('makeStandardValidators', () => {
  it.concurrent('zod: uses sValidator (Standard Schema)', () => {
    const operation: Operation = {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: { '200': { description: 'OK' } },
    }
    const result = makeStandardValidators(operation, undefined, 'zod')
    expect(result).toStrictEqual(["sValidator('param',z.object({id:z.string()}))"])
  })

  it.concurrent('valibot: uses sValidator (Standard Schema)', () => {
    const operation: Operation = {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: { '200': { description: 'OK' } },
    }
    const result = makeStandardValidators(operation, undefined, 'valibot')
    expect(result).toStrictEqual(["sValidator('param',v.object({id:v.string()}))"])
  })

  it.concurrent('typebox: uses tbValidator', () => {
    const operation: Operation = {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: { '200': { description: 'OK' } },
    }
    const result = makeStandardValidators(operation, undefined, 'typebox')
    expect(result).toStrictEqual(["tbValidator('param',Type.Object({id:Type.String()}))"])
  })

  it.concurrent('arktype: uses sValidator', () => {
    const operation: Operation = {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: { '200': { description: 'OK' } },
    }
    const result = makeStandardValidators(operation, undefined, 'arktype')
    expect(result).toStrictEqual(["sValidator('param',type({id:type('string')}))"])
  })

  it.concurrent('effect: uses effectValidator', () => {
    const operation: Operation = {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: { '200': { description: 'OK' } },
    }
    const result = makeStandardValidators(operation, undefined, 'effect')
    expect(result).toStrictEqual(["effectValidator('param',Schema.Struct({id:Schema.String}))"])
  })

  it.concurrent('zod: query coercion for number', () => {
    const operation: Operation = {
      parameters: [{ name: 'limit', in: 'query', required: true, schema: { type: 'number' } }],
      responses: { '200': { description: 'OK' } },
    }
    const result = makeStandardValidators(operation, undefined, 'zod')
    expect(result).toStrictEqual(["sValidator('query',z.object({limit:z.coerce.number()}))"])
  })

  it.concurrent('zod: query coercion for integer', () => {
    const operation: Operation = {
      parameters: [{ name: 'page', in: 'query', required: true, schema: { type: 'integer' } }],
      responses: { '200': { description: 'OK' } },
    }
    const result = makeStandardValidators(operation, undefined, 'zod')
    expect(result).toStrictEqual([
      "sValidator('query',z.object({page:z.coerce.number().pipe(z.int())}))",
    ])
  })

  it.concurrent('zod: query coercion for boolean', () => {
    const operation: Operation = {
      parameters: [{ name: 'active', in: 'query', required: true, schema: { type: 'boolean' } }],
      responses: { '200': { description: 'OK' } },
    }
    const result = makeStandardValidators(operation, undefined, 'zod')
    expect(result).toStrictEqual(["sValidator('query',z.object({active:z.stringbool()}))"])
  })

  it.concurrent('zod: no coercion for query string type', () => {
    const operation: Operation = {
      parameters: [{ name: 'name', in: 'query', required: true, schema: { type: 'string' } }],
      responses: { '200': { description: 'OK' } },
    }
    const result = makeStandardValidators(operation, undefined, 'zod')
    expect(result).toStrictEqual(["sValidator('query',z.object({name:z.string()}))"])
  })

  it.concurrent('zod: no coercion for path integer', () => {
    const operation: Operation = {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
      responses: { '200': { description: 'OK' } },
    }
    const result = makeStandardValidators(operation, undefined, 'zod')
    expect(result).toStrictEqual(["sValidator('param',z.object({id:z.int()}))"])
  })

  it.concurrent('valibot: query coercion for number', () => {
    const operation: Operation = {
      parameters: [{ name: 'limit', in: 'query', required: true, schema: { type: 'number' } }],
      responses: { '200': { description: 'OK' } },
    }
    const result = makeStandardValidators(operation, undefined, 'valibot')
    expect(result).toStrictEqual([
      "sValidator('query',v.object({limit:v.pipe(v.string(),v.toNumber())}))",
    ])
  })

  it.concurrent('effect: query coercion for integer', () => {
    const operation: Operation = {
      parameters: [{ name: 'page', in: 'query', required: true, schema: { type: 'integer' } }],
      responses: { '200': { description: 'OK' } },
    }
    const result = makeStandardValidators(operation, undefined, 'effect')
    expect(result).toStrictEqual([
      "effectValidator('query',Schema.Struct({page:Schema.compose(Schema.NumberFromString,Schema.Int)}))",
    ])
  })

  it.concurrent('zod: json body uses sValidator', () => {
    const operation: Operation = {
      requestBody: {
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/CreateUser' },
          },
        },
      },
      responses: { '201': { description: 'Created' } },
    }
    const result = makeStandardValidators(operation, undefined, 'zod')
    expect(result).toStrictEqual(["sValidator('json',CreateUserSchema)"])
  })

  it.concurrent('zod: optional query with coercion', () => {
    const operation: Operation = {
      parameters: [{ name: 'limit', in: 'query', schema: { type: 'integer' } }],
      responses: { '200': { description: 'OK' } },
    }
    const result = makeStandardValidators(operation, undefined, 'zod')
    expect(result).toStrictEqual([
      "sValidator('query',z.object({limit:z.coerce.number().pipe(z.int()).optional()}))",
    ])
  })
})

describe('makeValidators - requestBody as $ref', () => {
  it.concurrent('should return empty body validators when requestBody is a $ref', () => {
    const operation: Operation = {
      requestBody: {
        $ref: '#/components/requestBodies/CreateUser',
      } as unknown as Operation['requestBody'],
      responses: { '201': { description: 'Created' } },
    }
    const result = makeValidators(operation, undefined, 'zod')
    expect(result).toStrictEqual([])
  })
})

describe('makeStandardValidators - requestBody as $ref', () => {
  it.concurrent('should return empty body validators when requestBody is a $ref', () => {
    const operation: Operation = {
      requestBody: {
        $ref: '#/components/requestBodies/CreateUser',
      } as unknown as Operation['requestBody'],
      responses: { '201': { description: 'Created' } },
    }
    const result = makeStandardValidators(operation, undefined, 'zod')
    expect(result).toStrictEqual([])
  })
})

describe('makeValidators - form content type', () => {
  it.concurrent('should use form target for application/x-www-form-urlencoded', () => {
    const operation: Operation = {
      requestBody: {
        content: {
          'application/x-www-form-urlencoded': {
            schema: {
              type: 'object',
              properties: { username: { type: 'string' }, password: { type: 'string' } },
              required: ['username', 'password'],
            },
          },
        },
      },
      responses: { '200': { description: 'OK' } },
    }
    const result = makeValidators(operation, undefined, 'zod')
    expect(result).toStrictEqual([
      "validator('form',z.object({username:z.string(),password:z.string()}))",
    ])
  })
})

describe('makeStandardValidators - form content type', () => {
  it.concurrent('should use form target for application/x-www-form-urlencoded', () => {
    const operation: Operation = {
      requestBody: {
        content: {
          'application/x-www-form-urlencoded': {
            schema: {
              type: 'object',
              properties: { email: { type: 'string' } },
              required: ['email'],
            },
          },
        },
      },
      responses: { '200': { description: 'OK' } },
    }
    const result = makeStandardValidators(operation, undefined, 'zod')
    expect(result).toStrictEqual(["sValidator('form',z.object({email:z.string()}))"])
  })
})

describe('makeValidators - no parameters and no requestBody', () => {
  it.concurrent('should return empty array', () => {
    const operation: Operation = {
      responses: { '200': { description: 'OK' } },
    }
    const result = makeValidators(operation, undefined, 'zod')
    expect(result).toStrictEqual([])
  })
})

describe('makeStandardValidators - no parameters and no requestBody', () => {
  it.concurrent('should return empty array', () => {
    const operation: Operation = {
      responses: { '200': { description: 'OK' } },
    }
    const result = makeStandardValidators(operation, undefined, 'zod')
    expect(result).toStrictEqual([])
  })
})
