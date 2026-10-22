import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { FieldsResponse } from '../components'

export const inheritedHandler = new Hono().get(
  '/inherited',
  describeRoute({ operationId: 'queryInherited', responses: { '200': FieldsResponse } }),
  validator(
    'query',
    v.object({
      toString: v.string(),
      valueOf: v.optional(
        v.optional(v.pipe(v.string(), v.transform(Number), v.number(), v.integer()), '3'),
      ),
      hasOwnProperty: v.optional(
        v.pipe(
          v.picklist(['true', 'false']),
          v.transform((input) => input === 'true'),
        ),
      ),
      isPrototypeOf: v.optional(
        v.array(v.pipe(v.string(), v.transform(Number), v.number(), v.integer())),
      ),
      toLocaleString: v.optional(v.pipe(v.string(), v.transform(Number), v.number(), v.integer())),
    }),
  ),
  (c) => {},
)
