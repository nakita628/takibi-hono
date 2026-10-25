// The app: `api`, the Hono the one-shot mode generated with every operation registered, mounted
// under a base path. Middleware and the not-found handler are the app's, so the generated file
// holds the operations alone.
import { Hono } from 'hono'

import { api } from './api'

const app = new Hono().basePath('/api')

export const routes = app.route('/', api)

app.notFound((c) => c.json({ message: 'no such route' }, 404))

export default app
