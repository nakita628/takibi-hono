import { Hono } from 'hono'
import { numbersHandler, typesHandler } from './handlers'

const app = new Hono()

export const api = app.route('/', numbersHandler).route('/', typesHandler)

export default app
