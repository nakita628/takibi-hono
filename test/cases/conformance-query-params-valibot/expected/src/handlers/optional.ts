import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { FieldsResponse } from '../components'

export const optionalHandler = new Hono().get(
  '/optional',
  describeRoute({ operationId: 'queryOptional', responses: { '200': FieldsResponse } }),
  validator(
    'query',
    v.partial(
      v.object({
        int_opt: v.pipe(v.string(), v.transform(Number), v.number(), v.integer()),
        int64_opt: v.pipe(v.string(), v.transform(Number), v.number(), v.integer()),
        num_opt: v.pipe(v.string(), v.transform(Number), v.number()),
        bool_opt: v.pipe(
          v.picklist(['true', 'false']),
          v.transform((input) => input === 'true'),
        ),
        str_opt: v.string(),
        uuid_opt: v.pipe(v.string(), v.uuid()),
        arr_opt: v.array(v.pipe(v.string(), v.transform(Number), v.number(), v.integer())),
        'page-size': v.pipe(v.string(), v.transform(Number), v.number(), v.integer()),
        'filter[name]': v.string(),
        $top: v.pipe(v.string(), v.transform(Number), v.number(), v.integer()),
        'user.id': v.pipe(v.string(), v.transform(Number), v.number(), v.integer()),
        'ids[]': v.array(v.pipe(v.string(), v.transform(Number), v.number(), v.integer())),
        Int_Opt: v.string(),
        constructor: v.pipe(v.string(), v.transform(Number), v.number(), v.integer()),
      }),
    ),
  ),
  (c) => {},
)
