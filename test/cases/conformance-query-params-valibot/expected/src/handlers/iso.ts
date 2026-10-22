import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { FieldsResponse } from '../components'

export const isoHandler = new Hono().get(
  '/iso',
  describeRoute({ operationId: 'queryIso', responses: { '200': FieldsResponse } }),
  validator(
    'query',
    v.partial(
      v.object({
        datetime_z: v.pipe(v.string(), v.isoTimestamp()),
        datetime_p3: v.pipe(v.string(), v.isoTimestamp()),
        datetime_local: v.pipe(v.string(), v.isoTimestamp()),
        time_any: v.pipe(v.string(), v.isoTimeSecond()),
        time_z: v.pipe(v.string(), v.isoTimeSecond()),
        time_p0: v.pipe(v.string(), v.isoTimeSecond()),
        time_p3: v.pipe(v.string(), v.isoTimeSecond()),
        time_minute: v.pipe(v.string(), v.isoTimeSecond()),
      }),
    ),
  ),
  (c) => {},
)
