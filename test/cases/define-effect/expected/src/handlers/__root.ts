import { Hono } from 'hono'
import { defineHandler } from 'hono/factory'
import { Schema } from 'effect'

export const getHandler = defineHandler({
  response: Schema.toStandardSchemaV1(Schema.Struct({ status: Schema.Literal('ok') })),
})(async (c) => {})

export const rootHandler = new Hono().get('/', getHandler)
