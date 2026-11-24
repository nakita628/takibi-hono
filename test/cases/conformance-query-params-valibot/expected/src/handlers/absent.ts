import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { FieldsResponse } from '../components'

export const absentHandler = new Hono().get(
  '/absent',
  describeRoute({ operationId: 'queryAbsent', responses: { '200': FieldsResponse } }),
  validator(
    'query',
    v.object({
      empty_ok: v.optional(
        v.pipe(
          v.string(),
          v.regex(/^-?(?:0|[1-9]\d*)$/),
          v.metadata({ type: 'integer' }),
          v.transform((input) => Number(input)),
          v.number(),
          v.safeInteger(),
        ),
      ),
      empty_def: v.pipe(
        v.optional(
          v.pipe(
            v.string(),
            v.regex(/^-?(?:0|[1-9]\d*)$/),
            v.metadata({ type: 'integer' }),
            v.transform((input) => Number(input)),
            v.number(),
            v.safeInteger(),
          ),
          '7',
        ),
        v.metadata({ default: 7 }),
      ),
      empty_str: v.optional(v.string()),
      ref_def: v.pipe(
        v.optional(
          v.pipe(
            v.string(),
            v.regex(/^-?(?:0|[1-9]\d*)$/),
            v.metadata({ type: 'integer', minimum: 0 }),
            v.transform((input) => Number(input)),
            v.number(),
            v.safeInteger(),
            v.minValue(0),
          ),
          '3',
        ),
        v.metadata({ default: 3 }),
      ),
    }),
  ),
  (c) => {},
)
