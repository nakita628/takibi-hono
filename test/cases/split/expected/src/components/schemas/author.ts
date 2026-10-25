import * as z from 'zod'
import { PostSchema } from './post'

type AuthorType = { readonly name?: string; readonly posts?: readonly z.infer<typeof PostSchema>[] }

export const AuthorSchema: z.ZodType<AuthorType> = z
  .object({
    name: z.string().exactOptional(),
    posts: z
      .array(z.lazy(() => PostSchema))
      .readonly()
      .exactOptional(),
  })
  .readonly()
  .meta({ ref: 'Author' })

export type Author = z.infer<typeof AuthorSchema>
