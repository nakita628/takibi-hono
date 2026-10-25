import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { EchoResponse } from '../components'

export const timeHandler = new Hono().get(
  '/time/:value',
  describeRoute({ operationId: 'timeParam', responses: { '200': EchoResponse } }),
  validator(
    'param',
    v.object({
      value: v.pipe(
        v.string(),
        v.regex(
          /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d+)?)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)?$/,
        ),
      ),
    }),
  ),
  (c) => {},
)
