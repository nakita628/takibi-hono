// What `split: true` gives a caller: one client per group, each typed by the routes of its
// group alone. `tsc` (`pnpm check`) holds these lines: each `@ts-expect-error` stops the build
// the day a client starts to carry another group's routes again.
import { healthClient, postsClient, usersClient } from './client'

export const listUsers = usersClient.users.$get
export const getUser = usersClient.users[':userId'].$get
export const listPosts = postsClient.posts.$get
export const health = healthClient.health.$get

// @ts-expect-error -- the posts routes are the `posts` group's, not the `users` group's
export const postsFromUsers = usersClient.posts

// @ts-expect-error -- the users routes are the `users` group's, not the `posts` group's
export const usersFromPosts = postsClient.users

// @ts-expect-error -- `health` has its own route alone
export const usersFromHealth = healthClient.users
