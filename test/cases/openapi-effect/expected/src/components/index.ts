import { resolver } from 'hono-openapi'
import { Schema, SchemaTransformation } from 'effect'

export const TagSchema = Schema.Literals(['dog', 'cat', 'bird']).annotate({ identifier: 'Tag' })

export type Tag = Schema.Schema.Type<typeof TagSchema>

export const PetSchema = Schema.Struct({
  id: Schema.Number.check(Schema.isInt()),
  name: Schema.String.check(
    Schema.makeFilter((input) => [...input].length >= 1, {
      expected: 'a string of at least 1 character',
    }),
  ),
  tag: Schema.optionalKey(TagSchema),
})
  .annotate({ description: 'A pet in the store' })
  .annotate({ identifier: 'Pet' })

export type Pet = Schema.Schema.Type<typeof PetSchema>

export const NewPetSchema = Schema.Struct({
  name: Schema.String.check(
    Schema.makeFilter((input) => [...input].length >= 1, {
      expected: 'a string of at least 1 character',
    }),
  ),
  tag: Schema.optionalKey(TagSchema),
}).annotate({ identifier: 'NewPet' })

export type NewPet = Schema.Schema.Type<typeof NewPetSchema>

export const ErrorSchema = Schema.Struct({ message: Schema.String }).annotate({
  identifier: 'Error',
})

export type Error = Schema.Schema.Type<typeof ErrorSchema>

export const LimitParamsSchema = resolver(
  Schema.toStandardSchemaV1(
    Schema.String.check(Schema.isPattern(/^-?(?:0|[1-9]\d*)$/))
      .pipe(
        Schema.decodeTo(
          Schema.Finite,
          SchemaTransformation.transform({
            decode: (input) => Number(input),
            encode: (output) => String(output),
          }),
        ),
      )
      .check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(1), Schema.isLessThanOrEqualTo(100)),
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
