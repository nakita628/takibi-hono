import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { FieldsResponse } from '../components'

export const requiredHandler = new Hono().get(
  '/required',
  describeRoute({ operationId: 'queryRequired', responses: { '200': FieldsResponse } }),
  validator(
    'query',
    v.object({
      id: v.pipe(v.string(), v.transform(Number), v.number(), v.integer()),
      big: v.pipe(v.string(), v.transform(Number), v.number(), v.integer()),
      flag: v.pipe(
        v.picklist(['true', 'false']),
        v.transform((input) => input === 'true'),
      ),
      name: v.string(),
      tags: v.array(v.pipe(v.string(), v.transform(Number), v.number(), v.integer())),
      note: v.optional(v.pipe(v.string(), v.transform(Number), v.number(), v.integer())),
    }),
  ),
  (c) => {},
)
