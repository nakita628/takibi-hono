import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { FieldsResponse } from '../components'

export const inheritedHandler = new Hono().get(
  '/inherited',
  describeRoute({ operationId: 'queryInherited', responses: { '200': FieldsResponse } }),
  validator(
    'query',
    type('object')
      .pipe(
        (data) =>
          typeof data === 'object' && data !== null && !Array.isArray(data)
            ? Object.assign(Object.create(null), data)
            : data,
        type({
          toString: 'string',
          'valueOf?': type('string').pipe((data, ctx) => {
            const value = Number(data)
            return Number.isSafeInteger(value) ? value : ctx.error('an integer')
          }),
          'hasOwnProperty?': type(/^(?:true|1|yes|on|y|enabled|false|0|no|off|n|disabled)$/i).pipe(
            (data) => /^(?:true|1|yes|on|y|enabled)$/i.test(data),
          ),
          'isPrototypeOf?': type('unknown').pipe(
            (data) => (data === undefined || Array.isArray(data) ? data : [data]),
            type(
              type('string').pipe((data, ctx) => {
                const value = Number(data)
                return Number.isSafeInteger(value) ? value : ctx.error('an integer')
              }),
            ).array(),
          ),
          'toLocaleString?': type('string').pipe((data, ctx) => {
            const value = Number(data)
            return Number.isSafeInteger(value) ? value : ctx.error('an integer')
          }),
        }),
      )
      .pipe((data) => ({ ...data })),
  ),
  (c) => {},
)
