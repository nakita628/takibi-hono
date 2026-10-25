import type { InferRequestType, ClientRequestOptions } from 'hono/client'
import { parseResponse } from 'hono/client'
import { healthClient, usersClient, postsClient } from './client'

export async function getHealth(options?: ClientRequestOptions) {
  return await parseResponse(healthClient.health.$get(undefined, options))
}

export async function getUsers(
  args: InferRequestType<typeof usersClient.users.$get>,
  options?: ClientRequestOptions,
) {
  return await parseResponse(usersClient.users.$get(args, options))
}

export async function postUsers(
  args: InferRequestType<typeof usersClient.users.$post>,
  options?: ClientRequestOptions,
) {
  return await parseResponse(usersClient.users.$post(args, options))
}

export async function getUsersUserId(
  args: InferRequestType<(typeof usersClient.users)[':userId']['$get']>,
  options?: ClientRequestOptions,
) {
  return await parseResponse(usersClient.users[':userId'].$get(args, options))
}

export async function getPosts(
  args: InferRequestType<typeof postsClient.posts.$get>,
  options?: ClientRequestOptions,
) {
  return await parseResponse(postsClient.posts.$get(args, options))
}

export async function postPosts(
  args: InferRequestType<typeof postsClient.posts.$post>,
  options?: ClientRequestOptions,
) {
  return await parseResponse(postsClient.posts.$post(args, options))
}
