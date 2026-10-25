import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { FieldsResponse } from '../components'

export const orgsHandler = new Hono().get(
  '/orgs/:orgId/repos/:repoId/issues/:issueId',
  describeRoute({ operationId: 'multiParam', responses: { '200': FieldsResponse } }),
  validator(
    'param',
    type({
      orgId: type('string').pipe((data, ctx) => {
        const value = Number(data)
        return Number.isSafeInteger(value) ? value : ctx.error('an integer')
      }),
      repoId: 'string.uuid',
      issueId: type('string')
        .pipe((data, ctx) => (/^-?\d+$/.test(data) ? BigInt(data) : ctx.error('an integer')))
        .narrow(
          (data, ctx) =>
            (data >= -9223372036854775808n && data <= 9223372036854775807n) ||
            ctx.mustBe('an int64'),
        ),
    }),
  ),
  (c) => {},
)
