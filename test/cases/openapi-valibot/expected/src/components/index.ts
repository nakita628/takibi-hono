import { resolver } from 'hono-openapi'
import * as v from 'valibot'

export const TagSchema = v.pipe(v.picklist(['dog', 'cat', 'bird']), v.metadata({ ref: 'Tag' }))

export type Tag = v.InferOutput<typeof TagSchema>

export const PetSchema = v.pipe(
  v.pipe(
    v.object({
      id: v.pipe(v.number(), v.integer()),
      name: v.pipe(v.string(), v.minCodePoints(1)),
      tag: v.optional(TagSchema),
    }),
    v.description('A pet in the store'),
  ),
  v.metadata({ ref: 'Pet' }),
)

export type Pet = v.InferOutput<typeof PetSchema>

export const NewPetSchema = v.pipe(
  v.object({ name: v.pipe(v.string(), v.minCodePoints(1)), tag: v.optional(TagSchema) }),
  v.metadata({ ref: 'NewPet' }),
)

export type NewPet = v.InferOutput<typeof NewPetSchema>

export const ErrorSchema = v.pipe(v.object({ message: v.string() }), v.metadata({ ref: 'Error' }))

export type Error = v.InferOutput<typeof ErrorSchema>

export const LimitParamsSchema = resolver(
  v.pipe(
    v.string(),
    v.transform(Number),
    v.number(),
    v.safeInteger(),
    v.minValue(1),
    v.maxValue(100),
  ),
)
export const RequestIdParamsSchema = resolver(v.string())

export const TotalCountHeaderSchema = resolver(v.pipe(v.number(), v.integer()))

export const ApiKeySecurityScheme = { type: 'apiKey', in: 'header', name: 'X-API-Key' }

export const NewPetRequestBody = {
  required: true,
  content: { 'application/json': { schema: resolver(NewPetSchema) } },
}

export const NotFoundResponse = {
  description: 'Not found',
  content: { 'application/json': { schema: resolver(ErrorSchema) } },
}
export const BadRequestResponse = { description: 'Bad request' }
