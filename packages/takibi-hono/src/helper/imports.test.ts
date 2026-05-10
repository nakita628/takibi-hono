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

    // Output order follows COMPONENT_SUFFIXES declaration order (same as
    // the OpenAPI 3.0 components / config field order): schemas → responses →
    // parameters → examples → requestBodies → headers → securitySchemes → ...
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

    // Output order follows COMPONENT_SUFFIXES: schemas → parameters →
    // headers → ... regardless of source-code encounter order.
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

  // -----------------------------------------------------------------
  // Regression tests for string-literal false positives.
  //
  // The auto-import detector matches patterns like `\bXxxCallback\b` to find
  // referenced component identifiers. Without stripping string contents
  // before scanning, identifier-shaped tokens that happen to live inside a
  // quoted value (e.g. `operationId: 'userCreatedCallback'`,
  // `description: 'See UserSchema for details'`) get falsely detected as
  // imports — which in split mode produced bogus self-imports like
  // `import { userCreatedCallback } from './index'`.
  // -----------------------------------------------------------------
  it.concurrent('ignores Callback identifier inside single-quoted string', () => {
    const code = "export const UserCreatedCallback={post:{operationId:'userCreatedCallback'}}"
    expect(makeComponentImports(code, 'zod', { callbacks: './callbacks' })).toStrictEqual([])
  })

  it.concurrent('ignores Schema identifier inside double-quoted JSON-style key', () => {
    // `pathItems` / `callbacks` generators emit JSON.stringify output where
    // object keys land in double quotes. A token like `"UserSchema"` (a key
    // or quoted value) must not trigger a schema import.
    const code = 'export const X={"description":"see UserSchema for shape"}'
    expect(makeComponentImports(code, 'zod', { schemas: './schemas' })).toStrictEqual([])
  })

  it.concurrent('ignores Response identifier inside template literal', () => {
    const code = 'export const X={description:`returns UserResponse on success`}'
    expect(makeComponentImports(code, 'zod', { responses: './responses' })).toStrictEqual([])
  })

  it.concurrent('ignores RequestBody / Example / Link / Header / SecurityScheme / MediaTypeSchema / ParamsSchema in strings', () => {
    const code = `export const X={
        a:'see CreateUserRequestBody',
        b:'inspect UserExample',
        c:'GetUserLink',
        d:'X-IdHeaderSchema',
        e:'BearerAuthSecurityScheme',
        f:'JsonMediaTypeSchema',
        g:'UserParamsSchema',
      }`
    expect(
      makeComponentImports(code, 'zod', {
        requestBodies: './requestBodies',
        examples: './examples',
        links: './links',
        headers: './headers',
        securitySchemes: './securitySchemes',
        mediaTypes: './mediaTypes',
        parameters: './parameters',
      }),
    ).toStrictEqual([])
  })

  it.concurrent('handles escaped quotes inside string literals', () => {
    // `\'` inside a single-quoted string previously could throw a naive
    // parser off and re-enter scanning mode mid-string. The strip must skip
    // past the escape and stay inside the literal until the unescaped closer.
    const code = "export const X={msg:'don\\'t use UserSchema directly'}"
    expect(makeComponentImports(code, 'zod', { schemas: './schemas' })).toStrictEqual([])
  })

  it.concurrent('still imports identifiers that appear in real code positions', () => {
    const code = 'export const Wrapper={inner:UserCreatedCallback}'
    expect(makeComponentImports(code, 'zod', { callbacks: './callbacks' })).toStrictEqual([
      "import{UserCreatedCallback}from'./callbacks'",
    ])
  })

  it.concurrent('detects identifier when one occurrence is in code and another is in a string', () => {
    // Mixed scenario: same identifier appears in BOTH a string AND a real
    // reference. Detector should emit one import (because there is a real
    // reference) without double-counting.
    const code = "export const X={description:'creates UserSchema instance',schema:UserSchema}"
    const result = makeComponentImports(code, 'zod', { schemas: './schemas' })
    const userSchemaImports = result.filter((l) => l.includes('UserSchema'))
    expect(userSchemaImports.length).toBe(1)
  })

  it.concurrent('does not self-import when an identifier shape matches the file own export', () => {
    // The defined-set filter must continue to work after the strip pass so
    // a file that exports `UserCreatedCallback` does not import its own name
    // even when the name appears multiple times in the body.
    const code = 'export const UserCreatedCallback={inner:UserCreatedCallback}'
    expect(makeComponentImports(code, 'zod', { callbacks: './callbacks' })).toStrictEqual([])
  })

  it.concurrent('ignores identifier-shape tokens inside line comments', () => {
    const code = `// see UserSchema for the runtime check
export const X={v:1}`
    expect(makeComponentImports(code, 'zod', { schemas: './schemas' })).toStrictEqual([])
  })

  it.concurrent('ignores identifier-shape tokens inside block / JSDoc comments', () => {
    const code = `/**
 * @returns the UserSchema instance
 * Other refs: BearerAuthSecurityScheme, GetUserLink, JsonMediaTypeSchema
 */
export const X={v:1}`
    expect(
      makeComponentImports(code, 'zod', {
        schemas: './schemas',
        securitySchemes: './securitySchemes',
        links: './links',
        mediaTypes: './mediaTypes',
      }),
    ).toStrictEqual([])
  })

  it.concurrent('still imports identifier when comment mentions it AND code references it', () => {
    const code = `// validates UserSchema input
export const X={schema:UserSchema}`
    const result = makeComponentImports(code, 'zod', { schemas: './schemas' })
    const userSchemaImports = result.filter((l) => l.includes('UserSchema'))
    expect(userSchemaImports.length).toBe(1)
  })

  // ============================================================
  // Suffix disambiguation: longest match wins regardless of source order.
  // Regression: `UserParamsSchema` ended up classified as `schemas` when
  // `Schema` came first in `COMPONENT_SUFFIXES`. `classifyRef` now picks
  // the longest matching suffix, so source order is purely cosmetic.
  // ============================================================
  it.concurrent('classifies *ParamsSchema as parameters not schemas', () => {
    expect(
      makeComponentImports('UserParamsSchema', 'zod', {
        schemas: './schemas',
        parameters: './parameters',
      }),
    ).toStrictEqual(["import{UserParamsSchema}from'./parameters'"])
  })

  it.concurrent('classifies *HeaderSchema as headers not schemas', () => {
    expect(
      makeComponentImports('XRequestIdHeaderSchema', 'zod', {
        schemas: './schemas',
        headers: './headers',
      }),
    ).toStrictEqual(["import{XRequestIdHeaderSchema}from'./headers'"])
  })

  it.concurrent('classifies *MediaTypeSchema as mediaTypes not schemas', () => {
    expect(
      makeComponentImports('JsonUserMediaTypeSchema', 'zod', {
        schemas: './schemas',
        mediaTypes: './mediaTypes',
      }),
    ).toStrictEqual(["import{JsonUserMediaTypeSchema}from'./mediaTypes'"])
  })

  it.concurrent('handles all 11 OpenAPI 3.x component types in one body', () => {
    // OpenAPI 3.0 / 3.1 / 3.2 share these 11 components — verify each
    // identifier suffix routes to the correct kind in a single pass.
    const code = [
      'UserSchema',
      'IdParamsSchema',
      'XHeaderSchema',
      'BearerAuthSecurityScheme',
      'CreateUserRequestBody',
      'OkResponse',
      'GoodExample',
      'NextLink',
      'WebhookCallback',
      'PetsItemPathItem',
      'JsonMediaTypeSchema',
    ].join(',')
    const result = makeComponentImports(code, 'zod', {
      schemas: './schemas',
      parameters: './parameters',
      headers: './headers',
      securitySchemes: './securitySchemes',
      requestBodies: './requestBodies',
      responses: './responses',
      examples: './examples',
      links: './links',
      callbacks: './callbacks',
      pathItems: './pathItems',
      mediaTypes: './mediaTypes',
    })
    expect(result.some((l) => l.includes('schemas') && l.includes('UserSchema'))).toBe(true)
    expect(result.some((l) => l.includes('parameters') && l.includes('IdParamsSchema'))).toBe(true)
    expect(result.some((l) => l.includes('headers') && l.includes('XHeaderSchema'))).toBe(true)
    expect(
      result.some((l) => l.includes('securitySchemes') && l.includes('BearerAuthSecurityScheme')),
    ).toBe(true)
    expect(
      result.some((l) => l.includes('requestBodies') && l.includes('CreateUserRequestBody')),
    ).toBe(true)
    expect(result.some((l) => l.includes('responses') && l.includes('OkResponse'))).toBe(true)
    expect(result.some((l) => l.includes('examples') && l.includes('GoodExample'))).toBe(true)
    expect(result.some((l) => l.includes('links') && l.includes('NextLink'))).toBe(true)
    expect(result.some((l) => l.includes('callbacks') && l.includes('WebhookCallback'))).toBe(true)
    expect(result.some((l) => l.includes('pathItems') && l.includes('PetsItemPathItem'))).toBe(true)
    expect(result.some((l) => l.includes('mediaTypes') && l.includes('JsonMediaTypeSchema'))).toBe(
      true,
    )
  })

  it.concurrent('emits imports in COMPONENT_SUFFIXES order regardless of scan-encounter order', () => {
    // Reverse encounter order in the body. Output must still follow
    // COMPONENT_SUFFIXES (schemas → parameters → headers).
    const code = 'XHeaderSchema,UserSchema,IdParamsSchema'
    const result = makeComponentImports(code, 'zod', {
      schemas: './schemas',
      parameters: './parameters',
      headers: './headers',
    })
    const findIdx = (token: string) => result.findIndex((l) => l.includes(token))
    expect(findIdx('UserSchema')).toBeLessThan(findIdx('IdParamsSchema'))
    expect(findIdx('IdParamsSchema')).toBeLessThan(findIdx('XHeaderSchema'))
  })

  it.concurrent('detects identifier preceded by various JS punctuation', () => {
    const code = `[
  UserSchema,
  ((PetSchema)),
  { x: TodoSchema },
  =CommentSchema=
]`
    const result = makeComponentImports(code, 'zod', { schemas: './schemas' })
    expect(result.some((l) => l.includes('UserSchema'))).toBe(true)
    expect(result.some((l) => l.includes('PetSchema'))).toBe(true)
    expect(result.some((l) => l.includes('TodoSchema'))).toBe(true)
    expect(result.some((l) => l.includes('CommentSchema'))).toBe(true)
  })

  it.concurrent('emits no component imports when body is only strings and comments', () => {
    const code = `// just a comment with UserSchema mentioned
'string with UserSchema',
"another string with PetSchema",
/* block comment with CommentSchema */`
    const result = makeComponentImports(code, 'zod', { schemas: './schemas' })
    expect(result.some((l) => l.includes("from './schemas'"))).toBe(false)
  })

  it.concurrent('does not match the bare suffix name (e.g. just "Schema")', () => {
    const code = 'Schema, Response, Callback, PathItem'
    const result = makeComponentImports(code, 'zod', {
      schemas: './schemas',
      responses: './responses',
      callbacks: './callbacks',
      pathItems: './pathItems',
    })
    expect(result).toStrictEqual([])
  })

  it.concurrent('classifies *ParamsSchemaSchema by longest known suffix (schemas)', () => {
    // 'XParamsSchemaSchema' endsWith('Schema') ✓; endsWith('ParamsSchema') ✗
    // (last 12 chars are 'SchemaSchema', not 'ParamsSchema').
    const code = 'XParamsSchemaSchema'
    const result = makeComponentImports(code, 'zod', {
      schemas: './schemas',
      parameters: './parameters',
    })
    expect(result.some((l) => l.includes('XParamsSchemaSchema') && l.includes('schemas'))).toBe(
      true,
    )
    expect(result.some((l) => l.includes('XParamsSchemaSchema') && l.includes('parameters'))).toBe(
      false,
    )
  })

  it.concurrent('does not import identifiers starting with non-ASCII letters', () => {
    const code = '日本Schema, UserSchema'
    const result = makeComponentImports(code, 'zod', { schemas: './schemas' })
    expect(result.some((l) => l.includes('UserSchema'))).toBe(true)
    expect(result.some((l) => l.includes('日本'))).toBe(false)
  })

  it.concurrent('collapses duplicate identifier references into a single import', () => {
    const code = 'UserSchema; UserSchema; UserSchema'
    const result = makeComponentImports(code, 'zod', { schemas: './schemas' })
    const userSchemaImports = result.filter((l) => l.includes('UserSchema'))
    expect(userSchemaImports.length).toBe(1)
  })

  it.concurrent('merges multiple identifiers of the same kind into one sorted import line', () => {
    const code = 'UserSchema, PetSchema, CommentSchema'
    const result = makeComponentImports(code, 'zod', { schemas: './schemas' })
    expect(result).toStrictEqual(["import{CommentSchema,PetSchema,UserSchema}from'./schemas'"])
  })

  it.concurrent('emits no imports for empty body', () => {
    expect(makeComponentImports('', 'zod', { schemas: './schemas' })).toStrictEqual([])
  })
})
