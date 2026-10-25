import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { EchoResponse } from '../components'

export const simplestrarrHandler = new Hono().get(
  '/simplestrarr/:value',
  describeRoute({ operationId: 'simplestrarrParam', responses: { '200': EchoResponse } }),
  validator(
    'param',
    v.object({
      value: v.pipe(
        v.unknown(),
        v.transform((input) => (input === undefined || Array.isArray(input) ? input : [input])),
        v.array(v.string()),
      ),
    }),
  ),
  (c) => {},
)
