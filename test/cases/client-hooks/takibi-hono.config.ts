import { defineConfig } from 'takibi-hono/config'

const hook = (name: string) =>
  ({ output: `__generated__/client-hooks/src/${name}.ts`, import: './lib' }) as const

export default defineConfig({
  input: 'specs/petstore.yaml',
  schema: 'zod',
  openapi: true,
  basePath: '/api',
  output: '__generated__/client-hooks/src/handlers',
  components: { output: '__generated__/client-hooks/src/components' },
  client: {
    rpc: { output: '__generated__/client-hooks/src/rpc.ts', import: './lib' },
    swr: hook('swr'),
    tanstackQuery: hook('tanstack-query'),
    svelteQuery: hook('svelte-query'),
    vueQuery: hook('vue-query'),
    preactQuery: hook('preact-query'),
    solidQuery: hook('solid-query'),
    angularQuery: hook('angular-query'),
    type: { output: '__generated__/client-hooks/src/types.ts', readonly: true },
    docs: {
      output: '__generated__/client-hooks/src/docs',
      entry: 'src/index.ts',
      basePath: '/api',
      curl: true,
      baseUrl: 'http://localhost:3000',
    },
  },
})
