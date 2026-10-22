import { defineConfig } from 'takibi-hono/config'

// hono-takibi's query-params conformance document, generated with effect and hono-openapi; the
// scorecard runs its suite against this app with TAKIBI_HONO_CONFORMANCE_LIB=effect.
export default defineConfig({
  input: 'specs/conformance-query-params.yaml',
  schema: 'effect',
  openapi: true,
  output: '__generated__/conformance-query-params-effect/src/handlers',
  components: { output: '__generated__/conformance-query-params-effect/src/components/index.ts' },
})
