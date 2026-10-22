import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { EchoResponse } from '../components'

export const uuidv7Handler = new Hono().get(
  '/uuidv7/:value',
  describeRoute({ operationId: 'uuidv7Param', responses: { '200': EchoResponse } }),
  validator('param', v.object({ value: v.string() })),
  (c) => {},
)
