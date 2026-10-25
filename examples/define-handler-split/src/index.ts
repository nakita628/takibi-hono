import { Hono } from 'hono'

import { healthHandler, postsHandler, usersHandler } from './handlers'

const app = new Hono().basePath('/api')

export const health = app.route('/', healthHandler)

export const posts = app.route('/', postsHandler)

export const users = app.route('/', usersHandler)

export default app
