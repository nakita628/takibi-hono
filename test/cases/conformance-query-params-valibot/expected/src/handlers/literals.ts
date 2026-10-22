import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { FieldsResponse } from '../components'

export const literalsHandler = new Hono().get(
  '/literals',
  describeRoute({ operationId: 'queryLiterals', responses: { '200': FieldsResponse } }),
  validator(
    'query',
    v.partial(
      v.object({
        ienum: v.union([v.literal(1), v.literal(2), v.literal(3)]),
        nenum: v.union([v.literal(1.5), v.literal(2.5)]),
        benum: v.literal(true),
        iconst: v.literal(7),
        senum: v.picklist(['asc', 'desc']),
        sconst: v.literal('fixed'),
        numericsenum: v.picklist(['1', '02', 'true']),
        inull: v.nullable(v.pipe(v.string(), v.transform(Number), v.number(), v.integer())),
        bnull: v.nullable(
          v.pipe(
            v.picklist(['true', 'false']),
            v.transform((input) => input === 'true'),
          ),
        ),
        nullof: v.union([
          v.pipe(v.string(), v.transform(Number), v.number(), v.integer()),
          v.nullable(v.null()),
        ]),
        inull_arr: v.array(
          v.nullable(v.pipe(v.string(), v.transform(Number), v.number(), v.integer())),
        ),
        inull_list: v.nullable(
          v.array(v.pipe(v.string(), v.transform(Number), v.number(), v.integer())),
        ),
        snull: v.nullable(v.string()),
        ioneof: v.union([
          v.pipe(v.string(), v.transform(Number), v.number(), v.integer()),
          v.literal('all'),
        ]),
        ienum_arr: v.array(v.union([v.literal(1), v.literal(2), v.literal(3)])),
        senum_arr: v.array(v.picklist(['asc', 'desc'])),
      }),
    ),
  ),
  (c) => {},
)
