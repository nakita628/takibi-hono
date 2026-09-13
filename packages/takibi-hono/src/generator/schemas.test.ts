import { describe, expect, it } from 'vite-plus/test'

import { makeSchemaDeclarations, makeSchemasPrologue } from './schemas.js'

const schemas = {
  Pet: {
    type: 'object',
    description: 'A pet',
    required: ['name'],
    properties: { name: { type: 'string' }, tag: { $ref: '#/components/schemas/Tag' } },
  },
  Tag: { type: 'string' },
  Node: {
    type: 'object',
    properties: { children: { type: 'array', items: { $ref: '#/components/schemas/Node' } } },
  },
} as const

const mutual = {
  A: { type: 'object', properties: { b: { $ref: '#/components/schemas/B' } } },
  B: {
    type: 'object',
    properties: {
      a: { $ref: '#/components/schemas/A' },
      tag: { $ref: '#/components/schemas/Tag' },
    },
  },
  Tag: { type: 'string' },
} as const

describe('makeSchemaDeclarations', () => {
  it('emits dependencies first, unwraps references outside a cycle and registers refs', () => {
    expect(
      makeSchemaDeclarations(schemas as never, {
        lib: 'zod',
        exportTypes: true,
        readonly: false,
        registerRef: true,
      }),
    ).toStrictEqual([
      {
        name: 'Tag',
        varName: 'TagSchema',
        fileName: 'tag',
        importLine: "import * as z from 'zod'",
        code: 'export const TagSchema=z.string().meta({ref:"Tag"})\n\nexport type Tag=z.infer<typeof TagSchema>',
      },
      {
        name: 'Pet',
        varName: 'PetSchema',
        fileName: 'pet',
        importLine: "import * as z from 'zod'",
        code: 'export const PetSchema=z.object({name:z.string(),tag:TagSchema.exactOptional()}).meta({description:"A pet"}).meta({ref:"Pet"})\n\nexport type Pet=z.infer<typeof PetSchema>',
      },
      {
        name: 'Node',
        varName: 'NodeSchema',
        fileName: 'node',
        importLine: "import * as z from 'zod'",
        code: 'type NodeType={"children"?:(NodeType)[]}\n\nexport const NodeSchema:z.ZodType<NodeType>=z.object({children:z.array(z.lazy(() => NodeSchema)).exactOptional()}).meta({ref:"Node"})\n\nexport type Node=z.infer<typeof NodeSchema>',
      },
    ])
  })

  it.each([
    [
      'valibot',
      'export const PetSchema=v.pipe(v.pipe(v.object({name:v.string(),tag:v.optional(TagSchema)}),v.description("A pet")),v.metadata({ref:"Pet"}))\n\nexport type Pet=v.InferOutput<typeof PetSchema>',
      'type NodeType={"children"?:(NodeType)[]|undefined}\n\nexport const NodeSchema:v.GenericSchema<NodeType>=v.pipe(v.partial(v.object({children:v.array(v.lazy(() => NodeSchema))})),v.metadata({ref:"Node"}))\n\nexport type Node=v.InferOutput<typeof NodeSchema>',
    ],
    [
      'typebox',
      'export const PetSchema=Type.Object({name:Type.String(),tag:Type.Optional(TagSchema)},{ref:"Pet",description:"A pet"})\n\nexport type Pet=Static<typeof PetSchema>',
      "export const NodeSchema=Type.Cyclic({\nNodeSchema: Type.Object({children:Type.Optional(Type.Array(Type.Ref('NodeSchema')))})\n},'NodeSchema',{ref:\"Node\"})\n\nexport type Node=Static<typeof NodeSchema>",
    ],
    [
      'arktype',
      'export const PetSchema=type({name:"string","tag?":TagSchema}).describe("A pet").configure({ref:"Pet"})\n\nexport type Pet=typeof PetSchema.infer',
      'export const NodeSchema=scope({NodeSchema:{"children?":"NodeSchema[]"}}).export().NodeSchema.configure({ref:"Node"})\n\nexport type Node=typeof NodeSchema.infer',
    ],
    [
      'effect',
      'export const PetSchema=Schema.Struct({name:Schema.String,tag:Schema.optional(TagSchema)}).annotate({description:"A pet"}).annotate({identifier:"Pet"})\n\nexport type Pet=Schema.Schema.Type<typeof PetSchema>',
      'type NodeType={"children"?:readonly (NodeType)[]|undefined}\n\nexport const NodeSchema:Schema.Codec<NodeType>=Schema.Struct({children:Schema.optional(Schema.Array(Schema.suspend(() => NodeSchema)))}).annotate({identifier:"Node"})\n\nexport type Node=Schema.Schema.Type<typeof NodeSchema>',
    ],
  ] as const)('%s: registers refs and declares the recursive schema', (lib, pet, node) => {
    const code = makeSchemaDeclarations(schemas as never, {
      lib,
      exportTypes: true,
      readonly: false,
      registerRef: true,
    }).map((d) => d.code)
    expect(code.slice(1)).toStrictEqual([pet, node])
  })

  it('carries readonly into the schemas and the recursive type', () => {
    expect(
      makeSchemaDeclarations(schemas as never, {
        lib: 'zod',
        exportTypes: false,
        readonly: true,
        registerRef: false,
      }).map((d) => d.code),
    ).toStrictEqual([
      'export const TagSchema=z.string()',
      'export const PetSchema=z.object({name:z.string(),tag:TagSchema.exactOptional()}).readonly().meta({description:"A pet"})',
      'type NodeType={readonly "children"?:readonly (NodeType)[]}\n\nexport const NodeSchema:z.ZodType<NodeType>=z.object({children:z.array(z.lazy(() => NodeSchema)).readonly().exactOptional()}).readonly()',
    ])
  })

  it.each([
    [
      'valibot',
      'type NodeType={readonly "children"?:readonly (NodeType)[]|undefined}\n\nexport const NodeSchema:v.GenericSchema<NodeType>=v.pipe(v.pipe(v.partial(v.object({children:v.pipe(v.array(v.lazy(() => NodeSchema)),v.readonly())})),v.readonly()),v.metadata({ref:"Node"}))',
    ],
    [
      'typebox',
      "export const NodeSchema=Type.Cyclic({\nNodeSchema: Type.Readonly(Type.Object({children:Type.Optional(Type.Readonly(Type.Array(Type.Ref('NodeSchema'))))}))\n},'NodeSchema',{ref:\"Node\"})",
    ],
    [
      'arktype',
      'export const NodeSchema=scope({NodeSchema:{"children?":"NodeSchema[]"}}).export().NodeSchema.readonly().configure({ref:"Node"})',
    ],
  ] as const)('%s: readonly recursive schema with a registered ref', (lib, expected) => {
    expect(
      makeSchemaDeclarations(
        { Node: schemas.Node },
        {
          lib,
          exportTypes: false,
          readonly: true,
          registerRef: true,
        },
      ).map((d) => d.code),
    ).toStrictEqual([expected])
  })

  it.each([
    [
      'zod',
      [
        'export const TagSchema=z.string()',
        'type AType={"b"?:z.infer<typeof BSchema>}\n\nexport const ASchema:z.ZodType<AType>=z.object({b:z.lazy(() => BSchema).exactOptional()})',
        'type BType={"a"?:z.infer<typeof ASchema>;"tag"?:z.infer<typeof TagSchema>}\n\nexport const BSchema:z.ZodType<BType>=z.object({a:z.lazy(() => ASchema).exactOptional(),tag:TagSchema.exactOptional()})',
      ],
    ],
    [
      'typebox',
      [
        'export const TagSchema=Type.String()',
        "export const ASchema=Type.Cyclic({\nBSchema: Type.Object({a:Type.Optional(Type.Ref('ASchema')),tag:Type.Optional(TagSchema)}),\nASchema: Type.Object({b:Type.Optional(Type.Ref('BSchema'))})\n},'ASchema')",
        "export const BSchema=Type.Cyclic({\nASchema: Type.Object({b:Type.Optional(Type.Ref('BSchema'))}),\nBSchema: Type.Object({a:Type.Optional(Type.Ref('ASchema')),tag:Type.Optional(TagSchema)})\n},'BSchema')",
      ],
    ],
    [
      'arktype',
      [
        'export const TagSchema=type("string")',
        'export const ASchema=scope({TagSchema:TagSchema,BSchema:{"a?":"ASchema","tag?":"TagSchema"},ASchema:{"b?":"BSchema"}}).export().ASchema',
        'export const BSchema=scope({TagSchema:TagSchema,BSchema:{"a?":"ASchema","tag?":"TagSchema"},ASchema:{"b?":"BSchema"}}).export().BSchema',
      ],
    ],
  ] as const)('%s: a mutual cycle shares one container per member', (lib, expected) => {
    expect(
      makeSchemaDeclarations(mutual as never, {
        lib,
        exportTypes: false,
        readonly: false,
        registerRef: false,
      }).map((d) => d.code),
    ).toStrictEqual(expected)
  })

  it('returns nothing for no schemas', () => {
    expect(
      makeSchemaDeclarations(
        {},
        { lib: 'zod', exportTypes: true, readonly: false, registerRef: true },
      ),
    ).toStrictEqual([])
  })

  // x-* policy: message (A) and transform (B) keys pass through to schema-to-library;
  // code-injection (C) keys are dropped because `unsafeCodeExtensions` is never enabled.
  it.each([
    ['zod', 'export const NameSchema=z.string({error:"bad name"}).trim()'],
    ['valibot', 'export const NameSchema=v.pipe(v.string("bad name"),v.trim())'],
    [
      'typebox',
      'export const NameSchema=Codec(Type.String({errorMessage:"bad name"})).Decode((value: string) => value.trim()).Encode((value: string) => value)',
    ],
    [
      'arktype',
      'export const NameSchema=type("string").pipe((data: string) => data.trim()).describe("bad name")',
    ],
    ['effect', 'export const NameSchema=Schema.Trim.annotate({message:"bad name"})'],
  ] as const)(
    '%s: honors x-error-message / x-trim and drops x-refine / x-transform',
    (lib, expected) => {
      const name = {
        type: 'string',
        'x-trim': true,
        'x-error-message': 'bad name',
        'x-refine': '(v) => globalThis.process.exit(1)',
        'x-transform': '(v) => v',
      }
      expect(
        makeSchemaDeclarations({ Name: name } as never, {
          lib,
          exportTypes: false,
          readonly: false,
          registerRef: false,
        }).map((d) => d.code),
      ).toStrictEqual([expected])
    },
  )
})

describe('makeSchemasPrologue', () => {
  it.each([
    ['arktype', true, 'declare global{interface ArkEnv{meta():{ref?:string}}}\n\n'],
    ['arktype', false, ''],
    ['zod', true, ''],
  ] as const)('%s with registerRef %s', (lib, registerRef, expected) => {
    expect(makeSchemasPrologue({ lib, exportTypes: false, readonly: false, registerRef })).toBe(
      expected,
    )
  })
})
