import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { FieldsResponse } from '../components'

export const literalsHandler = new Hono().get(
  '/literals',
  describeRoute({ operationId: 'queryLiterals', responses: { '200': FieldsResponse } }),
  validator(
    'query',
    z.object({
      ienum: z.union([z.literal(1), z.literal(2), z.literal(3)]).exactOptional(),
      nenum: z.union([z.literal(1.5), z.literal(2.5)]).exactOptional(),
      benum: z.literal(true).exactOptional(),
      iconst: z.literal(7).exactOptional(),
      senum: z.enum(['asc', 'desc']).exactOptional(),
      sconst: z.literal('fixed').exactOptional(),
      numericsenum: z.enum(['1', '02', 'true']).exactOptional(),
      inull: z.coerce.number().int().nullable().exactOptional(),
      bnull: z.stringbool().nullable().exactOptional(),
      nullof: z.xor([z.coerce.number().int(), z.null().nullable()]).exactOptional(),
      inull_arr: z.array(z.coerce.number().int().nullable()).exactOptional(),
      inull_list: z.array(z.coerce.number().int()).nullable().exactOptional(),
      snull: z.string().nullable().exactOptional(),
      ioneof: z.xor([z.coerce.number().int(), z.literal('all')]).exactOptional(),
      ienum_arr: z.array(z.union([z.literal(1), z.literal(2), z.literal(3)])).exactOptional(),
      senum_arr: z.array(z.enum(['asc', 'desc'])).exactOptional(),
    }),
  ),
  (c) => {},
)
