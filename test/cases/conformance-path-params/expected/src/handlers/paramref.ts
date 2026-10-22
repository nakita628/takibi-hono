import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { EchoResponse } from '../components'

export const paramrefHandler = new Hono().get(
  '/paramref/:id',
  describeRoute({ operationId: 'paramrefParam', responses: { '200': EchoResponse } }),
  validator('param', z.object({ id: z.coerce.bigint().pipe(z.int64()) })),
  (c) => {},
)
