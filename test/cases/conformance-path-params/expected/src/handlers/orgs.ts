import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { FieldsResponse } from '../components'

export const orgsHandler = new Hono().get(
  '/orgs/:orgId/repos/:repoId/issues/:issueId',
  describeRoute({ operationId: 'multiParam', responses: { '200': FieldsResponse } }),
  validator(
    'param',
    z.object({
      orgId: z.preprocess(
        (val) => (typeof val === 'string' && /^-?(?:0|[1-9]\d*)$/.test(val) ? Number(val) : val),
        z.number().int(),
      ),
      repoId: z.uuid(),
      issueId: z.coerce.bigint().pipe(z.int64()),
    }),
  ),
  (c) => {},
)
