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
            age: v.pipe(
              v.string(),
              v.regex(/^-?(?:0|[1-9]\d*)$/),
              v.metadata({ type: 'integer' }),
              v.transform((input) => Number(input)),
              v.number(),
              v.safeInteger(),
            ),
          }),
        ),
        sort: v.partial(v.object({ name: v.string(), dir: v.picklist(['asc', 'desc']) })),
      }),
    ),
  ),
  (c) => {},
)
