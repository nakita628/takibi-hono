import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Schema } from 'effect'
import { EchoResponse } from '../components'

export const uuidv4Handler = new Hono().get(
  '/uuidv4/:value',
  describeRoute({ operationId: 'uuidv4Param', responses: { '200': EchoResponse } }),
  validator(
    'param',
    Schema.toStandardSchemaV1(Schema.Struct({ value: Schema.String.check(Schema.isUUID(4)) })),
  ),
  (c) => {},
)
