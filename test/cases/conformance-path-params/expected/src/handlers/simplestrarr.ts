import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { EchoResponse } from '../components'

export const simplestrarrHandler = new Hono().get(
  '/simplestrarr/:value',
  describeRoute({ operationId: 'simplestrarrParam', responses: { '200': EchoResponse } }),
  validator(
    'param',
    z.object({
      value: z.preprocess(
        (val) => (val === undefined || Array.isArray(val) ? val : [val]),
        z.array(z.string()),
      ),
    }),
  ),
  (c) => {},
)
