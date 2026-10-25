import { resolver } from 'hono-openapi'
import { type } from 'arktype'

declare global {
  interface ArkEnv {
    meta(): { ref?: string }
  }
}

export const IdSchema = type('bigint | number.integer')
  .or(/^-?\d+$/)
  .pipe((data) => BigInt(data))
  .narrow(
    (data, ctx) =>
      (data >= -9223372036854775808n && data <= 9223372036854775807n) || ctx.mustBe('an int64'),
  )
  .narrow((data, ctx) => data >= 0n || ctx.mustBe('at least 0'))
  .configure({ ref: 'Id' })

export type Id = typeof IdSchema.infer

export const FieldsResponse = {
  description: 'Every validated field, by name, as the runtime typeof and the text of its value.',
  content: { 'application/json': { schema: resolver(type('unknown')) } },
}
