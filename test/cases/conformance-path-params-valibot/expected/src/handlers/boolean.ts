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
        v.string(),
        v.regex(/^(?:true|1|yes|on|y|enabled|false|0|no|off|n|disabled)$/i),
        v.transform((input) => /^(?:true|1|yes|on|y|enabled)$/i.test(input)),
      ),
    }),
  ),
  (c) => {},
)
