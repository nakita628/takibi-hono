import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { CountSchema, FlagSchema, FieldsResponse } from '../components'

export const urlencodedHandler = new Hono().post(
  '/urlencoded',
  describeRoute({ operationId: 'urlencoded', responses: { '200': FieldsResponse } }),
  validator(
    'form',
    z.preprocess(
      (val) =>
        typeof val === 'object' && val !== null && !Array.isArray(val)
          ? Object.assign(Object.create(null), val)
          : val,
      z.object({
        name: z.string().exactOptional(),
        age: z.coerce.number().int().min(0).exactOptional(),
        ratio: z.coerce.number().exactOptional(),
        big: z.coerce.bigint().pipe(z.int64()).exactOptional(),
        active: z.stringbool().exactOptional(),
        level: z.coerce
          .number()
          .pipe(z.union([z.literal(1), z.literal(2)]))
          .exactOptional(),
        agreed: z.stringbool().pipe(z.literal(true)).exactOptional(),
        limit: z.coerce.number().int().default(20).exactOptional(),
        count: CountSchema.exactOptional(),
        flag: FlagSchema.exactOptional(),
        tags: z
          .preprocess(
            (val) => (val === undefined || Array.isArray(val) ? val : [val]),
            z.array(z.string()),
          )
          .exactOptional(),
        ids: z
          .preprocess(
            (val) => (val === undefined || Array.isArray(val) ? val : [val]),
            z.array(z.coerce.number().int()),
          )
          .exactOptional(),
        moment: z.iso.datetime({ offset: true }).exactOptional(),
        clock: z
          .string()
          .regex(
            /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d+)?)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)?$/,
          )
          .exactOptional(),
        maybe: z
          .preprocess((val) => (val === 'null' ? null : val), z.coerce.number().int().nullable())
          .exactOptional(),
        label: z.string().nullable().exactOptional(),
        constructor: z.coerce.number().int().exactOptional(),
      }),
    ),
  ),
  (c) => {},
)
