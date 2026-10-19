import { Hono } from 'hono'
import { _202401Handler, rootHandler, petsHandler } from './handlers'

const app = new Hono()

export const api = app.route('/', _202401Handler).route('/', rootHandler).route('/', petsHandler)

export default app
