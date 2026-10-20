import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { EchoResponse } from '../components'

export const emojiHandler = new Hono().get(
  '/emoji/:value',
  describeRoute({ operationId: 'emojiParam', responses: { '200': EchoResponse } }),
  validator('param', z.object({ value: z.emoji() })),
  (c) => {},
)
