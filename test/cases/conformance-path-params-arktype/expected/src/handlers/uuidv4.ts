import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { EchoResponse } from '../components'

export const uuidv4Handler = new Hono().get(
  '/uuidv4/:value',
  describeRoute({ operationId: 'uuidv4Param', responses: { '200': EchoResponse } }),
  validator('param', type({ value: 'string.uuid.v4' })),
  (c) => {},
)
