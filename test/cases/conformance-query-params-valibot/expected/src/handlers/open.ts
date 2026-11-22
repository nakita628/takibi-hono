import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { FieldsResponse } from '../components'

export const openHandler = new Hono().get(
  '/open',
  describeRoute({ operationId: 'queryOpen', responses: { '200': FieldsResponse } }),
  validator(
    'query',
    v.partial(
      v.object({
        page: v.pipe(
          v.string(),
          v.regex(/^-?(?:0|[1-9]\d*)$/),
          v.transform((input) => Number(input)),
          v.number(),
          v.safeInteger(),
        ),
        extra: v.pipe(
          v.partial(v.looseObject({ known: v.string() })),
          v.check((input) =>
            Object.entries(input).every(
              ([key, value]) =>
                ['known'].includes(key) ||
                v.safeParse(
                  v.pipe(
                    v.string(),
                    v.regex(/^-?(?:0|[1-9]\d*)$/),
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
