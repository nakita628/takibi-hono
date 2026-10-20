import { defineConfig } from 'takibi-hono/config'

// hono-takibi's cookie-params conformance document, generated with zod and hono-openapi; its
// suite runs against the app in conformance/cookie-params.
export default defineConfig({
  input: 'specs/conformance-cookie-params.yaml',
  schema: 'zod',
  openapi: true,
  output: '__generated__/conformance-cookie-params/src/handlers',
  components: { output: '__generated__/conformance-cookie-params/src/components/index.ts' },
})
