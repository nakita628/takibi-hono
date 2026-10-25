import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { EchoResponse } from '../components'

export const emojiHandler = new Hono().get(
  '/emoji/:value',
  describeRoute({ operationId: 'emojiParam', responses: { '200': EchoResponse } }),
  validator('param', type({ value: type(/^[\p{Extended_Pictographic}\p{Emoji_Component}]+$/u) })),
  (c) => {},
)
