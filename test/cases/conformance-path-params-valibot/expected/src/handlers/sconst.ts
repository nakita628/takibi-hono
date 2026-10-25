import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { EchoResponse } from '../components'

export const sconstHandler = new Hono().get(
  '/sconst/:value',
  describeRoute({ operationId: 'sconstParam', responses: { '200': EchoResponse } }),
  validator('param', v.object({ value: v.literal('fixed') })),
  (c) => {},
)
