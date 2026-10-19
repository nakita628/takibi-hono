import * as v from 'valibot'

export const TodoSchema = v.pipe(
  v.object({ id: v.pipe(v.number(), v.integer()), title: v.string(), done: v.boolean() }),
  v.metadata({ ref: 'Todo' }),
)

export type Todo = v.InferOutput<typeof TodoSchema>
