import { defineConfig } from 'takibi-hono/config'

// `split: true`: the app entry exports each first path segment as a group (`health`, `users`,
// `posts`) instead of `api`, `client` writes one client per group (`usersClient`), each typed
// by the routes of its group alone, and rpc calls the client of each operation's group.
export default defineConfig({
  input: 'openapi.yaml',
  schema: 'zod',
  openapi: true,
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
