import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { EchoResponse } from '../components'

export const cidrv4Handler = new Hono().get(
  '/cidrv4/:value',
  describeRoute({ operationId: 'cidrv4Param', responses: { '200': EchoResponse } }),
  validator(
    'param',
    type({
      value: type(
        /^((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/([0-9]|[1-2][0-9]|3[0-2])$/,
      ),
    }),
  ),
  (c) => {},
)
