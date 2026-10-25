import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { EchoResponse } from '../components'

export const simplestrarrHandler = new Hono().get(
  '/simplestrarr/:value',
  describeRoute({ operationId: 'simplestrarrParam', responses: { '200': EchoResponse } }),
  validator(
    'param',
    type({
      value: type('unknown')
        .pipe((data) => (data === undefined || Array.isArray(data) ? data : [data]))
        .to('string[]'),
    }),
  ),
  (c) => {},
)
