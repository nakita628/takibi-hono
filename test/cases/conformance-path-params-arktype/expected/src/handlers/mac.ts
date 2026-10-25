import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { EchoResponse } from '../components'

export const macHandler = new Hono().get(
  '/mac/:value',
  describeRoute({ operationId: 'macParam', responses: { '200': EchoResponse } }),
  validator(
    'param',
    type({ value: type(/^(?:[0-9A-F]{2}:){5}[0-9A-F]{2}$|^(?:[0-9a-f]{2}:){5}[0-9a-f]{2}$/) }),
  ),
  (c) => {},
)
