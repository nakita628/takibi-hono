import { hc } from 'hono/client'

import type { api } from '../index'

// What the generated rpc functions import: a typed Hono client over the generated app.
export const client = hc<typeof api>('http://localhost')
