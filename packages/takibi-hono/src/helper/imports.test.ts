import { describe, expect, it } from 'vite-plus/test'

import {
  makeComponentImports,
  makeImports,
  makeModuleSpec,
  makeStandardImports,
} from './imports.js'

describe('makeModuleSpec', () => {
  it.concurrent('handler to parent schemas.ts', () => {
    expect(makeModuleSpec('src/handlers/users.ts', 'src/schemas.ts')).toBe('../schemas')
  })

  it.concurrent('handler to sibling component', () => {
    expect(makeModuleSpec('src/handlers/users.ts', 'src/responses.ts')).toBe('../responses')
  })

  it.concurrent('component to same-dir schemas', () => {
    expect(makeModuleSpec('src/responses.ts', 'src/schemas.ts')).toBe('./schemas')
  })

  it.concurrent('handler to split schema dir index', () => {
    expect(makeModuleSpec('src/handlers/users.ts', 'src/schemas/index.ts')).toBe('../schemas')
  })

  it.concurrent('deep handler to top-level schema', () => {
    expect(makeModuleSpec('src/api/v1/handlers/users.ts', 'src/schemas.ts')).toBe(
      '../../../schemas',
    )
  })

  it.concurrent('cross-package path', () => {
    expect(
      makeModuleSpec('packages/api/src/handlers/users.ts', 'packages/shared/src/schemas.ts'),
    ).toBe('../../../shared/src/schemas')
  })

  it.concurrent('handler to component in subdirectory', () => {
    expect(makeModuleSpec('src/handlers/users.ts', 'src/components/responses.ts')).toBe(
      '../components/responses',
    )
  })

  it.concurrent('same-level file', () => {
    expect(makeModuleSpec('src/routes.ts', 'src/schemas.ts')).toBe('./schemas')
  })

  it.concurrent('handler to shared/schemas/index', () => {
    expect(makeModuleSpec('src/handlers/users.ts', 'src/shared/schemas/index.ts')).toBe(
      '../shared/schemas',
    )
  })

  it.concurrent('monorepo: packages/api/handlers to packages/shared/schemas', () => {
    expect(
      makeModuleSpec('packages/api/src/handlers/users.ts', 'packages/shared/src/schemas/index.ts'),
    ).toBe('../../../shared/src/schemas')
  })

  it.concurrent('monorepo: packages/api/responses to packages/api/schemas', () => {
    expect(
      makeModuleSpec('packages/api/src/responses/index.ts', 'packages/api/src/schemas/index.ts'),
    ).toBe('../schemas')
  })

  it.concurrent('monorepo: apps/web/handlers to packages/shared/schemas', () => {
    expect(makeModuleSpec('apps/web/src/handlers/users.ts', 'packages/shared/src/schemas.ts')).toBe(
      '../../../../packages/shared/src/schemas',
    )
  })

  it.concurrent('same directory different file', () => {
    expect(makeModuleSpec('src/components/responses.ts', 'src/components/schemas.ts')).toBe(
      './schemas',
    )
  })

  it.concurrent('parent directory', () => {
    expect(makeModuleSpec('src/api/v1/handlers/users.ts', 'src/api/schemas.ts')).toBe(
      '../../schemas',
    )
  })
})

describe('makeImports', () => {
  it.concurrent('resolver + validator + schema lib + component refs', () => {
    const code = [
      'export const usersHandler=new Hono()',
      ".get('/users',",
      "describeRoute({responses:{200:{content:{'application/json':{schema:resolver(z.array(UserSchema))}}}}}),",
      "validator('query',z.object({page:z.int().optional()})),",
      '(c)=>{})',
    ].join('')

    expect(makeImports(code, 'zod', { schemas: '../schemas' })).toStrictEqual([
      "import{Hono}from'hono'",
      "import{describeRoute,resolver,validator}from'hono-openapi'",
      "import*as z from'zod'",
      "import{UserSchema}from'../schemas'",
    ])
  })

  it.concurrent('resolver only (no validator)', () => {
    const code =
      "describeRoute({responses:{200:{content:{'application/json':{schema:resolver(ErrorSchema)}}}}})"

    expect(makeImports(code, 'zod', { schemas: '../schemas' })).toStrictEqual([
      "import{Hono}from'hono'",
      "import{describeRoute,resolver}from'hono-openapi'",
      "import{ErrorSchema}from'../schemas'",
    ])
  })

  it.concurrent('validator only (no resolver)', () => {
    const code = "validator('param',z.object({id:z.string()}))"

    expect(makeImports(code, 'zod', { schemas: '../schemas' })).toStrictEqual([
      "import{Hono}from'hono'",
      "import{validator}from'hono-openapi'",
      "import*as z from'zod'",
    ])
  })

  it.concurrent('multiple component types', () => {
    const code = 'resolver(UserSchema)\nUnauthorizedResponseResponse\nXRequestIdHeaderSchema'

    expect(
      makeImports(code, 'zod', {
        schemas: '../schemas',
        responses: '../responses',
        headers: '../headers',
      }),
    ).toStrictEqual([
      "import{Hono}from'hono'",
      "import{resolver}from'hono-openapi'",
      "import{UserSchema}from'../schemas'",
      "import{UnauthorizedResponseResponse}from'../responses'",
      "import{XRequestIdHeaderSchema}from'../headers'",
    ])
  })

  it.concurrent('excludes locally defined exports', () => {
    const code = 'export const usersHandler=new Hono()\nresolver(UserSchema)'

    const result = makeImports(code, 'zod', { schemas: '../schemas' })
    expect(result).toStrictEqual([
      "import{Hono}from'hono'",
      "import{resolver}from'hono-openapi'",
      "import{UserSchema}from'../schemas'",
    ])
  })

  it.concurrent('valibot', () => {
    expect(
      makeImports("validator('param',v.object({id:v.string()}))", 'valibot', {}),
    ).toStrictEqual([
      "import{Hono}from'hono'",
      "import{validator}from'hono-openapi'",
      "import*as v from'valibot'",
    ])
  })

  it.concurrent('typebox', () => {
    expect(
      makeImports("validator('param',Type.Object({id:Type.String()}))", 'typebox', {}),
    ).toStrictEqual([
      "import{Hono}from'hono'",
      "import{validator}from'hono-openapi'",
      "import Type from'typebox'",
    ])
  })

  it.concurrent('effect', () => {
    expect(
      makeImports("validator('json',EmployeeSchema)", 'effect', { schemas: '../schemas' }),
    ).toStrictEqual([
      "import{Hono}from'hono'",
      "import{validator}from'hono-openapi'",
      "import{EmployeeSchema}from'../schemas'",
    ])
  })

  it.concurrent('deep relative path', () => {
    const result = makeImports('resolver(UserSchema)', 'zod', {
      schemas: '../../../shared/schemas',
    })
    expect(result[result.length - 1]).toBe("import{UserSchema}from'../../../shared/schemas'")
  })

  it.concurrent('arktype: validator with object type', () => {
    expect(makeImports('validator(\'json\',type({name:"string"}))', 'arktype', {})).toStrictEqual([
      "import{Hono}from'hono'",
      "import{validator}from'hono-openapi'",
      "import{type}from'arktype'",
    ])
  })

  it.concurrent('arktype: validator with string type', () => {
    expect(makeImports("validator('param',type('string'))", 'arktype', {})).toStrictEqual([
      "import{Hono}from'hono'",
      "import{validator}from'hono-openapi'",
      "import{type}from'arktype'",
    ])
  })

  it.concurrent('arktype: resolver + schema ref (no type() call)', () => {
    expect(
      makeImports(
        "describeRoute({responses:{200:{content:{'application/json':{schema:resolver(PetSchema)}}}}})",
        'arktype',
        { schemas: '../schemas' },
      ),
    ).toStrictEqual([
      "import{Hono}from'hono'",
      "import{describeRoute,resolver}from'hono-openapi'",
      "import{PetSchema}from'../schemas'",
    ])
  })

  it.concurrent('arktype: resolver + inline type + schema ref', () => {
    const code = [
      "describeRoute({responses:{200:{content:{'application/json':{schema:resolver(PetSchema)}}}}}),",
      'validator(\'json\',type({name:"string"}))',
    ].join('')

    expect(makeImports(code, 'arktype', { schemas: '../schemas' })).toStrictEqual([
      "import{Hono}from'hono'",
      "import{describeRoute,resolver,validator}from'hono-openapi'",
      "import{type}from'arktype'",
      "import{PetSchema}from'../schemas'",
    ])
  })

  it.concurrent('effect: inline Schema expression', () => {
    expect(
      makeImports("validator('json',Schema.Struct({name:Schema.String}))", 'effect', {}),
    ).toStrictEqual([
      "import{Hono}from'hono'",
      "import{validator}from'hono-openapi'",
      "import{Schema}from'effect'",
    ])
  })

  it.concurrent('effect: standardSchemaV1 import', () => {
    expect(
      makeImports("validator('json',standardSchemaV1(EmployeeSchema))", 'effect', {
        schemas: '../schemas',
      }),
    ).toStrictEqual([
      "import{Hono}from'hono'",
      "import{validator}from'hono-openapi'",
      "import{standardSchemaV1}from'effect/Schema'",
      "import{EmployeeSchema}from'../schemas'",
    ])
  })

  it.concurrent('typebox: Compile import', () => {
    expect(
      makeImports("validator('json',Compile(Type.Object({name:Type.String()})))", 'typebox', {}),
    ).toStrictEqual([
      "import{Hono}from'hono'",
      "import{validator}from'hono-openapi'",
      "import Type from'typebox'",
      "import{Compile}from'typebox/compile'",
    ])
  })

  it.concurrent('no describeRoute/resolver/validator (Hono only)', () => {
    expect(
      makeImports("new Hono().get('/',(c)=>{return c.json({ok:true})})", 'zod', {}),
    ).toStrictEqual(["import{Hono}from'hono'"])
  })

  it.concurrent('multiple schema refs are sorted alphabetically', () => {
    const code = [
      "describeRoute({responses:{200:{content:{'application/json':{schema:resolver(z.object({user:UserSchema,todo:TodoSchema,pet:PetSchema}))}}}}}),",
    ].join('')

    expect(makeImports(code, 'zod', { schemas: '../schemas' })).toStrictEqual([
      "import{Hono}from'hono'",
      "import{describeRoute,resolver}from'hono-openapi'",
      "import*as z from'zod'",
      "import{PetSchema,TodoSchema,UserSchema}from'../schemas'",
    ])
  })

  it.concurrent('describeRoute only (no resolver, no validator)', () => {
    expect(
      makeImports("describeRoute({responses:{200:{description:'OK'}}})", 'zod', {}),
    ).toStrictEqual(["import{Hono}from'hono'", "import{describeRoute}from'hono-openapi'"])
  })
})

describe('makeStandardImports', () => {
  it.concurrent('sValidator + zod + schema ref', () => {
    expect(
      makeStandardImports("sValidator('json',CreateUserSchema)", 'zod', {
        schemas: '../components',
      }),
    ).toStrictEqual([
      "import{Hono}from'hono'",
      "import{sValidator}from'@hono/standard-validator'",
      "import{CreateUserSchema}from'../components'",
    ])
  })

  it.concurrent('sValidator + zod inline schema', () => {
    expect(
      makeStandardImports("sValidator('param',z.object({id:z.string()}))", 'zod', {}),
    ).toStrictEqual([
      "import{Hono}from'hono'",
      "import{sValidator}from'@hono/standard-validator'",
      "import*as z from'zod'",
    ])
  })

  it.concurrent('no validator in code', () => {
    expect(makeStandardImports("new Hono().get('/',(c)=>{})", 'zod', {})).toStrictEqual([
      "import{Hono}from'hono'",
    ])
  })

  it.concurrent('valibot: sValidator (Standard Schema)', () => {
    expect(
      makeStandardImports("sValidator('json',v.object({name:v.string()}))", 'valibot', {}),
    ).toStrictEqual([
      "import{Hono}from'hono'",
      "import{sValidator}from'@hono/standard-validator'",
      "import*as v from'valibot'",
    ])
  })

  it.concurrent('typebox: tbValidator', () => {
    expect(
      makeStandardImports("tbValidator('param',Type.Object({id:Type.String()}))", 'typebox', {}),
    ).toStrictEqual([
      "import{Hono}from'hono'",
      "import{tbValidator}from'@hono/typebox-validator'",
      "import Type from'typebox'",
    ])
  })

  it.concurrent('arktype: sValidator', () => {
    expect(
      makeStandardImports("sValidator('param',type({id:type('string')}))", 'arktype', {}),
    ).toStrictEqual([
      "import{Hono}from'hono'",
      "import{sValidator}from'@hono/standard-validator'",
      "import{type}from'arktype'",
    ])
  })

  it.concurrent('arktype: sValidator with object containing enum string (no nested type())', () => {
    expect(
      makeStandardImports(
        `sValidator('json',type({hono:'"Hono" | "HonoX" | "ZodOpenAPIHono"'}))`,
        'arktype',
        {},
      ),
    ).toStrictEqual([
      "import{Hono}from'hono'",
      "import{sValidator}from'@hono/standard-validator'",
      "import{type}from'arktype'",
    ])
  })

  it.concurrent('arktype: sValidator with empty object', () => {
    expect(makeStandardImports("sValidator('json',type({}))", 'arktype', {})).toStrictEqual([
      "import{Hono}from'hono'",
      "import{sValidator}from'@hono/standard-validator'",
      "import{type}from'arktype'",
    ])
  })

  it.concurrent('arktype: sValidator with string primitive', () => {
    expect(makeStandardImports("sValidator('param',type('string'))", 'arktype', {})).toStrictEqual([
      "import{Hono}from'hono'",
      "import{sValidator}from'@hono/standard-validator'",
      "import{type}from'arktype'",
    ])
  })

  it.concurrent('arktype: sValidator with array type', () => {
    expect(makeStandardImports("sValidator('json',type('string[]'))", 'arktype', {})).toStrictEqual(
      [
        "import{Hono}from'hono'",
        "import{sValidator}from'@hono/standard-validator'",
        "import{type}from'arktype'",
      ],
    )
  })

  it.concurrent('arktype: sValidator with nullable type', () => {
    expect(
      makeStandardImports("sValidator('json',type('string | null'))", 'arktype', {}),
    ).toStrictEqual([
      "import{Hono}from'hono'",
      "import{sValidator}from'@hono/standard-validator'",
      "import{type}from'arktype'",
    ])
  })

  it.concurrent('arktype: schema ref only (no type() call, no arktype import)', () => {
    expect(
      makeStandardImports("sValidator('json',UserSchema)", 'arktype', {
        schemas: '../schemas',
      }),
    ).toStrictEqual([
      "import{Hono}from'hono'",
      "import{sValidator}from'@hono/standard-validator'",
      "import{UserSchema}from'../schemas'",
    ])
  })

  it.concurrent('arktype: no validator (no sValidator or arktype import)', () => {
    expect(makeStandardImports("new Hono().get('/',(c)=>{})", 'arktype', {})).toStrictEqual([
      "import{Hono}from'hono'",
    ])
  })

  it.concurrent('effect: effectValidator', () => {
    expect(
      makeStandardImports(
        "effectValidator('json',Schema.Struct({name:Schema.String}))",
        'effect',
        {},
      ),
    ).toStrictEqual([
      "import{Hono}from'hono'",
      "import{effectValidator}from'@hono/effect-validator'",
      "import{Schema}from'effect'",
    ])
  })

  it.concurrent('no hono-openapi imports in standard mode', () => {
    expect(
      makeStandardImports("sValidator('json',UserSchema)", 'zod', {
        schemas: '../components',
      }),
    ).toStrictEqual([
      "import{Hono}from'hono'",
      "import{sValidator}from'@hono/standard-validator'",
      "import{UserSchema}from'../components'",
    ])
  })

  it.concurrent('effect: sValidator with inline Schema expression', () => {
    expect(
      makeStandardImports(
        "effectValidator('json',Schema.Struct({name:Schema.String}))",
        'effect',
        {},
      ),
    ).toStrictEqual([
      "import{Hono}from'hono'",
      "import{effectValidator}from'@hono/effect-validator'",
      "import{Schema}from'effect'",
    ])
  })

  it.concurrent('effect: schema ref only (no Schema. call)', () => {
    expect(
      makeStandardImports("effectValidator('json',UserSchema)", 'effect', {
        schemas: '../schemas',
      }),
    ).toStrictEqual([
      "import{Hono}from'hono'",
      "import{effectValidator}from'@hono/effect-validator'",
      "import{UserSchema}from'../schemas'",
    ])
  })

  it.concurrent('typebox: schema ref only', () => {
    expect(
      makeStandardImports("tbValidator('json',UserSchema)", 'typebox', {
        schemas: '../schemas',
      }),
    ).toStrictEqual([
      "import{Hono}from'hono'",
      "import{tbValidator}from'@hono/typebox-validator'",
      "import{UserSchema}from'../schemas'",
    ])
  })

  it.concurrent('multiple schema refs sorted alphabetically', () => {
    expect(
      makeStandardImports("sValidator('json',z.object({user:UserSchema,pet:PetSchema}))", 'zod', {
        schemas: '../schemas',
      }),
    ).toStrictEqual([
      "import{Hono}from'hono'",
      "import{sValidator}from'@hono/standard-validator'",
      "import*as z from'zod'",
      "import{PetSchema,UserSchema}from'../schemas'",
    ])
  })

  it.concurrent('valibot: schema ref only', () => {
    expect(
      makeStandardImports("sValidator('json',UserSchema)", 'valibot', {
        schemas: '../schemas',
      }),
    ).toStrictEqual([
      "import{Hono}from'hono'",
      "import{sValidator}from'@hono/standard-validator'",
      "import{UserSchema}from'../schemas'",
    ])
  })
})

describe('makeComponentImports', () => {
  it.concurrent('resolver + schema lib + schema refs', () => {
    const code =
      "export const UserListResponseResponse={content:{'application/json':{schema:resolver(z.array(UserSchema))}}}"

    expect(makeComponentImports(code, 'zod', { schemas: './schemas' })).toStrictEqual([
      "import{resolver}from'hono-openapi'",
      "import*as z from'zod'",
      "import{UserSchema}from'./schemas'",
    ])
  })

  it.concurrent('no Hono/describeRoute imports', () => {
    const result = makeComponentImports('resolver(UserSchema)', 'zod', { schemas: './schemas' })
    expect(result.some((l) => l.includes('Hono'))).toBe(false)
    expect(result.some((l) => l.includes('describeRoute'))).toBe(false)
  })

  it.concurrent('excludes locally defined exports', () => {
    const code =
      'export const UserListResponseResponse={schema:resolver(z.array(UserSchema))}\nexport const UnauthorizedResponseResponse={schema:resolver(ErrorSchema)}'

    const result = makeComponentImports(code, 'zod', {
      schemas: './schemas',
      responses: './responses',
    })
    expect(result).toStrictEqual([
      "import{resolver}from'hono-openapi'",
      "import*as z from'zod'",
      "import{ErrorSchema,UserSchema}from'./schemas'",
    ])
  })

  it.concurrent('cross-component imports (response -> header)', () => {
    const code =
      "export const UserResponseResponse={headers:{'X-Rate-Limit':XRateLimitHeaderSchema}}"

    expect(
      makeComponentImports(code, 'zod', { schemas: './schemas', headers: './headers' }),
    ).toStrictEqual(["import{XRateLimitHeaderSchema}from'./headers'"])
  })

  it.concurrent('arktype: resolver + inline type({}) object', () => {
    const code =
      'export const PetResponseResponse={content:{\'application/json\':{schema:resolver(type({name:"string"}))}}}'

    expect(makeComponentImports(code, 'arktype', {})).toStrictEqual([
      "import{resolver}from'hono-openapi'",
      "import{type}from'arktype'",
    ])
  })

  it.concurrent('arktype: resolver + schema ref (no type() call)', () => {
    const code =
      "export const PetResponseResponse={content:{'application/json':{schema:resolver(PetSchema)}}}"

    expect(makeComponentImports(code, 'arktype', { schemas: './schemas' })).toStrictEqual([
      "import{resolver}from'hono-openapi'",
      "import{PetSchema}from'./schemas'",
    ])
  })

  it.concurrent('arktype: resolver + inline type + schema ref', () => {
    const code = [
      'export const ListResponseResponse={content:{\'application/json\':{schema:resolver(type({items:"PetSchema[]"}))}}}',
      '\n',
      "export const DetailResponseResponse={content:{'application/json':{schema:resolver(PetSchema)}}}",
    ].join('')

    expect(makeComponentImports(code, 'arktype', { schemas: './schemas' })).toStrictEqual([
      "import{resolver}from'hono-openapi'",
      "import{type}from'arktype'",
      "import{PetSchema}from'./schemas'",
    ])
  })

  it.concurrent('arktype: excludes locally defined exports', () => {
    const code =
      'export const PetSchema=type({name:"string"})\nexport const OwnerResponseResponse={schema:resolver(type({pet:"PetSchema"}))}'

    const result = makeComponentImports(code, 'arktype', { schemas: './schemas' })
    expect(result).toStrictEqual([
      "import{resolver}from'hono-openapi'",
      "import{type}from'arktype'",
    ])
  })

  it.concurrent('valibot: resolver + inline schema + schema ref', () => {
    const code =
      "export const ListResponseResponse={content:{'application/json':{schema:resolver(v.array(UserSchema))}}}"

    expect(makeComponentImports(code, 'valibot', { schemas: './schemas' })).toStrictEqual([
      "import{resolver}from'hono-openapi'",
      "import*as v from'valibot'",
      "import{UserSchema}from'./schemas'",
    ])
  })

  it.concurrent('typebox: resolver + inline schema + schema ref', () => {
    const code =
      "export const ListResponseResponse={content:{'application/json':{schema:resolver(Type.Array(UserSchema))}}}"

    expect(makeComponentImports(code, 'typebox', { schemas: './schemas' })).toStrictEqual([
      "import{resolver}from'hono-openapi'",
      "import Type from'typebox'",
      "import{UserSchema}from'./schemas'",
    ])
  })

  it.concurrent('effect: resolver + inline schema + schema ref', () => {
    const code =
      "export const ListResponseResponse={content:{'application/json':{schema:resolver(Schema.Array(UserSchema))}}}"

    expect(makeComponentImports(code, 'effect', { schemas: './schemas' })).toStrictEqual([
      "import{resolver}from'hono-openapi'",
      "import{Schema}from'effect'",
      "import{UserSchema}from'./schemas'",
    ])
  })

  it.concurrent('effect: standardSchemaV1 import', () => {
    const code =
      "export const ListResponseResponse={content:{'application/json':{schema:resolver(standardSchemaV1(Schema.Array(UserSchema)))}}}"

    expect(makeComponentImports(code, 'effect', { schemas: './schemas' })).toStrictEqual([
      "import{resolver}from'hono-openapi'",
      "import{Schema}from'effect'",
      "import{standardSchemaV1}from'effect/Schema'",
      "import{UserSchema}from'./schemas'",
    ])
  })

  it.concurrent('typebox: Compile import', () => {
    const code =
      "export const ListResponseResponse={content:{'application/json':{schema:resolver(Compile(Type.Array(UserSchema)))}}}"

    expect(makeComponentImports(code, 'typebox', { schemas: './schemas' })).toStrictEqual([
      "import{resolver}from'hono-openapi'",
      "import Type from'typebox'",
      "import{Compile}from'typebox/compile'",
      "import{UserSchema}from'./schemas'",
    ])
  })

  it.concurrent('no resolver (schema lib usage only)', () => {
    const code = 'export const InlineResponse={data:z.object({name:z.string()})}'

    expect(makeComponentImports(code, 'zod', {})).toStrictEqual(["import*as z from'zod'"])
  })

  it.concurrent('multiple component types from different paths', () => {
    const code = [
      'export const HandlerResponse={',
      'schema:resolver(UserSchema),',
      "headers:{'X-Request-Id':XRequestIdHeaderSchema},",
      'params:UserIdParamsSchema',
      '}',
    ].join('')

    expect(
      makeComponentImports(code, 'zod', {
        schemas: './schemas',
        headers: './headers',
        parameters: './parameters',
      }),
    ).toStrictEqual([
      "import{resolver}from'hono-openapi'",
      "import{UserSchema}from'./schemas'",
      "import{UserIdParamsSchema}from'./parameters'",
      "import{XRequestIdHeaderSchema}from'./headers'",
    ])
  })

  it.concurrent('multiple schema refs sorted alphabetically', () => {
    const code = 'resolver(z.object({user:UserSchema,pet:PetSchema,todo:TodoSchema}))'

    expect(makeComponentImports(code, 'zod', { schemas: './schemas' })).toStrictEqual([
      "import{resolver}from'hono-openapi'",
      "import*as z from'zod'",
      "import{PetSchema,TodoSchema,UserSchema}from'./schemas'",
    ])
  })

  it.concurrent('no resolver no schema lib (component refs only)', () => {
    const code = 'export const ComposedResponse={inner:UserSchema}'

    expect(makeComponentImports(code, 'zod', { schemas: './schemas' })).toStrictEqual([
      "import{UserSchema}from'./schemas'",
    ])
  })

  it.concurrent('empty code produces no imports', () => {
    expect(makeComponentImports('', 'zod', {})).toStrictEqual([])
  })
})
