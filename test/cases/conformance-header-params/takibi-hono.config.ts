import { defineConfig } from 'takibi-hono/config'

// hono-takibi's header-params conformance document, generated with zod and hono-openapi; its
// suite runs against the app in conformance/header-params.
export default defineConfig({
  input: 'specs/conformance-header-params.yaml',
  schema: 'zod',
  openapi: true,
  output: '__generated__/conformance-header-params/src/handlers',
  components: { output: '__generated__/conformance-header-params/src/components/index.ts' },
})
