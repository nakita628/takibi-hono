import { describe, expect, it } from 'vite-plus/test'

import { makeAppCode, makeHandlerCode, toGroupName, toHandlerVarName } from './handler.js'

const components = {
  parameters: { Limit: { name: 'limit', in: 'query', schema: { type: 'integer' } } },
  requestBodies: {
    NewPet: { content: { 'application/json': { schema: { $ref: '#/components/schemas/Pet' } } } },
  },
}

const petRoutes = [
  {
    method: 'get',
    path: '/pets/:id',
    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
    operation: {
      tags: ['pets'],
      operationId: true,
      'x-internal': true,
      parameters: [{ $ref: '#/components/parameters/Limit' }],
      responses: {
        '200': {
          description: 'ok',
          headers: { 'X-Rate': { schema: { type: 'integer' } } },
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Pet' } } },
        },
        '404': { $ref: '#/components/responses/NotFound' },
      },
    },
  },
  {
    method: 'post',
    path: '/pets',
    parameters: [],
    operation: {
      requestBody: { $ref: '#/components/requestBodies/NewPet' },
      responses: { '201': { description: 'created' } },
    },
  },
  { method: 'head', path: '/pets', parameters: [], operation: { responses: {} } },
]

const petImports = [
  { name: 'PetSchema', from: '../components' },
  { name: 'NotFoundResponse', from: '../components' },
]

const itemRoute = {
  method: 'put',
  path: '/items/:id',
  parameters: [],
  operation: {
    parameters: [
      { name: 'id', in: 'path', schema: { type: 'string' } },
      { name: 'q', in: 'query', schema: { type: 'integer' } },
    ],
    requestBody: {
      content: {
        'application/xml': { schema: { type: 'string' } },
        'application/merge-patch+json': { schema: { type: 'object' } },
        'application/json': { schema: { $ref: '#/components/schemas/Item' } },
        'multipart/form-data': {
          schema: { type: 'object', properties: { file: { type: 'string' } } },
        },
      },
    },
    responses: {},
  },
}

describe('makeHandlerCode', () => {
  it('builds describeRoute from the operation and validators from its parameters and body', () => {
    expect(
      makeHandlerCode('petsHandler', petRoutes as never, {
        lib: 'zod',
        openapi: true,
        components: components as never,
        responseRefs: true,
        imports: petImports,
      }),
    ).toBe(`import{Hono}from'hono'
import{describeRoute,resolver,validator}from'hono-openapi'
import*as z from'zod'
import{PetSchema,NotFoundResponse}from'../components'

export const petsHandler=new Hono().get('/pets/:id',describeRoute({tags:["pets"],operationId:"true",responses:{"200":{description:"ok",headers:{"X-Rate":{schema:{type:"integer"}}},content:{"application/json":{schema:resolver(PetSchema)}}},"404":NotFoundResponse}}),validator('param',z.object({id:z.coerce.number().int()})),validator('query',z.object({limit:z.coerce.number().int().exactOptional()})),(c)=>{}).post('/pets',describeRoute({responses:{"201":{description:"created"}}}),validator('json',PetSchema),(c)=>{}).on('HEAD','/pets',describeRoute({responses:{}}),(c)=>{})`)
  })

  it('keeps a response $ref as a Reference Object when the responses module is not generated', () => {
    expect(
      makeHandlerCode('petsHandler', petRoutes.slice(0, 1) as never, {
        lib: 'zod',
        openapi: true,
        components: components as never,
        responseRefs: false,
        imports: petImports,
      }),
    ).toBe(`import{Hono}from'hono'
import{describeRoute,resolver,validator}from'hono-openapi'
import*as z from'zod'
import{PetSchema}from'../components'

export const petsHandler=new Hono().get('/pets/:id',describeRoute({tags:["pets"],operationId:"true",responses:{"200":{description:"ok",headers:{"X-Rate":{schema:{type:"integer"}}},content:{"application/json":{schema:resolver(PetSchema)}}},"404":{$ref:"#/components/responses/NotFound"}}}),validator('param',z.object({id:z.coerce.number().int()})),validator('query',z.object({limit:z.coerce.number().int().exactOptional()})),(c)=>{})`)
  })

  it.each([
    [
      'zod',
      `import{Hono}from'hono'
import{sValidator}from'@hono/standard-validator'
import*as z from'zod'
import{ItemSchema}from'../components'

export const itemsHandler=new Hono().put('/items/:id',sValidator('param',z.object({id:z.string()})),sValidator('query',z.object({q:z.coerce.number().int().exactOptional()})),sValidator('json',ItemSchema),sValidator('form',z.object({file:z.string().exactOptional()})),(c)=>{})`,
    ],
    [
      'valibot',
      `import{Hono}from'hono'
import{sValidator}from'@hono/standard-validator'
import*as v from'valibot'
import{ItemSchema}from'../components'

export const itemsHandler=new Hono().put('/items/:id',sValidator('param',v.object({id:v.string()})),sValidator('query',v.partial(v.object({q:v.pipe(v.string(),v.transform(Number),v.number(),v.safeInteger())}))),sValidator('json',ItemSchema),sValidator('form',v.partial(v.object({file:v.string()}))),(c)=>{})`,
    ],
    [
      'typebox',
      `import{Hono}from'hono'
import{tbValidator}from'@hono/typebox-validator'
import{Type,Codec}from'typebox'
import{ItemSchema}from'../components'

export const itemsHandler=new Hono().put('/items/:id',tbValidator('param',Type.Object({id:Type.String()})),tbValidator('query',Type.Object({q:Type.Optional(Codec(Type.String()).Decode((value)=>Number.parseInt(value,10)).Encode((value)=>String(value)))})),tbValidator('json',ItemSchema),tbValidator('form',Type.Object({file:Type.Optional(Type.String())})),(c)=>{})`,
    ],
    [
      'arktype',
      `import{Hono}from'hono'
import{sValidator}from'@hono/standard-validator'
import{type}from'arktype'
import{ItemSchema}from'../components'

export const itemsHandler=new Hono().put('/items/:id',sValidator('param',type({id:"string"})),sValidator('query',type({"q?":type("string").pipe((data, ctx) => { const value = Number(data); return Number.isSafeInteger(value) ? value : ctx.error("an integer") })})),sValidator('json',ItemSchema),sValidator('form',type({"file?":"string"})),(c)=>{})`,
    ],
    [
      'effect',
      `import{Hono}from'hono'
import{sValidator}from'@hono/standard-validator'
import{Schema}from'effect'
import{ItemSchema}from'../components'

export const itemsHandler=new Hono().put('/items/:id',sValidator('param',Schema.toStandardSchemaV1(Schema.Struct({id:Schema.String}))),sValidator('query',Schema.toStandardSchemaV1(Schema.Struct({q:Schema.optional(Schema.FiniteFromString.check(Schema.isInt()))}))),sValidator('json',Schema.toStandardSchemaV1(ItemSchema)),sValidator('form',Schema.toStandardSchemaV1(Schema.Struct({file:Schema.optional(Schema.String)}))),(c)=>{})`,
    ],
  ] as const)('%s without hono-openapi: plain validator middleware', (lib, expected) => {
    expect(
      makeHandlerCode('itemsHandler', [itemRoute] as never, {
        lib,
        openapi: false,
        components: undefined,
        responseRefs: false,
        imports: [{ name: 'ItemSchema', from: '../components' }],
      }),
    ).toBe(expected)
  })

  it('coerces header, cookie and form body values from text', () => {
    const route = {
      method: 'post',
      path: '/uploads',
      parameters: [],
      operation: {
        parameters: [
          { name: 'x-count', in: 'header', schema: { type: 'integer' } },
          { name: 'debug', in: 'cookie', schema: { type: 'boolean' } },
        ],
        requestBody: {
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  size: { type: 'integer' },
                  file: { type: 'string', format: 'binary' },
                },
              },
            },
          },
        },
        responses: {},
      },
    }
    expect(
      makeHandlerCode('uploadsHandler', [route] as never, {
        lib: 'zod',
        openapi: false,
        components: undefined,
        responseRefs: false,
        imports: [],
      }),
    ).toBe(`import{Hono}from'hono'
import{sValidator}from'@hono/standard-validator'
import*as z from'zod'

export const uploadsHandler=new Hono().post('/uploads',sValidator('header',z.object({"x-count":z.coerce.number().int().exactOptional()})),sValidator('cookie',z.object({debug:z.stringbool().exactOptional()})),sValidator('form',z.object({size:z.coerce.number().int().exactOptional(),file:z.file().exactOptional()})),(c)=>{})`)
  })

  it('expands a referenced component that reads differently from text', () => {
    const schemaComponents = {
      schemas: {
        Count: { type: 'integer', minimum: 0 },
        Tag: { type: 'string', enum: ['dog', 'cat'] },
        Upload: { type: 'object', properties: { size: { $ref: '#/components/schemas/Count' } } },
        Node: { type: 'object', properties: { next: { $ref: '#/components/schemas/Node' } } },
      },
    }
    const route = {
      method: 'post',
      path: '/uploads',
      parameters: [],
      operation: {
        parameters: [
          { name: 'count', in: 'query', schema: { $ref: '#/components/schemas/Count' } },
          { name: 'tag', in: 'query', schema: { $ref: '#/components/schemas/Tag' } },
          { name: 'node', in: 'cookie', schema: { $ref: '#/components/schemas/Node' } },
        ],
        requestBody: {
          content: {
            'multipart/form-data': { schema: { $ref: '#/components/schemas/Upload' } },
          },
        },
        responses: {},
      },
    }
    expect(
      makeHandlerCode('uploadsHandler', [route] as never, {
        lib: 'zod',
        openapi: false,
        components: schemaComponents as never,
        responseRefs: false,
        imports: [
          { name: 'TagSchema', from: '../components' },
          { name: 'NodeSchema', from: '../components' },
        ],
      }),
    ).toBe(`import{Hono}from'hono'
import{sValidator}from'@hono/standard-validator'
import*as z from'zod'
import{TagSchema,NodeSchema}from'../components'

export const uploadsHandler=new Hono().post('/uploads',sValidator('query',z.object({count:z.coerce.number().int().min(0).exactOptional(),tag:TagSchema.exactOptional()})),sValidator('cookie',z.object({node:NodeSchema.exactOptional()})),sValidator('form',z.object({size:z.coerce.number().int().min(0).exactOptional()})),(c)=>{})`)
  })

  it('reads a header parameter under its lowercased name, as Hono hands it over', () => {
    const route = {
      method: 'get',
      path: '/limits',
      parameters: [{ name: 'X-Rate-Limit', in: 'header', schema: { type: 'integer' } }],
      operation: {
        // The operation-level parameter overrides the Path Item's, whatever the case.
        parameters: [
          { name: 'x-rate-limit', in: 'header', required: true, schema: { type: 'integer' } },
          { name: 'X-Request-Id', in: 'header', required: true, schema: { type: 'string' } },
        ],
        responses: {},
      },
    }
    expect(
      makeHandlerCode('limitsHandler', [route] as never, {
        lib: 'zod',
        openapi: false,
        components: undefined,
        responseRefs: false,
        imports: [],
      }),
    ).toBe(`import{Hono}from'hono'
import{sValidator}from'@hono/standard-validator'
import*as z from'zod'

export const limitsHandler=new Hono().get('/limits',sValidator('header',z.object({"x-rate-limit":z.coerce.number().int(),"x-request-id":z.string()})),(c)=>{})`)
  })

  it.each([
    ['typebox', `validator('json',Compile(ItemSchema))`, 'resolver(Compile(ItemSchema))'],
    [
      'effect',
      `validator('json',Schema.toStandardSchemaV1(ItemSchema))`,
      'resolver(Schema.toStandardSchemaV1(ItemSchema))',
    ],
  ] as const)(
    '%s with hono-openapi: bridges schemas to Standard Schema',
    (lib, validator, resolver) => {
      const route = {
        ...itemRoute,
        operation: {
          requestBody: {
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Item' } } },
          },
          responses: {
            '200': {
              description: 'ok',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Item' } } },
            },
          },
        },
      }
      const code = makeHandlerCode('itemsHandler', [route] as never, {
        lib,
        openapi: true,
        components: undefined,
        responseRefs: false,
        imports: [],
      })
      expect(code.split('\n\n')[1]).toBe(
        `export const itemsHandler=new Hono().put('/items/:id',describeRoute({responses:{"200":{description:"ok",content:{"application/json":{schema:${resolver}}}}}}),${validator},(c)=>{})`,
      )
    },
  )
})

describe('makeHandlerCode: describeRoute fields', () => {
  it('leaves out an Operation field that is present but undefined, as TypeSpec output carries', () => {
    const route = {
      method: 'get',
      path: '/todos',
      parameters: [],
      operation: {
        operationId: 'Todos_list',
        summary: undefined,
        description: undefined,
        responses: { '200': { description: 'ok' } },
      },
    }
    expect(
      makeHandlerCode('todosHandler', [route] as never, {
        lib: 'zod',
        openapi: true,
        components: undefined,
        responseRefs: false,
        imports: [],
      }),
    ).toBe(`import{Hono}from'hono'
import{describeRoute}from'hono-openapi'

export const todosHandler=new Hono().get('/todos',describeRoute({operationId:"Todos_list",responses:{"200":{description:"ok"}}}),(c)=>{})`)
  })
})

describe('toHandlerVarName', () => {
  it.each([
    ['users', 'usersHandler'],
    ['__root', 'rootHandler'],
    ['user-profiles', 'userProfilesHandler'],
    ['2010-04-01', '_20100401Handler'],
  ])('%s → %s', (fileName, expected) => {
    expect(toHandlerVarName(fileName)).toBe(expected)
  })
})

describe('toGroupName', () => {
  it.each([
    ['users', 'users'],
    ['__root', '__root'],
    ['user-profiles', 'userProfiles'],
    ['2010-04-01', '_20100401'],
    ['delete', '__delete'],
  ])('%s → %s', (fileName, expected) => {
    expect(toGroupName(fileName)).toBe(expected)
  })
})

describe('makeAppCode', () => {
  it('routes every handler, sorted by file name, under the base path', () => {
    expect(
      makeAppCode(['users', '__root', 'pets'], { basePath: '/api', handlersImport: './handlers' }),
    ).toBe(`import{Hono}from'hono'
import{rootHandler,petsHandler,usersHandler}from'./handlers'

const app=new Hono().basePath("/api")

export const api=app.route('/',rootHandler).route('/',petsHandler).route('/',usersHandler)

export default app`)
  })

  it('exports each handler file as a group with split, all on the one app', () => {
    expect(
      makeAppCode(['users', '__root', 'user-profiles'], {
        basePath: '/api',
        handlersImport: './handlers',
        split: true,
      }),
    ).toBe(`import{Hono}from'hono'
import{rootHandler,userProfilesHandler,usersHandler}from'./handlers'

const app=new Hono().basePath("/api")

export const __root=app.route('/',rootHandler)

export const userProfiles=app.route('/',userProfilesHandler)

export const users=app.route('/',usersHandler)

export default app`)
  })

  it('binds the app under another name when a group is called app', () => {
    expect(
      makeAppCode(['app', 'pets'], {
        basePath: undefined,
        handlersImport: './handlers',
        split: true,
      }),
    ).toBe(`import{Hono}from'hono'
import{appHandler,petsHandler}from'./handlers'

const app2=new Hono()

export const app=app2.route('/',appHandler)

export const pets=app2.route('/',petsHandler)

export default app2`)
  })
})
