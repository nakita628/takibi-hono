import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { FieldsResponse } from '../components'

export const limitsHandler = new Hono().get(
  '/limits',
  describeRoute({ operationId: 'queryLimits', responses: { '200': FieldsResponse } }),
  validator(
    'query',
    type({
      'range?': type('string.integer.parse').to(
        type('number.integer >= 1').and(type('number.integer <= 100')),
      ),
      'exclusive?': type('string.numeric.parse').to(type('number > 0').and(type('number < 1'))),
      'multiple?': type('string.integer.parse').to('number.integer % 5'),
      'int64range?': type('string.integer.parse').to(
        type('number.integer >= 1').and(type('number.integer <= 100')),
      ),
      'length?': type('2 <= string <= 4'),
      'pattern?': type('string').and(/^[a-z]+-\d{1,3}$/),
      'items?': type('string.integer.parse[]').and(type('2 <= unknown[] <= 3')),
      'unique?': type('string.integer.parse[]').narrow(
        (data: unknown[], ctx) => new Set(data).size === data.length,
      ),
      'ranged_items?': type(
        type('string.integer.parse').to(
          type('number.integer >= 1').and(type('number.integer <= 9')),
        ),
      ).array(),
    }),
  ),
  (c) => {},
)
