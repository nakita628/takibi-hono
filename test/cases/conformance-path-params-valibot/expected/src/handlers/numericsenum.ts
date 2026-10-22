import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { EchoResponse } from '../components'

export const numericsenumHandler = new Hono().get(
  '/numericsenum/:value',
  describeRoute({ operationId: 'numericsenumParam', responses: { '200': EchoResponse } }),
  validator('param', v.object({ value: v.picklist(['1', '02', 'true']) })),
  (c) => {},
)
