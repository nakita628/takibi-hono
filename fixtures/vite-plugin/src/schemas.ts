import * as z from 'zod'

export const UserSchema = z.object({ id: z.string(), name: z.string() }).meta({ ref: 'User' })

export type User = z.infer<typeof UserSchema>
