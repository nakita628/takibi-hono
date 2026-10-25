import { defineConfig } from 'takibi-hono/config'

// Golden only, no tsconfig.json: the query libraries the hooks import are not installed here.
const hook = (name: string) => ({ output: `__generated__/client-hooks/src/${name}.ts` }) as const

export default defineConfig({
  input: 'specs/petstore.yaml',
  schema: 'zod',
  openapi: true,
  basePath: '/api',
  output: '__generated__/client-hooks/src/handlers',
  components: { output: '__generated__/client-hooks/src/components/index.ts' },
  client: {
    output: '__generated__/client-hooks/src/client.ts',
    baseUrl: { env: 'VITE_API_URL' },
  },
  rpc: { output: '__generated__/client-hooks/src/rpc.ts' },
  swr: hook('swr'),
  'tanstack-query': hook('tanstack-query'),
  'svelte-query': hook('svelte-query'),
  'vue-query': hook('vue-query'),
  'preact-query': hook('preact-query'),
  'solid-query': hook('solid-query'),
  'angular-query': hook('angular-query'),
  type: { output: '__generated__/client-hooks/src/types.ts', readonly: true },
  docs: {
    output: '__generated__/client-hooks/src/docs.md',
    curl: true,
    baseUrl: 'http://localhost:3000',
  },
})
