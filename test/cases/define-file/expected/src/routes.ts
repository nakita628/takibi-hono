import { defineHandler } from 'hono/factory'
import * as z from 'zod'

export const TagSchema = z.enum(['dog', 'cat', 'bird'])

export type Tag = z.infer<typeof TagSchema>

export const PetSchema = z
  .object({ id: z.int(), name: z.string().min(1), tag: TagSchema.exactOptional() })
  .meta({ description: 'A pet in the store' })

export type Pet = z.infer<typeof PetSchema>

export const NewPetSchema = z.object({ name: z.string().min(1), tag: TagSchema.exactOptional() })

export type NewPet = z.infer<typeof NewPetSchema>

export const ErrorSchema = z.object({ message: z.string() })

export type Error = z.infer<typeof ErrorSchema>

export const LimitParamsSchema = z.coerce.number().int().min(1).max(100)
export const RequestIdParamsSchema = z.string()

export const TotalCountHeaderSchema = z.int()

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

export const getHandler = defineHandler({ response: z.object({ status: z.literal('ok') }) })

export const getPetsHandler = defineHandler({
  query: z.object({
    limit: z.coerce.number().int().min(1).max(100).exactOptional(),
    tag: TagSchema.exactOptional(),
  }),
  header: z.object({ 'x-request-id': z.string().exactOptional() }),
  cookie: z.object({ session: z.string().exactOptional() }),
  response: z.array(PetSchema),
})

export const postPetsHandler = defineHandler({
  header: z.object({ 'x-request-id': z.string().exactOptional() }),
  json: NewPetSchema,
  response: PetSchema,
})

export const headPetsHandler = defineHandler({
  header: z.object({ 'x-request-id': z.string().exactOptional() }),
})

export const getPetsPetIdHandler = defineHandler({
  param: z.object({ petId: z.coerce.number().int().min(1) }),
  response: PetSchema,
})

export const deletePetsPetIdHandler = defineHandler({
  param: z.object({ petId: z.coerce.number().int() }),
})

export const postPetsPetIdPhotosHandler = defineHandler({
  param: z.object({ petId: z.coerce.number().int() }),
  form: z.object({ caption: z.string().min(1), featured: z.stringbool().exactOptional() }),
})

export const get202401ReportsHandler = defineHandler({ response: z.array(z.string()) })
