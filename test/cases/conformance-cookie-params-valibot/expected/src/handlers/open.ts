import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { FieldsResponse } from '../components'

export const openHandler = new Hono().get(
  '/open',
  describeRoute({ operationId: 'cookieOpen', responses: { '200': FieldsResponse } }),
  validator(
    'cookie',
    v.partial(
      v.object({
        page: v.pipe(v.string(), v.transform(Number), v.number(), v.safeInteger()),
        bag: v.record(
          v.string(),
          v.pipe(v.string(), v.transform(Number), v.number(), v.safeInteger()),
        ),
      }),
    ),
  ),
  (c) => {},
)
