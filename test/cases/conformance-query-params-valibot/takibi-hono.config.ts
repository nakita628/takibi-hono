import { defineConfig } from 'takibi-hono/config'

// hono-takibi's query-params conformance document, generated with valibot and hono-openapi; the
// scorecard runs its suite against this app with TAKIBI_HONO_CONFORMANCE_LIB=valibot.
export default defineConfig({
  input: 'specs/conformance-query-params.yaml',
  schema: 'valibot',
  openapi: true,
  output: '__generated__/conformance-query-params-valibot/src/handlers',
  components: { output: '__generated__/conformance-query-params-valibot/src/components/index.ts' },
})
