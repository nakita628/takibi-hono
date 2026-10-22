import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { FieldsResponse } from '../components'

export const sharedHandler = new Hono().get(
  '/shared',
  describeRoute({ operationId: 'queryShared', responses: { '200': FieldsResponse } }),
  validator(
    'query',
    v.partial(
      v.object({
        filter: v.partial(
          v.object({
            name: v.string(),
            age: v.pipe(v.string(), v.transform(Number), v.number(), v.integer()),
          }),
        ),
        sort: v.partial(v.object({ name: v.string(), dir: v.picklist(['asc', 'desc']) })),
      }),
    ),
  ),
  (c) => {},
)
