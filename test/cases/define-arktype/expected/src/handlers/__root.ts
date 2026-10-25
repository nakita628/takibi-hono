import { Hono } from 'hono'
import { defineHandler } from 'hono/factory'
import { type } from 'arktype'

export const getHandler = defineHandler({
  response: { '~standard': type({ status: "'ok'" })['~standard'] },
})(async (c) => {})

export const rootHandler = new Hono().get('/', getHandler)
