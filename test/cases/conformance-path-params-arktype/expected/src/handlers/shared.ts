import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { EchoResponse } from '../components'

export const sharedHandler = new Hono()
  .get(
    '/shared/:id',
    describeRoute({ operationId: 'sharedGetParam', responses: { '200': EchoResponse } }),
    validator(
      'param',
      type({
        id: type('string').pipe((data, ctx) => {
          const value = Number(data)
          return Number.isSafeInteger(value) ? value : ctx.error('an integer')
        }),
      }),
    ),
    (c) => {},
  )
  .delete(
    '/shared/:id',
    describeRoute({ operationId: 'sharedDeleteParam', responses: { '200': EchoResponse } }),
    validator(
      'param',
      type({
        id: type('string').pipe((data, ctx) => {
          const value = Number(data)
          return Number.isSafeInteger(value) ? value : ctx.error('an integer')
        }),
      }),
    ),
    (c) => {},
  )
