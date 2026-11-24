import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { EchoResponse } from '../components'

export const oneofHandler = new Hono().get(
  '/oneof/:value',
  describeRoute({ operationId: 'oneofParam', responses: { '200': EchoResponse } }),
  validator(
    'param',
    v.object({
      value: v.union([
        v.pipe(
          v.string(),
          v.regex(/^-?(?:0|[1-9]\d*)$/),
          v.metadata({ type: 'integer' }),
          v.transform((input) => Number(input)),
          v.number(),
          v.safeInteger(),
        ),
        v.literal('all'),
      ]),
    }),
  ),
  (c) => {},
)
