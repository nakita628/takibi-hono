import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { FieldsResponse } from '../components'

export const inheritedHandler = new Hono().get(
  '/inherited',
  describeRoute({ operationId: 'queryInherited', responses: { '200': FieldsResponse } }),
  validator(
    'query',
    z.preprocess(
      (val) =>
        typeof val === 'object' && val !== null && !Array.isArray(val)
          ? Object.assign(Object.create(null), val)
          : val,
      z.object({
        toString: z.string(),
        valueOf: z
          .string()
          .regex(/^-?(?:0|[1-9]\d*)$/)
          .transform((val) => Number(val))
          .pipe(z.number().int())
          .default(3)
          .exactOptional(),
        hasOwnProperty: z.stringbool().exactOptional(),
        isPrototypeOf: z
          .preprocess(
            (val) => (val === undefined || Array.isArray(val) ? val : [val]),
            z.array(
              z
                .string()
                .regex(/^-?(?:0|[1-9]\d*)$/)
                .transform((val) => Number(val))
                .pipe(z.number().int()),
            ),
          )
          .exactOptional(),
        toLocaleString: z
          .string()
          .regex(/^-?(?:0|[1-9]\d*)$/)
          .transform((val) => Number(val))
          .pipe(z.number().int())
          .exactOptional(),
      }),
    ),
  ),
  (c) => {},
)
