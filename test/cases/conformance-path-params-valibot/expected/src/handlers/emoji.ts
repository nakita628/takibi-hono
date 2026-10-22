import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { EchoResponse } from '../components'

export const emojiHandler = new Hono().get(
  '/emoji/:value',
  describeRoute({ operationId: 'emojiParam', responses: { '200': EchoResponse } }),
  validator('param', v.object({ value: v.pipe(v.string(), v.emoji()) })),
  (c) => {},
)
