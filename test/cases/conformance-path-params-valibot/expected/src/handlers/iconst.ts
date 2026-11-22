import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { EchoResponse } from '../components'

export const iconstHandler = new Hono().get(
  '/iconst/:value',
  describeRoute({ operationId: 'iconstParam', responses: { '200': EchoResponse } }),
  validator(
    'param',
    v.object({
      value: v.pipe(
        v.string(),
        v.regex(/^-?(?:0|[1-9]\d*)$/),
        v.transform((input) => Number(input)),
        v.literal(7),
      ),
    }),
  ),
  (c) => {},
)
