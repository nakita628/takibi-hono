import { defineConfig } from 'takibi-hono/config'

// hono-takibi's form-body conformance document, generated with zod and hono-openapi; its
// suite runs against the app in conformance/form-body.
export default defineConfig({
  input: 'specs/conformance-form-body.yaml',
  schema: 'zod',
  openapi: true,
  output: '__generated__/conformance-form-body/src/handlers',
  components: { output: '__generated__/conformance-form-body/src/components/index.ts' },
})
