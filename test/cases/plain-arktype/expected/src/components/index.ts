import { type } from 'arktype'

export const TagSchema = type("'dog' | 'cat' | 'bird'")

export type Tag = typeof TagSchema.infer

export const PetSchema = type({
  id: 'number.integer',
  name: type('string').narrow(
    (data, ctx) => [...data].length >= 1 || ctx.mustBe('at least 1 character'),
  ),
  'tag?': TagSchema,
}).describe('A pet in the store')

export type Pet = typeof PetSchema.infer

export const NewPetSchema = type({
  name: type('string').narrow(
    (data, ctx) => [...data].length >= 1 || ctx.mustBe('at least 1 character'),
  ),
  'tag?': TagSchema,
})

export type NewPet = typeof NewPetSchema.infer

export const ErrorSchema = type({ message: 'string' })

export type Error = typeof ErrorSchema.infer

export const LimitParamsSchema = type('string')
  .pipe((data, ctx) => {
    const value = Number(data)
    return Number.isSafeInteger(value) ? value : ctx.error('an integer')
  })
  .to('number.integer >= 1 & number.integer <= 100')
export const RequestIdParamsSchema = type('string')

export const TotalCountHeaderSchema = type('number.integer')

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
