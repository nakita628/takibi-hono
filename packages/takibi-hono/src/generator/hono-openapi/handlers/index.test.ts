import { describe, expect, it } from 'vite-plus/test'

import { collectOperations } from '../../../helper/operations.js'
import type { OpenAPI } from '../../../openapi/index.js'
import { makeHandlerCode } from './index.js'

const minimalOpenAPI = {
  openapi: '3.0.0',
  info: { title: 'Test', version: '1.0.0' },
  paths: {
    '/': {
      get: {
        responses: { '200': { description: 'OK' } },
      },
    },
    '/users': {
      get: {
        responses: {
          '200': {
            description: 'List users',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/User' } },
              },
            },
          },
        },
      },
      post: {
        requestBody: {
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateUser' },
            },
          },
        },
        responses: { '201': { description: 'Created' } },
      },
    },
    '/users/{id}': {
      get: {
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': {
            description: 'Get user',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' },
              },
            },
          },
        },
      },
    },
  },
} as unknown as OpenAPI

/**
 * OpenAPI spec with path-level parameters shared across operations.
 * Covers the pathItemParameters branch (line 23).
 */
const pathLevelParamsOpenAPI = {
  openapi: '3.0.0',
  info: { title: 'Test', version: '1.0.0' },
  paths: {
    '/items/{itemId}': {
      parameters: [{ name: 'itemId', in: 'path', required: true, schema: { type: 'string' } }],
      get: {
        responses: { '200': { description: 'Get item' } },
      },
      delete: {
        responses: { '204': { description: 'Deleted' } },
      },
    },
  },
} as unknown as OpenAPI

/**
 * Simple spec with only a root path for __root group name tests.
 */
const rootOnlyOpenAPI = {
  openapi: '3.0.0',
  info: { title: 'Test', version: '1.0.0' },
  paths: {
    '/': {
      get: {
        responses: { '200': { description: 'Root OK' } },
      },
      post: {
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { name: { type: 'string' } },
                required: ['name'],
              },
            },
          },
        },
        responses: { '201': { description: 'Created' } },
      },
    },
  },
} as unknown as OpenAPI

describe('collectOperations', () => {
  it.concurrent('should group operations by first path segment', () => {
    const groups = collectOperations(minimalOpenAPI)
    expect(groups.has('__root')).toBe(true)
    expect(groups.has('users')).toBe(true)
    expect(groups.get('__root')!.length).toBe(1)
    expect(groups.get('users')!.length).toBe(3)
  })
})

describe('makeHandlerCode', () => {
  it.concurrent('should generate sValidator for root by default', () => {
    const groups = collectOperations(minimalOpenAPI)
    const code = makeHandlerCode('__root', groups.get('__root')!, 'zod')
    expect(code).toBe(
      ["import{Hono}from'hono'", '', "export const rootHandler=new Hono().get('/',(c)=>{})"].join(
        '\n',
      ),
    )
  })

  it.concurrent('should generate sValidator for users group by default', () => {
    const groups = collectOperations(minimalOpenAPI)
    const code = makeHandlerCode('users', groups.get('users')!, 'zod')
    expect(code).toBe(
      [
        "import{Hono}from'hono'",
        "import{sValidator}from'@hono/standard-validator'",
        "import*as z from'zod'",
        "import{CreateUserSchema}from'../components'",
        '',
        "export const usersHandler=new Hono().get('/users',(c)=>{}).post('/users',sValidator('json',CreateUserSchema),(c)=>{}).get('/users/:id',sValidator('param',z.object({id:z.string()})),(c)=>{})",
      ].join('\n'),
    )
  })

  it.concurrent('should generate hono-openapi handler when openapi is true', () => {
    const groups = collectOperations(minimalOpenAPI)
    const code = makeHandlerCode('__root', groups.get('__root')!, 'zod', { openapi: true })
    expect(code).toBe(
      [
        "import{Hono}from'hono'",
        "import{describeRoute}from'hono-openapi'",
        '',
        'export const rootHandler=new Hono().get(\'/\',describeRoute({responses:{200:{description:"OK"}}}),(c)=>{})',
      ].join('\n'),
    )
  })

  it.concurrent('should generate hono-openapi for users group with openapi true', () => {
    const groups = collectOperations(minimalOpenAPI)
    const code = makeHandlerCode('users', groups.get('users')!, 'zod', { openapi: true })
    expect(code).toBe(
      [
        "import{Hono}from'hono'",
        "import{describeRoute,resolver,validator}from'hono-openapi'",
        "import*as z from'zod'",
        "import{CreateUserSchema,UserSchema}from'../components'",
        '',
        "export const usersHandler=new Hono().get('/users',describeRoute({responses:{200:{description:\"List users\",content:{'application/json':{schema:resolver(z.array(UserSchema))}}}}}),(c)=>{}).post('/users',describeRoute({responses:{201:{description:\"Created\"}}}),validator('json',CreateUserSchema),(c)=>{}).get('/users/:id',describeRoute({responses:{200:{description:\"Get user\",content:{'application/json':{schema:resolver(UserSchema)}}}}}),validator('param',z.object({id:z.string()})),(c)=>{})",
      ].join('\n'),
    )
  })

  it.concurrent('should use custom componentPaths with openapi true', () => {
    const groups = collectOperations(minimalOpenAPI)
    const code = makeHandlerCode('users', groups.get('users')!, 'zod', {
      componentPaths: { schemas: '../../shared/schemas' },
      openapi: true,
    })
    expect(code).toBe(
      [
        "import{Hono}from'hono'",
        "import{describeRoute,resolver,validator}from'hono-openapi'",
        "import*as z from'zod'",
        "import{CreateUserSchema,UserSchema}from'../../shared/schemas'",
        '',
        "export const usersHandler=new Hono().get('/users',describeRoute({responses:{200:{description:\"List users\",content:{'application/json':{schema:resolver(z.array(UserSchema))}}}}}),(c)=>{}).post('/users',describeRoute({responses:{201:{description:\"Created\"}}}),validator('json',CreateUserSchema),(c)=>{}).get('/users/:id',describeRoute({responses:{200:{description:\"Get user\",content:{'application/json':{schema:resolver(UserSchema)}}}}}),validator('param',z.object({id:z.string()})),(c)=>{})",
      ].join('\n'),
    )
  })

  it.concurrent('should handle valibot with openapi true', () => {
    const groups = collectOperations(minimalOpenAPI)
    const code = makeHandlerCode('__root', groups.get('__root')!, 'valibot', { openapi: true })
    expect(code).toBe(
      [
        "import{Hono}from'hono'",
        "import{describeRoute}from'hono-openapi'",
        '',
        'export const rootHandler=new Hono().get(\'/\',describeRoute({responses:{200:{description:"OK"}}}),(c)=>{})',
      ].join('\n'),
    )
  })
})

describe('collectOperations — exact map entries', () => {
  it.concurrent('should produce exact grouping with __root and users keys', () => {
    const groups = collectOperations(minimalOpenAPI)
    const keys = [...groups.keys()]
    expect(keys).toStrictEqual(['__root', 'users'])
  })

  it.concurrent('should produce exact __root operations', () => {
    const groups = collectOperations(minimalOpenAPI)
    const rootOps = groups.get('__root')!
    expect(rootOps.length).toBe(1)
    expect(rootOps[0].method).toBe('get')
    expect(rootOps[0].path).toBe('/')
    expect(rootOps[0].pathItemParameters).toBe(undefined)
  })

  it.concurrent('should produce exact users operations in order', () => {
    const groups = collectOperations(minimalOpenAPI)
    const usersOps = groups.get('users')!
    expect(usersOps.length).toBe(3)
    expect(usersOps.map((o) => `${o.method} ${o.path}`)).toStrictEqual([
      'get /users',
      'post /users',
      'get /users/{id}',
    ])
  })

  it.concurrent('should set pathItemParameters from path-level parameters', () => {
    const groups = collectOperations(pathLevelParamsOpenAPI)
    const keys = [...groups.keys()]
    expect(keys).toStrictEqual(['items'])
    const ops = groups.get('items')!
    expect(ops.length).toBe(2)
    expect(ops[0].method).toBe('get')
    expect(ops[0].path).toBe('/items/{itemId}')
    expect(ops[0].pathItemParameters).toStrictEqual([
      { name: 'itemId', in: 'path', required: true, schema: { type: 'string' } },
    ])
    expect(ops[1].method).toBe('delete')
    expect(ops[1].pathItemParameters).toStrictEqual(ops[0].pathItemParameters)
  })
})

describe('makeHandlerCode — __root group name', () => {
  it.concurrent('should produce rootHandler name for __root with multiple operations', () => {
    const groups = collectOperations(rootOnlyOpenAPI)
    const code = makeHandlerCode('__root', groups.get('__root')!, 'zod')
    expect(code).toBe(
      [
        "import{Hono}from'hono'",
        "import{sValidator}from'@hono/standard-validator'",
        "import*as z from'zod'",
        '',
        "export const rootHandler=new Hono().get('/',(c)=>{}).post('/',sValidator('json',z.object({name:z.string()})),(c)=>{})",
      ].join('\n'),
    )
  })

  it.concurrent('should produce rootHandler name for __root with openapi true', () => {
    const groups = collectOperations(rootOnlyOpenAPI)
    const code = makeHandlerCode('__root', groups.get('__root')!, 'zod', { openapi: true })
    expect(code).toBe(
      [
        "import{Hono}from'hono'",
        "import{describeRoute,validator}from'hono-openapi'",
        "import*as z from'zod'",
        '',
        "export const rootHandler=new Hono().get('/',describeRoute({responses:{200:{description:\"Root OK\"}}}),(c)=>{}).post('/',describeRoute({responses:{201:{description:\"Created\"}}}),validator('json',z.object({name:z.string()})),(c)=>{})",
      ].join('\n'),
    )
  })
})

describe('makeHandlerCode — openapi true for all 5 schema libraries', () => {
  it.concurrent('should generate zod openapi handler for users group', () => {
    const groups = collectOperations(minimalOpenAPI)
    const code = makeHandlerCode('users', groups.get('users')!, 'zod', { openapi: true })
    expect(code).toBe(
      [
        "import{Hono}from'hono'",
        "import{describeRoute,resolver,validator}from'hono-openapi'",
        "import*as z from'zod'",
        "import{CreateUserSchema,UserSchema}from'../components'",
        '',
        "export const usersHandler=new Hono().get('/users',describeRoute({responses:{200:{description:\"List users\",content:{'application/json':{schema:resolver(z.array(UserSchema))}}}}}),(c)=>{}).post('/users',describeRoute({responses:{201:{description:\"Created\"}}}),validator('json',CreateUserSchema),(c)=>{}).get('/users/:id',describeRoute({responses:{200:{description:\"Get user\",content:{'application/json':{schema:resolver(UserSchema)}}}}}),validator('param',z.object({id:z.string()})),(c)=>{})",
      ].join('\n'),
    )
  })

  it.concurrent('should generate valibot openapi handler for users group', () => {
    const groups = collectOperations(minimalOpenAPI)
    const code = makeHandlerCode('users', groups.get('users')!, 'valibot', { openapi: true })
    expect(code).toBe(
      [
        "import{Hono}from'hono'",
        "import{describeRoute,resolver,validator}from'hono-openapi'",
        "import*as v from'valibot'",
        "import{CreateUserSchema,UserSchema}from'../components'",
        '',
        "export const usersHandler=new Hono().get('/users',describeRoute({responses:{200:{description:\"List users\",content:{'application/json':{schema:resolver(v.array(UserSchema))}}}}}),(c)=>{}).post('/users',describeRoute({responses:{201:{description:\"Created\"}}}),validator('json',CreateUserSchema),(c)=>{}).get('/users/:id',describeRoute({responses:{200:{description:\"Get user\",content:{'application/json':{schema:resolver(UserSchema)}}}}}),validator('param',v.object({id:v.string()})),(c)=>{})",
      ].join('\n'),
    )
  })

  it.concurrent('should generate typebox openapi handler for users group', () => {
    const groups = collectOperations(minimalOpenAPI)
    const code = makeHandlerCode('users', groups.get('users')!, 'typebox', { openapi: true })
    expect(code).toBe(
      [
        "import{Hono}from'hono'",
        "import{describeRoute,resolver,validator}from'hono-openapi'",
        "import Type from'typebox'",
        "import{Compile}from'typebox/compile'",
        "import{CreateUserSchema,UserSchema}from'../components'",
        '',
        "export const usersHandler=new Hono().get('/users',describeRoute({responses:{200:{description:\"List users\",content:{'application/json':{schema:resolver(Compile(Type.Array(UserSchema)))}}}}}),(c)=>{}).post('/users',describeRoute({responses:{201:{description:\"Created\"}}}),validator('json',Compile(CreateUserSchema)),(c)=>{}).get('/users/:id',describeRoute({responses:{200:{description:\"Get user\",content:{'application/json':{schema:resolver(Compile(UserSchema))}}}}}),validator('param',Compile(Type.Object({id:Type.String()}))),(c)=>{})",
      ].join('\n'),
    )
  })

  it.concurrent('should generate arktype openapi handler for users group', () => {
    const groups = collectOperations(minimalOpenAPI)
    const code = makeHandlerCode('users', groups.get('users')!, 'arktype', { openapi: true })
    expect(code).toBe(
      [
        "import{Hono}from'hono'",
        "import{describeRoute,resolver,validator}from'hono-openapi'",
        "import{type}from'arktype'",
        "import{CreateUserSchema,UserSchema}from'../components'",
        '',
        "export const usersHandler=new Hono().get('/users',describeRoute({responses:{200:{description:\"List users\",content:{'application/json':{schema:resolver(UserSchema.array())}}}}}),(c)=>{}).post('/users',describeRoute({responses:{201:{description:\"Created\"}}}),validator('json',CreateUserSchema),(c)=>{}).get('/users/:id',describeRoute({responses:{200:{description:\"Get user\",content:{'application/json':{schema:resolver(UserSchema)}}}}}),validator('param',type({id:type('string')})),(c)=>{})",
      ].join('\n'),
    )
  })

  it.concurrent('should generate effect openapi handler for users group', () => {
    const groups = collectOperations(minimalOpenAPI)
    const code = makeHandlerCode('users', groups.get('users')!, 'effect', { openapi: true })
    expect(code).toBe(
      [
        "import{Hono}from'hono'",
        "import{describeRoute,resolver,validator}from'hono-openapi'",
        "import{Schema}from'effect'",
        "import{standardSchemaV1}from'effect/Schema'",
        "import{CreateUserSchema,UserSchema}from'../components'",
        '',
        "export const usersHandler=new Hono().get('/users',describeRoute({responses:{200:{description:\"List users\",content:{'application/json':{schema:resolver(standardSchemaV1(Schema.Array(UserSchema)))}}}}}),(c)=>{}).post('/users',describeRoute({responses:{201:{description:\"Created\"}}}),validator('json',standardSchemaV1(CreateUserSchema)),(c)=>{}).get('/users/:id',describeRoute({responses:{200:{description:\"Get user\",content:{'application/json':{schema:resolver(standardSchemaV1(UserSchema))}}}}}),validator('param',standardSchemaV1(Schema.Struct({id:Schema.String}))),(c)=>{})",
      ].join('\n'),
    )
  })
})

describe('makeHandlerCode — path-level parameters', () => {
  it.concurrent('should include pathItemParameters in standard validators for all operations', () => {
    const groups = collectOperations(pathLevelParamsOpenAPI)
    const code = makeHandlerCode('items', groups.get('items')!, 'zod')
    expect(code).toBe(
      [
        "import{Hono}from'hono'",
        "import{sValidator}from'@hono/standard-validator'",
        "import*as z from'zod'",
        '',
        "export const itemsHandler=new Hono().get('/items/:itemId',sValidator('param',z.object({itemId:z.string()})),(c)=>{}).delete('/items/:itemId',sValidator('param',z.object({itemId:z.string()})),(c)=>{})",
      ].join('\n'),
    )
  })

  it.concurrent('should include pathItemParameters in openapi validators for all operations', () => {
    const groups = collectOperations(pathLevelParamsOpenAPI)
    const code = makeHandlerCode('items', groups.get('items')!, 'zod', { openapi: true })
    expect(code).toBe(
      [
        "import{Hono}from'hono'",
        "import{describeRoute,validator}from'hono-openapi'",
        "import*as z from'zod'",
        '',
        "export const itemsHandler=new Hono().get('/items/:itemId',describeRoute({responses:{200:{description:\"Get item\"}}}),validator('param',z.object({itemId:z.string()})),(c)=>{}).delete('/items/:itemId',describeRoute({responses:{204:{description:\"Deleted\"}}}),validator('param',z.object({itemId:z.string()})),(c)=>{})",
      ].join('\n'),
    )
  })
})

describe('makeHandlerCode — custom componentPaths', () => {
  it.concurrent('should use custom componentPaths in standard mode', () => {
    const groups = collectOperations(minimalOpenAPI)
    const code = makeHandlerCode('users', groups.get('users')!, 'zod', {
      componentPaths: { schemas: '@/schemas' },
    })
    expect(code).toBe(
      [
        "import{Hono}from'hono'",
        "import{sValidator}from'@hono/standard-validator'",
        "import*as z from'zod'",
        "import{CreateUserSchema}from'@/schemas'",
        '',
        "export const usersHandler=new Hono().get('/users',(c)=>{}).post('/users',sValidator('json',CreateUserSchema),(c)=>{}).get('/users/:id',sValidator('param',z.object({id:z.string()})),(c)=>{})",
      ].join('\n'),
    )
  })

  it.concurrent('should use custom componentPaths in openapi mode', () => {
    const groups = collectOperations(minimalOpenAPI)
    const code = makeHandlerCode('users', groups.get('users')!, 'valibot', {
      componentPaths: { schemas: '../../shared/schemas' },
      openapi: true,
    })
    expect(code).toBe(
      [
        "import{Hono}from'hono'",
        "import{describeRoute,resolver,validator}from'hono-openapi'",
        "import*as v from'valibot'",
        "import{CreateUserSchema,UserSchema}from'../../shared/schemas'",
        '',
        "export const usersHandler=new Hono().get('/users',describeRoute({responses:{200:{description:\"List users\",content:{'application/json':{schema:resolver(v.array(UserSchema))}}}}}),(c)=>{}).post('/users',describeRoute({responses:{201:{description:\"Created\"}}}),validator('json',CreateUserSchema),(c)=>{}).get('/users/:id',describeRoute({responses:{200:{description:\"Get user\",content:{'application/json':{schema:resolver(UserSchema)}}}}}),validator('param',v.object({id:v.string()})),(c)=>{})",
      ].join('\n'),
    )
  })
})

describe('makeHandlerCode — single handler (no split) with multiple operations', () => {
  it.concurrent('should generate a single handler with all operations from one group', () => {
    const groups = collectOperations(rootOnlyOpenAPI)
    const rootOps = groups.get('__root')!
    expect(rootOps.length).toBe(2)
    const code = makeHandlerCode('__root', rootOps, 'valibot')
    expect(code).toBe(
      [
        "import{Hono}from'hono'",
        "import{sValidator}from'@hono/standard-validator'",
        "import*as v from'valibot'",
        '',
        "export const rootHandler=new Hono().get('/',(c)=>{}).post('/',sValidator('json',v.object({name:v.string()})),(c)=>{})",
      ].join('\n'),
    )
  })

  it.concurrent('should generate a single handler with multiple operations for non-root group', () => {
    const groups = collectOperations(minimalOpenAPI)
    const usersOps = groups.get('users')!
    expect(usersOps.length).toBe(3)
    const code = makeHandlerCode('users', usersOps, 'typebox')
    expect(code).toBe(
      [
        "import{Hono}from'hono'",
        "import{tbValidator}from'@hono/typebox-validator'",
        "import{validator}from'hono/validator'",
        "import{Value}from'typebox/value'",
        "import Type from'typebox'",
        "import{CreateUserSchema}from'../components'",
        '',
        "export const usersHandler=new Hono().get('/users',(c)=>{}).post('/users',tbValidator('json',CreateUserSchema),(c)=>{}).get('/users/:id',validator('param',(_v,_c)=>{const _s=Type.Object({id:Type.String()});const _x=Value.Convert(_s,_v);return Value.Check(_s,_x)?_x:_c.json({success:false,errors:[...Value.Errors(_s,_x)]},400)}),(c)=>{})",
      ].join('\n'),
    )
  })
})
