import * as v from 'valibot'

export const TagSchema = v.picklist(['dog', 'cat', 'bird'])

export type Tag = v.InferOutput<typeof TagSchema>

export const PetSchema = v.pipe(
  v.object({
    id: v.pipe(v.number(), v.integer()),
    name: v.pipe(v.string(), v.minCodePoints(1)),
    tag: v.optional(TagSchema),
  }),
  v.description('A pet in the store'),
)

export type Pet = v.InferOutput<typeof PetSchema>

export const NewPetSchema = v.object({
  name: v.pipe(v.string(), v.minCodePoints(1)),
  tag: v.optional(TagSchema),
})

export type NewPet = v.InferOutput<typeof NewPetSchema>

export const ErrorSchema = v.object({ message: v.string() })

export type Error = v.InferOutput<typeof ErrorSchema>

export const LimitParamsSchema = v.pipe(
  v.string(),
  v.transform(Number),
  v.number(),
  v.safeInteger(),
  v.minValue(1),
  v.maxValue(100),
)
export const RequestIdParamsSchema = v.string()

export const TotalCountHeaderSchema = v.pipe(v.number(), v.integer())

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
