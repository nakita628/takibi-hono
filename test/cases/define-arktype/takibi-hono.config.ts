import { defineConfig } from 'takibi-hono/config'

// Hono's `defineHandler` (hono/factory) in place of the validator middleware: one
// `<method><Path>Handler` per operation, validating the request and the response inside the
// handler, registered on the group's Hono.
export default defineConfig({
  input: 'specs/petstore.yaml',
  schema: 'arktype',
  defineHandler: { output: '__generated__/define-arktype/src/routes.ts', template: true },
  basePath: '/api',
  output: '__generated__/define-arktype/src/handlers',
  components: { output: '__generated__/define-arktype/src/components/index.ts' },
})
