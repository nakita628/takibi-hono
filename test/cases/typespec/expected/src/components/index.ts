import * as v from 'valibot'

export const TodoSchema = v.pipe(
  v.object({
    id: v.pipe(v.number(), v.integer(), v.minValue(-2147483648), v.maxValue(2147483647)),
    title: v.string(),
    done: v.boolean(),
  }),
  v.metadata({ ref: 'Todo' }),
)

export type Todo = v.InferOutput<typeof TodoSchema>
