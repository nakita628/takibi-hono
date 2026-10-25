import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { FieldsResponse } from '../components'

export const typesHandler = new Hono().post(
  '/types',
  describeRoute({ operationId: 'types', responses: { '200': FieldsResponse } }),
  validator(
    'json',
    type({
      'either?': 'number.integer | string',
      'flagged?': 'number | boolean | null',
      'bounded?': type('number.integer >= 1').or(
        type('string').narrow(
          (data, ctx) => [...data].length >= 2 || ctx.mustBe('at least 2 characters'),
        ),
      ),
      'moment?': type(
        /^(?:(?:\d\d[2468][048]|\d\d[13579][26]|\d\d0[48]|[02468][048]00|[13579][26]00)-02-29|\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\d|30)|(?:02)-(?:0[1-9]|1\d|2[0-8])))T(?:(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z|([+-](?:[01]\d|2[0-3]):[0-5]\d)))$/,
      ),
      'clock?': type(
        /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d+)?)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)?$/,
      ),
      'inherited?': type({ 'constructor?': 'number.integer', 'name?': 'string' }),
      'labelled?': type({ '[string]': 'number.integer' }),
    }),
  ),
  (c) => {},
)
