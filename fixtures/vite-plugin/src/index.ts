import { Hono } from 'hono'
import { pingHandler } from './handlers'

const app = new Hono()

export const api = app.route('/', pingHandler)

export default app
