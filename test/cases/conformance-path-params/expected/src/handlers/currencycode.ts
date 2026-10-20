import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { EchoResponse } from '../components'

export const currencycodeHandler = new Hono().get(
  '/currencycode/:value',
  describeRoute({ operationId: 'currencycodeParam', responses: { '200': EchoResponse } }),
  validator('param', z.object({ value: z.string() })),
  (c) => {},
)
