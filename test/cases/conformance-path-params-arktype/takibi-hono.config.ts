import { defineConfig } from 'takibi-hono/config'

// hono-takibi's path-params conformance document, generated with arktype and hono-openapi; the
// scorecard runs its suite against this app with TAKIBI_HONO_CONFORMANCE_LIB=arktype.
export default defineConfig({
  input: 'specs/conformance-path-params.yaml',
  schema: 'arktype',
  openapi: true,
  output: '__generated__/conformance-path-params-arktype/src/handlers',
  components: { output: '__generated__/conformance-path-params-arktype/src/components/index.ts' },
})
