import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { EchoResponse } from '../components'

export const float32Handler = new Hono().get(
  '/float32/:value',
  describeRoute({ operationId: 'float32Param', responses: { '200': EchoResponse } }),
  validator(
    'param',
    z.object({
      value: z.preprocess(
        (val) =>
          typeof val === 'string' && /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(val)
            ? Number(val)
            : val,
        z.float32(),
      ),
    }),
  ),
  (c) => {},
)
