// The data the handlers serve, in memory: enough to see every operation answer.
import type { Post, User } from './api'

const users: User[] = [{ id: 1, name: 'Ada' }]
const posts: Post[] = [{ id: 1, authorId: 1, title: 'Hello' }]

export const store = {
  users: () => users,
  user: (id: number) => users.find((user) => user.id === id),
  addUser: (name: string) => {
    const user = { id: users.length + 1, name }
    users.push(user)
    return user
  },
  posts: (authorId?: number) =>
    authorId === undefined ? posts : posts.filter((post) => post.authorId === authorId),
  addPost: (authorId: number, title: string) => {
    const post = { id: posts.length + 1, authorId, title }
    posts.push(post)
    return post
  },
}
