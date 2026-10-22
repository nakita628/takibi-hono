import { resolver } from 'hono-openapi'
import { Schema } from 'effect'

export const TagSchema = Schema.Literals(['dog', 'cat', 'bird']).annotate({ identifier: 'Tag' })

export type Tag = Schema.Schema.Type<typeof TagSchema>

export const PetSchema = Schema.Struct({
  id: Schema.Number.check(Schema.isInt()),
  name: Schema.String.check(Schema.isMinLength(1)),
  tag: Schema.optional(TagSchema),
})
  .annotate({ description: 'A pet in the store' })
  .annotate({ identifier: 'Pet' })

export type Pet = Schema.Schema.Type<typeof PetSchema>

export const NewPetSchema = Schema.Struct({
  name: Schema.String.check(Schema.isMinLength(1)),
  tag: Schema.optional(TagSchema),
}).annotate({ identifier: 'NewPet' })

export type NewPet = Schema.Schema.Type<typeof NewPetSchema>

export const ErrorSchema = Schema.Struct({ message: Schema.String }).annotate({
  identifier: 'Error',
})

export type Error = Schema.Schema.Type<typeof ErrorSchema>

export const LimitParamsSchema = resolver(
  Schema.toStandardSchemaV1(
    Schema.NumberFromString.check(
      Schema.isInt(),
      Schema.isGreaterThanOrEqualTo(1),
      Schema.isLessThanOrEqualTo(100),
    ),
  ),
)
export const RequestIdParamsSchema = resolver(Schema.toStandardSchemaV1(Schema.String))

export const TotalCountHeaderSchema = resolver(
  Schema.toStandardSchemaV1(Schema.Number.check(Schema.isInt())),
)

export const ApiKeySecurityScheme = { type: 'apiKey', in: 'header', name: 'X-API-Key' }

export const NewPetRequestBody = {
  required: true,
  content: { 'application/json': { schema: resolver(Schema.toStandardSchemaV1(NewPetSchema)) } },
}

export const NotFoundResponse = {
  description: 'Not found',
  content: { 'application/json': { schema: resolver(Schema.toStandardSchemaV1(ErrorSchema)) } },
}
export const BadRequestResponse = { description: 'Bad request' }
