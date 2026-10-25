import { defineConfig } from 'takibi-hono/config'

// `defineHandler: true`: every operation is a `defineHandler` of its own (`postUsersHandler`),
// validating the request and the response inside the handler, registered on its group's Hono.
// `split: true` exports each first path segment (`health`, `users`, `posts`) as a group, with a
// client per group; rpc calls the client of each operation's group.
export default defineConfig({
  input: 'openapi.yaml',
  schema: 'zod',
  defineHandler: true,
  basePath: '/api',
  split: true,
  output: 'src/handlers',
  components: { output: 'src/components.ts' },
  client: { output: 'src/client.ts' },
  rpc: { output: 'src/rpc.ts', parseResponse: true },
  // The repository's own formatter settings (vite.config.ts at the root), so that the
  // generated files read as the hand-written ones beside them.
  format: { printWidth: 100, singleQuote: true, semi: false, experimentalSortImports: {} },
})
