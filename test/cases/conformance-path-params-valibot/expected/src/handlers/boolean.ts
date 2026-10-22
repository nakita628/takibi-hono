import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { EchoResponse } from '../components'

export const booleanHandler = new Hono().get(
  '/boolean/:value',
  describeRoute({ operationId: 'booleanParam', responses: { '200': EchoResponse } }),
  validator(
    'param',
    v.object({
      value: v.pipe(
        v.picklist(['true', 'false']),
        v.transform((input) => input === 'true'),
      ),
    }),
  ),
  (c) => {},
)
