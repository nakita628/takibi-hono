import { Hono } from 'hono'
import { defineHandler } from 'hono/factory'
import { Schema } from 'effect'

export const get202401ReportsHandler = defineHandler({
  response: Schema.toStandardSchemaV1(Schema.Array(Schema.String)),
})(async (c) => {})

export const _202401Handler = new Hono().get('/2024-01/reports', get202401ReportsHandler)
