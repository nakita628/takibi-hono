import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { EchoResponse } from '../components'

export const oneofHandler = new Hono().get(
  '/oneof/:value',
  describeRoute({ operationId: 'oneofParam', responses: { '200': EchoResponse } }),
  validator(
    'param',
    type({
      value: type('unknown').pipe((data, ctx) => {
        for (const branch of [
          type('string').pipe((data, ctx) => {
            const value = Number(data)
            return Number.isSafeInteger(value) ? value : ctx.error('an integer')
          }),
          type("'all'"),
        ]) {
          const out = branch(data)
          if (!(out instanceof type.errors)) return out
        }
        return ctx.error('one of the members')
      }),
    }),
  ),
  (c) => {},
)
