import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { FieldsResponse } from '../components'

export const openHandler = new Hono().get(
  '/open',
  describeRoute({ operationId: 'queryOpen', responses: { '200': FieldsResponse } }),
  validator(
    'query',
    v.partial(
      v.object({
        page: v.pipe(v.string(), v.transform(Number), v.number(), v.safeInteger()),
        extra: v.record(
          v.string(),
          v.pipe(v.string(), v.transform(Number), v.number(), v.safeInteger()),
        ),
      }),
    ),
  ),
  (c) => {},
)
