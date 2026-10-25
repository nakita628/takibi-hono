import { defineConfig } from 'takibi-hono/config'

// hono-takibi's path-params conformance document, generated with zod and hono-openapi; its
// suite runs against the app in conformance/path-params.
export default defineConfig({
  input: 'specs/conformance-path-params.yaml',
  schema: 'zod',
  openapi: true,
  output: '__generated__/conformance-path-params/src/handlers',
  components: { output: '__generated__/conformance-path-params/src/components/index.ts' },
})
