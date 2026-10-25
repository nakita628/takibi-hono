import { defineConfig } from 'takibi-hono/config'

// hono-takibi's query-params conformance document, generated with zod and hono-openapi; its
// suite runs against the app in conformance/query-params.
export default defineConfig({
  input: 'specs/conformance-query-params.yaml',
  schema: 'zod',
  openapi: true,
  output: '__generated__/conformance-query-params/src/handlers',
  components: { output: '__generated__/conformance-query-params/src/components/index.ts' },
})
