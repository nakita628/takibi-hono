import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { EchoResponse } from '../components'

export const inullHandler = new Hono().get(
  '/inull/:value',
  describeRoute({ operationId: 'inullParam', responses: { '200': EchoResponse } }),
  validator(
    'param',
    v.object({
      value: v.pipe(
        v.unknown(),
        v.transform((input) => (input === 'null' ? null : input)),
        v.nullable(
          v.pipe(
            v.string(),
            v.regex(/^-?(?:0|[1-9]\d*)$/),
            v.transform((input) => Number(input)),
            v.number(),
            v.safeInteger(),
          ),
        ),
      ),
    }),
  ),
  (c) => {},
)
