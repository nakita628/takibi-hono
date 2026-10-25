// What `split: true` gives a caller: one client per group, each typed by the routes of its
// group alone, and each route's response typed by its `defineHandler` response schema. `tsc`
// (`pnpm check`) holds these lines.
import type { InferResponseType } from 'hono/client'

import { healthClient, postsClient, usersClient } from './client'

export const listUsers = usersClient.users.$get
export const getUser = usersClient.users[':userId'].$get
export const listPosts = postsClient.posts.$get
export const health = healthClient.health.$get

// The response of an operation is what its `response` schema parses to.
export type User = InferResponseType<typeof getUser, 200>
const user: User = { id: 1, name: 'Ada' }
export const typed = user

// @ts-expect-error -- the posts routes are the `posts` group's, not the `users` group's
export const postsFromUsers = usersClient.posts

// @ts-expect-error -- the users routes are the `users` group's, not the `posts` group's
export const usersFromPosts = postsClient.users
