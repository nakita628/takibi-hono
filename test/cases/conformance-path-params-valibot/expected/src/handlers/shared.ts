import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { EchoResponse } from '../components'

export const sharedHandler = new Hono()
  .get(
    '/shared/:id',
    describeRoute({ operationId: 'sharedGetParam', responses: { '200': EchoResponse } }),
    validator(
      'param',
      v.object({ id: v.pipe(v.string(), v.transform(Number), v.number(), v.safeInteger()) }),
    ),
    (c) => {},
  )
  .delete(
    '/shared/:id',
    describeRoute({ operationId: 'sharedDeleteParam', responses: { '200': EchoResponse } }),
    validator(
      'param',
      v.object({ id: v.pipe(v.string(), v.transform(Number), v.number(), v.safeInteger()) }),
    ),
    (c) => {},
  )
