import { Hono } from 'hono'
import { honoHandler, todosHandler } from './handlers'

const app = new Hono()

export const api = app.route('/', honoHandler).route('/', todosHandler)

export default app
