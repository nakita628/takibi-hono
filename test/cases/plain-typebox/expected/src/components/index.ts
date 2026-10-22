import { Type, Codec, type Static } from 'typebox'

export const TagSchema = Type.Union([
  Type.Literal('dog'),
  Type.Literal('cat'),
  Type.Literal('bird'),
])

export type Tag = Static<typeof TagSchema>

export const PetSchema = Type.Object(
  { id: Type.Integer(), name: Type.String({ minLength: 1 }), tag: Type.Optional(TagSchema) },
  { description: 'A pet in the store' },
)

export type Pet = Static<typeof PetSchema>

export const NewPetSchema = Type.Object({
  name: Type.String({ minLength: 1 }),
  tag: Type.Optional(TagSchema),
})

export type NewPet = Static<typeof NewPetSchema>

export const ErrorSchema = Type.Object({ message: Type.String() })

export type Error = Static<typeof ErrorSchema>

export const LimitParamsSchema = Codec(Type.String())
  .Decode((value) => Number.parseInt(value, 10))
  .Encode((value) => String(value))
export const RequestIdParamsSchema = Type.String()

export const TotalCountHeaderSchema = Type.Integer()

export const ApiKeySecurityScheme = { type: 'apiKey', in: 'header', name: 'X-API-Key' }

export const NewPetRequestBody = {
  required: true,
  content: { 'application/json': { schema: NewPetSchema } },
}

export const NotFoundResponse = {
  description: 'Not found',
  content: { 'application/json': { schema: ErrorSchema } },
}
export const BadRequestResponse = { description: 'Bad request' }
