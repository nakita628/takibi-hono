import * as z from 'zod'

export const UserSchema = z
  .object({
    id: z.uuid(),
    email: z.email(),
    role: z.enum(['admin', 'member']).default('member').exactOptional(),
  })
  .readonly()
  .meta({ ref: 'User' })

export type User = z.infer<typeof UserSchema>
