import { defineConfig } from 'takibi-hono/config'

// `split`: the app entry exports each handler file as a group (`pets`, `__root`, `_202401`)
// instead of `api`, the client is one client per group (`petsClient`), and rpc calls the client
// of the group an operation belongs to. Each client is typed by its group's routes alone.
export default defineConfig({
  input: 'specs/petstore.yaml',
  schema: 'zod',
  openapi: true,
  basePath: '/api',
  split: true,
  output: '__generated__/client-split/src/handlers',
  components: { output: '__generated__/client-split/src/components/index.ts' },
  client: { output: '__generated__/client-split/src/client.ts' },
  rpc: { output: '__generated__/client-split/src/rpc.ts', parseResponse: true },
})
