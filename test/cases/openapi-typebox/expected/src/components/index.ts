import { resolver, validator } from 'hono-openapi'
import {
  Type,
  Codec,
  type Static,
  type StaticDecode,
  type StaticEncode,
  type TSchema,
} from 'typebox'
import { Compile } from 'typebox/compile'

const toStandardSchemaV1 = <T extends TSchema>(schema: T) => {
  const validator = Compile(schema)
  return Object.assign(validator, {
    '~standard': {
      version: 1 as const,
      vendor: 'typebox',
      validate: (value: unknown) =>
        validator.Check(value)
          ? { value: validator.Decode(value) }
          : {
              issues: validator.Errors(value).map((error) => ({
                message: error.message,
                path: error.instancePath
                  .split('/')
                  .slice(1)
                  .map((key) => key.replaceAll('~1', '/').replaceAll('~0', '~')),
              })),
            },
      types: undefined as
        | { readonly input: StaticEncode<T>; readonly output: StaticDecode<T> }
        | undefined,
    },
  })
}

export const TagSchema = Type.Union(
  [Type.Literal('dog'), Type.Literal('cat'), Type.Literal('bird')],
  { ref: 'Tag' },
)

export type Tag = Static<typeof TagSchema>

export const PetSchema = Type.Object(
  { id: Type.Integer(), name: Type.String({ minLength: 1 }), tag: Type.Optional(TagSchema) },
  { ref: 'Pet', description: 'A pet in the store' },
)

export type Pet = Static<typeof PetSchema>

export const NewPetSchema = Type.Object(
  { name: Type.String({ minLength: 1 }), tag: Type.Optional(TagSchema) },
  { ref: 'NewPet' },
)

export type NewPet = Static<typeof NewPetSchema>

export const ErrorSchema = Type.Object({ message: Type.String() }, { ref: 'Error' })

export type Error = Static<typeof ErrorSchema>

export const LimitParamsSchema = resolver(
  toStandardSchemaV1(
    Codec(Type.String({ pattern: /^-?(?:0|[1-9]\d*)$/ }))
      .Decode((value) => Number(value))
      .Encode((value) => String(value)),
  ),
)
export const RequestIdParamsSchema = resolver(toStandardSchemaV1(Type.String()))

export const TotalCountHeaderSchema = resolver(toStandardSchemaV1(Type.Integer()))

export const ApiKeySecurityScheme = { type: 'apiKey', in: 'header', name: 'X-API-Key' }

export const NewPetRequestBody = {
  required: true,
  content: { 'application/json': { schema: resolver(toStandardSchemaV1(NewPetSchema)) } },
}

export const NotFoundResponse = {
  description: 'Not found',
  content: { 'application/json': { schema: resolver(toStandardSchemaV1(ErrorSchema)) } },
}
export const BadRequestResponse = { description: 'Bad request' }
