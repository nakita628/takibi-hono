import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { FieldsResponse } from '../components'

export const defaultsHandler = new Hono().get(
  '/defaults',
  describeRoute({ operationId: 'queryDefaults', responses: { '200': FieldsResponse } }),
  validator(
    'query',
    v.partial(
      v.object({
        int_def: v.optional(v.pipe(v.string(), v.transform(Number), v.number(), v.integer()), '20'),
        int64_def: v.optional(
          v.pipe(v.string(), v.transform(Number), v.number(), v.integer()),
          '5',
        ),
        num_def: v.optional(v.pipe(v.string(), v.transform(Number), v.number()), '0.5'),
        bool_def: v.optional(
          v.pipe(
            v.picklist(['true', 'false']),
            v.transform((input) => input === 'true'),
          ),
          'false',
        ),
        bool_def_true: v.optional(
          v.pipe(
            v.picklist(['true', 'false']),
            v.transform((input) => input === 'true'),
          ),
          'true',
        ),
        str_def: v.optional(v.string(), 'fallback'),
        enum_def: v.optional(v.picklist(['asc', 'desc']), 'asc'),
        arr_def: v.optional(v.array(v.string()), []),
        arr_int_def: v.optional(
          v.array(v.pipe(v.string(), v.transform(Number), v.number(), v.integer())),
          [1, 2],
        ),
      }),
    ),
  ),
  (c) => {},
)
