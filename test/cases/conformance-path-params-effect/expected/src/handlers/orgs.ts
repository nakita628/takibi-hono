import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Schema } from 'effect'
import { FieldsResponse } from '../components'

export const orgsHandler = new Hono().get(
  '/orgs/:orgId/repos/:repoId/issues/:issueId',
  describeRoute({ operationId: 'multiParam', responses: { '200': FieldsResponse } }),
  validator(
    'param',
    Schema.toStandardSchemaV1(
      Schema.Struct({
        orgId: Schema.NumberFromString.check(Schema.isInt()),
        repoId: Schema.String.check(Schema.isUUID()),
        issueId: Schema.NumberFromString.check(Schema.isInt()),
      }),
    ),
  ),
  (c) => {},
)
