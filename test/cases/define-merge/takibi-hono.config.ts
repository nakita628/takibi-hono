import { defineConfig } from 'takibi-hono/config'

// Regeneration over a hand-edited defineHandler output (seed/): the handlers the user
// implemented, the middleware they put before one, their helper, their JSDoc and the import of
// their own from hono/factory survive; every options object is the spec's again.
export default defineConfig({
  input: 'specs/petstore.yaml',
  schema: 'zod',
  defineHandler: true,
  basePath: '/api',
  output: '__generated__/define-merge/src/handlers',
  components: { output: '__generated__/define-merge/src/components/index.ts' },
})
