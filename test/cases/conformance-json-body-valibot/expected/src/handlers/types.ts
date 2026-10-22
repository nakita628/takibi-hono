import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { FieldsResponse } from '../components'

export const typesHandler = new Hono().post(
  '/types',
  describeRoute({ operationId: 'types', responses: { '200': FieldsResponse } }),
  validator(
    'json',
    v.partial(
      v.object({
        either: v.string(),
        flagged: v.nullable(v.number()),
        bounded: v.pipe(v.string(), v.minLength(2)),
        moment: v.pipe(v.string(), v.isoTimestamp()),
        clock: v.pipe(v.string(), v.isoTimeSecond()),
        inherited: v.partial(
          v.object({ constructor: v.pipe(v.number(), v.integer()), name: v.string() }),
        ),
        labelled: v.record(v.string(), v.pipe(v.number(), v.integer())),
      }),
    ),
  ),
  (c) => {},
)
