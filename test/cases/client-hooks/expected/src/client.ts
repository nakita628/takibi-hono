import { hc } from 'hono/client'
import type { api } from '.'

const baseUrl = import.meta.env.VITE_API_URL!

type Client = ReturnType<typeof hc<typeof api>>

const hcWithType = (...args: Parameters<typeof hc>): Client => hc<typeof api>(...args)

export const client = hcWithType(baseUrl).api
