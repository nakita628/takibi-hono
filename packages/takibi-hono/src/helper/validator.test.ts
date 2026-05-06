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

  it.concurrent('typebox: path string uses inline validator + Value.Convert', () => {
    // String values still go through Value.Convert (no-op for strings) so the
    // path passes through unchanged. The reason we wrap even string params in
    // path/query is to keep the typebox validation strategy uniform.
    const operation: Operation = {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: { '200': { description: 'OK' } },
    }
    const result = makeStandardValidators(operation, undefined, 'typebox')
    expect(result).toStrictEqual([
      "validator('param',(_v,_c)=>{const _s=Type.Object({id:Type.String()});const _x=Value.Convert(_s,_v);return Value.Check(_s,_x)?_x:_c.json({success:false,errors:[...Value.Errors(_s,_x)]},400)})",
    ])
  })

  it.concurrent('typebox: json body still uses tbValidator (no Convert needed)', () => {
    const operation: Operation = {
      requestBody: {
        content: {
          'application/json': { schema: { $ref: '#/components/schemas/CreateUser' } },
        },
      },
      responses: { '201': { description: 'Created' } },
    }
    const result = makeStandardValidators(operation, undefined, 'typebox')
    expect(result).toStrictEqual(["tbValidator('json',CreateUserSchema)"])
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

  it.concurrent('zod: path integer is coerced (string-on-wire)', () => {
    const operation: Operation = {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
      responses: { '200': { description: 'OK' } },
    }
    const result = makeStandardValidators(operation, undefined, 'zod')
    expect(result).toStrictEqual([
      "sValidator('param',z.object({id:z.coerce.number().pipe(z.int())}))",
    ])
  })

  it.concurrent('zod: path number is coerced', () => {
    const operation: Operation = {
      parameters: [{ name: 'value', in: 'path', required: true, schema: { type: 'number' } }],
      responses: { '200': { description: 'OK' } },
    }
    const result = makeStandardValidators(operation, undefined, 'zod')
    expect(result).toStrictEqual(["sValidator('param',z.object({value:z.coerce.number()}))"])
  })

  it.concurrent('zod: path boolean uses stringbool', () => {
    const operation: Operation = {
      parameters: [{ name: 'flag', in: 'path', required: true, schema: { type: 'boolean' } }],
      responses: { '200': { description: 'OK' } },
    }
    const result = makeStandardValidators(operation, undefined, 'zod')
    expect(result).toStrictEqual(["sValidator('param',z.object({flag:z.stringbool()}))"])
  })

  it.concurrent('valibot: path integer is coerced', () => {
    const operation: Operation = {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
      responses: { '200': { description: 'OK' } },
    }
    const result = makeStandardValidators(operation, undefined, 'valibot')
    expect(result).toStrictEqual([
      "sValidator('param',v.object({id:v.pipe(v.string(),v.toNumber(),v.integer())}))",
    ])
  })

  it.concurrent('typebox: path integer uses inline validator + Value.Convert', () => {
    // tbValidator only runs Compile().Check() and ignores Type.Decode transforms,
    // so for typebox path/query we emit an inline validator wrapping
    // Value.Convert + Value.Check. The schema becomes plain Type.Integer().
    const operation: Operation = {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
      responses: { '200': { description: 'OK' } },
    }
    const result = makeStandardValidators(operation, undefined, 'typebox')
    expect(result).toStrictEqual([
      "validator('param',(_v,_c)=>{const _s=Type.Object({id:Type.Integer()});const _x=Value.Convert(_s,_v);return Value.Check(_s,_x)?_x:_c.json({success:false,errors:[...Value.Errors(_s,_x)]},400)})",
    ])
  })

  it.concurrent('typebox: query boolean uses inline validator + Type.Boolean', () => {
    const operation: Operation = {
      parameters: [{ name: 'flag', in: 'query', required: true, schema: { type: 'boolean' } }],
      responses: { '200': { description: 'OK' } },
    }
    const result = makeStandardValidators(operation, undefined, 'typebox')
    expect(result).toStrictEqual([
      "validator('query',(_v,_c)=>{const _s=Type.Object({flag:Type.Boolean()});const _x=Value.Convert(_s,_v);return Value.Check(_s,_x)?_x:_c.json({success:false,errors:[...Value.Errors(_s,_x)]},400)})",
    ])
  })

  it.concurrent('arktype: path integer is coerced', () => {
    const operation: Operation = {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
      responses: { '200': { description: 'OK' } },
    }
    const result = makeStandardValidators(operation, undefined, 'arktype')
    expect(result).toStrictEqual([
      "sValidator('param',type({id:type('string.integer.parse')}))",
    ])
  })

  it.concurrent('effect: path integer is coerced', () => {
    const operation: Operation = {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
      responses: { '200': { description: 'OK' } },
    }
    const result = makeStandardValidators(operation, undefined, 'effect')
    expect(result).toStrictEqual([
      "effectValidator('param',Schema.Struct({id:Schema.compose(Schema.NumberFromString,Schema.Int)}))",
    ])
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
