import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { FieldsResponse } from '../components'

export const componentHandler = new Hono().post(
  '/component',
  describeRoute({ operationId: 'component', responses: { '200': FieldsResponse } }),
  validator(
    'form',
    v.object({
      name: v.string(),
      price: v.pipe(v.string(), v.transform(Number), v.number(), v.safeInteger(), v.minValue(0)),
      stocked: v.optional(
        v.pipe(
          v.string(),
          v.regex(/^(?:true|1|yes|on|y|enabled|false|0|no|off|n|disabled)$/i),
          v.transform((input) => /^(?:true|1|yes|on|y|enabled)$/i.test(input)),
        ),
      ),
    }),
  ),
  (c) => {},
)
