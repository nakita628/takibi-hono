import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { EchoResponse } from '../components'

export const guidHandler = new Hono().get(
  '/guid/:value',
  describeRoute({ operationId: 'guidParam', responses: { '200': EchoResponse } }),
  validator(
    'param',
    type({
      value: type(
        /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/,
      ),
    }),
  ),
  (c) => {},
)
