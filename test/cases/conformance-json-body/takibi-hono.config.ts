import { defineConfig } from 'takibi-hono/config'

// hono-takibi's json-body conformance document, generated with zod and hono-openapi; its
// suite runs against the app in conformance/json-body.
export default defineConfig({
  input: 'specs/conformance-json-body.yaml',
  schema: 'zod',
  openapi: true,
  output: '__generated__/conformance-json-body/src/handlers',
  components: { output: '__generated__/conformance-json-body/src/components/index.ts' },
})
