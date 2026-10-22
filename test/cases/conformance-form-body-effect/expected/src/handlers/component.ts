import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Schema } from 'effect'
import { ItemSchema, FieldsResponse } from '../components'

export const componentHandler = new Hono().post(
  '/component',
  describeRoute({ operationId: 'component', responses: { '200': FieldsResponse } }),
  validator('form', Schema.toStandardSchemaV1(ItemSchema)),
  (c) => {},
)
