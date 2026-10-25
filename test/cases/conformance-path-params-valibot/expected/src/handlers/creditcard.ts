import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { EchoResponse } from '../components'

export const creditcardHandler = new Hono().get(
  '/creditcard/:value',
  describeRoute({ operationId: 'creditcardParam', responses: { '200': EchoResponse } }),
  validator('param', v.object({ value: v.pipe(v.string(), v.creditCard()) })),
  (c) => {},
)
