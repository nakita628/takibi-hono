import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { FieldsResponse } from '../components'

export const orgsHandler = new Hono().get(
  '/orgs/:orgId/repos/:repoId/issues/:issueId',
  describeRoute({ operationId: 'multiParam', responses: { '200': FieldsResponse } }),
  validator(
    'param',
    v.object({
      orgId: v.pipe(v.string(), v.transform(Number), v.number(), v.integer()),
      repoId: v.pipe(v.string(), v.uuid()),
      issueId: v.pipe(v.string(), v.transform(Number), v.number(), v.integer()),
    }),
  ),
  (c) => {},
)
