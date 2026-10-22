import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Schema } from 'effect'
import { EchoResponse } from '../components'

export const cidrv4Handler = new Hono().get(
  '/cidrv4/:value',
  describeRoute({ operationId: 'cidrv4Param', responses: { '200': EchoResponse } }),
  validator('param', Schema.toStandardSchemaV1(Schema.Struct({ value: Schema.String }))),
  (c) => {},
)
