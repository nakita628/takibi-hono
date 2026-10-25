import { Schema } from 'effect'

export const TagSchema = Schema.Literals(['dog', 'cat', 'bird'])

export type Tag = Schema.Schema.Type<typeof TagSchema>

export const PetSchema = Schema.Struct({
  id: Schema.Number.check(Schema.isInt()),
  name: Schema.String.check(
    Schema.makeFilter((input) => [...input].length >= 1, {
      expected: 'a string of at least 1 character',
    }),
  ),
  tag: Schema.optional(TagSchema),
}).annotate({ description: 'A pet in the store' })

export type Pet = Schema.Schema.Type<typeof PetSchema>

export const NewPetSchema = Schema.Struct({
  name: Schema.String.check(
    Schema.makeFilter((input) => [...input].length >= 1, {
      expected: 'a string of at least 1 character',
    }),
  ),
  tag: Schema.optional(TagSchema),
})

export type NewPet = Schema.Schema.Type<typeof NewPetSchema>

export const ErrorSchema = Schema.Struct({ message: Schema.String })

export type Error = Schema.Schema.Type<typeof ErrorSchema>

export const LimitParamsSchema = Schema.FiniteFromString.check(
  Schema.isInt(),
  Schema.isGreaterThanOrEqualTo(1),
  Schema.isLessThanOrEqualTo(100),
)
export const RequestIdParamsSchema = Schema.String

export const TotalCountHeaderSchema = Schema.Number.check(Schema.isInt())

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
