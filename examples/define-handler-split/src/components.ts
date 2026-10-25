import * as z from 'zod'

export const UserSchema = z.object({ id: z.int(), name: z.string().min(1) })

export type User = z.infer<typeof UserSchema>

export const NewUserSchema = z.object({ name: z.string().min(1) })

export type NewUser = z.infer<typeof NewUserSchema>

export const PostSchema = z.object({ id: z.int(), authorId: z.int(), title: z.string().min(1) })

export type Post = z.infer<typeof PostSchema>

export const NewPostSchema = z.object({ authorId: z.int().min(1), title: z.string().min(1) })

export type NewPost = z.infer<typeof NewPostSchema>

export const ErrorSchema = z.object({ message: z.string() })

export type Error = z.infer<typeof ErrorSchema>
