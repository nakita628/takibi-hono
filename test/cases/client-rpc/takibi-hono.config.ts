import { defineConfig } from 'takibi-hono/config'

// The typed client takibi-hono generates, and rpc over it. The app has a base path: the
// client is handed out from below it (`hcWithType('/').api`), so rpc addresses the document's
// paths (`client.pets.$get`) and the whole case type-checks.
export default defineConfig({
  input: 'specs/petstore.yaml',
  schema: 'zod',
  openapi: true,
  basePath: '/api',
  output: '__generated__/client-rpc/src/handlers',
  components: { output: '__generated__/client-rpc/src/components/index.ts' },
  client: { output: '__generated__/client-rpc/src/client.ts', credentials: 'include' },
  rpc: {
    output: '__generated__/client-rpc/src/rpc.ts',
    parseResponse: true,
    docs: true,
  },
})
