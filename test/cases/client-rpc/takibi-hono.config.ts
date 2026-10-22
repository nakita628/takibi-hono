import { defineConfig } from 'takibi-hono/config'

// No `basePath` here: hono-takibi's rpc generator addresses the client by the spec's paths
// (`client.pets.$get`), while a Hono app with `.basePath('/api')` types its client as
// `client.api.pets`. The combination is pinned as it is by cases/client-hooks (golden only).
export default defineConfig({
  input: 'specs/petstore.yaml',
  schema: 'zod',
  openapi: true,
  output: '__generated__/client-rpc/src/handlers',
  components: { output: '__generated__/client-rpc/src/components/index.ts' },
  client: {
    rpc: {
      output: '__generated__/client-rpc/src/rpc.ts',
      import: './lib',
      client: 'client',
      parseResponse: true,
      docs: true,
    },
  },
})
