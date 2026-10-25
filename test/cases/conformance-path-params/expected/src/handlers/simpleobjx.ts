import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { EchoResponse } from '../components'

export const simpleobjxHandler = new Hono().get(
  '/simpleobjx/:value',
  describeRoute({ operationId: 'simpleobjxParam', responses: { '200': EchoResponse } }),
  validator(
    'param',
    z.object({
      value: z.object({
        a: z.coerce.number().int().exactOptional(),
        b: z.string().exactOptional(),
      }),
    }),
  ),
  (c) => {},
)
