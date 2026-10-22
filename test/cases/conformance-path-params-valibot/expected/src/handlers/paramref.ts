import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { EchoResponse } from '../components'

export const paramrefHandler = new Hono().get(
  '/paramref/:id',
  describeRoute({ operationId: 'paramrefParam', responses: { '200': EchoResponse } }),
  validator(
    'param',
    v.object({ id: v.pipe(v.string(), v.transform(Number), v.number(), v.integer()) }),
  ),
  (c) => {},
)
