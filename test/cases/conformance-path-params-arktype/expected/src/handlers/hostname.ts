import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { EchoResponse } from '../components'

export const hostnameHandler = new Hono().get(
  '/hostname/:value',
  describeRoute({ operationId: 'hostnameParam', responses: { '200': EchoResponse } }),
  validator(
    'param',
    type({
      value: type(
        /^(?=.{1,253}\.?$)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[-0-9a-zA-Z]{0,61}[0-9a-zA-Z])?)*\.?$/,
      ),
    }),
  ),
  (c) => {},
)
