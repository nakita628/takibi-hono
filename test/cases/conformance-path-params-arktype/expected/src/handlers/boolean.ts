import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { EchoResponse } from '../components'

export const booleanHandler = new Hono().get(
  '/boolean/:value',
  describeRoute({ operationId: 'booleanParam', responses: { '200': EchoResponse } }),
  validator(
    'param',
    type({
      value: type(/^(?:true|1|yes|on|y|enabled|false|0|no|off|n|disabled)$/i).pipe((data) =>
        /^(?:true|1|yes|on|y|enabled)$/i.test(data),
      ),
    }),
  ),
  (c) => {},
)
