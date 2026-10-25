import { resolver } from 'hono-openapi'
import { type } from 'arktype'

declare global {
  interface ArkEnv {
    meta(): { ref?: string }
  }
}

export const TagSchema = type("'dog' | 'cat' | 'bird'").configure({ ref: 'Tag' })

export type Tag = typeof TagSchema.infer

export const PetSchema = type({
  id: 'number.integer',
  name: type('string').narrow(
    (data, ctx) => [...data].length >= 1 || ctx.mustBe('at least 1 character'),
  ),
  'tag?': TagSchema,
})
  .describe('A pet in the store')
  .configure({ ref: 'Pet' })

export type Pet = typeof PetSchema.infer

export const NewPetSchema = type({
  name: type('string').narrow(
    (data, ctx) => [...data].length >= 1 || ctx.mustBe('at least 1 character'),
  ),
  'tag?': TagSchema,
}).configure({ ref: 'NewPet' })

export type NewPet = typeof NewPetSchema.infer

export const ErrorSchema = type({ message: 'string' }).configure({ ref: 'Error' })

export type Error = typeof ErrorSchema.infer

export const LimitParamsSchema = resolver(
  type('string')
    .pipe((data, ctx) => {
      const value = Number(data)
      return Number.isSafeInteger(value) ? value : ctx.error('an integer')
    })
    .to('number.integer >= 1 & number.integer <= 100'),
)
export const RequestIdParamsSchema = resolver(type('string'))

export const TotalCountHeaderSchema = resolver(type('number.integer'))

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
