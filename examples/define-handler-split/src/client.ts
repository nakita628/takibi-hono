import { hc } from 'hono/client'

import type { health, posts, users } from '.'

type HealthClient = ReturnType<typeof hc<typeof health>>

const hcHealthWithType = (...args: Parameters<typeof hc>): HealthClient =>
  hc<typeof health>(...args)

export const healthClient = hcHealthWithType('/').api

type PostsClient = ReturnType<typeof hc<typeof posts>>

const hcPostsWithType = (...args: Parameters<typeof hc>): PostsClient => hc<typeof posts>(...args)

export const postsClient = hcPostsWithType('/').api

type UsersClient = ReturnType<typeof hc<typeof users>>

const hcUsersWithType = (...args: Parameters<typeof hc>): UsersClient => hc<typeof users>(...args)

export const usersClient = hcUsersWithType('/').api
