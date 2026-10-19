import { Hono } from 'hono'
import { nodesHandler, usersHandler } from './routes'

const app = new Hono()

export const api = app.route('/', nodesHandler).route('/', usersHandler)

export default app
