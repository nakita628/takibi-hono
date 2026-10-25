import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Schema } from 'effect'
import { PetSchema } from '../components'

export const webhooksHandler = new Hono().post(
  '/petAdded',
  describeRoute({
    operationId: 'onPetAdded',
    summary: 'A pet was added',
    responses: { '200': { description: 'Acknowledged' } },
  }),
  validator('json', Schema.toStandardSchemaV1(PetSchema)),
  (c) => {},
)
