import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { FieldsResponse } from '../components'

export const isoHandler = new Hono().get(
  '/iso',
  describeRoute({ operationId: 'queryIso', responses: { '200': FieldsResponse } }),
  validator(
    'query',
    type({
      'datetime_z?': 'string.date.iso',
      'datetime_p3?': 'string.date.iso',
      'datetime_local?': 'string.date.iso',
      'time_any?': 'string',
      'time_z?': 'string',
      'time_p0?': 'string',
      'time_p3?': 'string',
      'time_minute?': 'string',
    }),
  ),
  (c) => {},
)
