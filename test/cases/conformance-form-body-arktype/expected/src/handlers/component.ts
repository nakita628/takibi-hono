import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { FieldsResponse } from '../components'

export const componentHandler = new Hono().post(
  '/component',
  describeRoute({ operationId: 'component', responses: { '200': FieldsResponse } }),
  validator(
    'form',
    type({
      name: 'string',
      price: type('string')
        .pipe((data, ctx) => {
          const value = Number(data)
          return Number.isSafeInteger(value) ? value : ctx.error('an integer')
        })
        .to('number.integer >= 0'),
      'stocked?': type(/^(?:true|1|yes|on|y|enabled|false|0|no|off|n|disabled)$/i).pipe((data) =>
        /^(?:true|1|yes|on|y|enabled)$/i.test(data),
      ),
    }),
  ),
  (c) => {},
)
