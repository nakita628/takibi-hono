import * as z from 'zod'
import { AuthorSchema } from './author'

type PostType = { readonly title: string; readonly author?: z.infer<typeof AuthorSchema> }

export const PostSchema: z.ZodType<PostType> = z
  .object({ title: z.string(), author: z.lazy(() => AuthorSchema).exactOptional() })
  .readonly()
  .meta({ ref: 'Post' })

export type Post = z.infer<typeof PostSchema>
