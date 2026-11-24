import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { FieldsResponse } from '../components'

export const openHandler = new Hono().get(
  '/open',
  describeRoute({ operationId: 'cookieOpen', responses: { '200': FieldsResponse } }),
  validator(
    'cookie',
    v.partial(
      v.object({
        page: v.pipe(
          v.string(),
          v.regex(/^-?(?:0|[1-9]\d*)$/),
          v.metadata({ type: 'integer' }),
          v.transform((input) => Number(input)),
          v.number(),
          v.safeInteger(),
        ),
        bag: v.pipe(
          v.partial(v.looseObject({ known: v.string() })),
          v.check((input) =>
            Object.entries(input).every(
              ([key, value]) =>
                ['known'].includes(key) ||
                v.safeParse(
                  v.pipe(
                    v.string(),
                    v.regex(/^-?(?:0|[1-9]\d*)$/),
                    v.metadata({ type: 'integer' }),
                    v.transform((input) => Number(input)),
                    v.number(),
                    v.safeInteger(),
                  ),
                  value,
                ).success,
            ),
          ),
        ),
      }),
    ),
  ),
  (c) => {},
)
