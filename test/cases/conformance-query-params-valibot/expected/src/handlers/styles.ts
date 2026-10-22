import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { FieldsResponse } from '../components'

export const stylesHandler = new Hono().get(
  '/styles',
  describeRoute({ operationId: 'queryStyles', responses: { '200': FieldsResponse } }),
  validator(
    'query',
    v.partial(
      v.object({
        csv: v.array(v.pipe(v.string(), v.transform(Number), v.number(), v.integer())),
        pipes: v.array(v.pipe(v.string(), v.transform(Number), v.number(), v.integer())),
        spaces: v.array(v.pipe(v.string(), v.transform(Number), v.number(), v.integer())),
        filter: v.partial(
          v.object({
            name: v.string(),
            age: v.pipe(v.string(), v.transform(Number), v.number(), v.integer()),
          }),
        ),
        csv_str: v.array(v.string()),
      }),
    ),
  ),
  (c) => {},
)
