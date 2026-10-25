import { Hono } from 'hono'
import { defineHandler } from 'hono/factory'
import * as v from 'valibot'

export const getHandler = defineHandler({ response: v.object({ status: v.literal('ok') }) })(async (
  c,
) => {})

export const rootHandler = new Hono().get('/', getHandler)
