import { defineConfig } from 'takibi-hono/config'

// The definitions as a target of their own: a directory with one file per definition and a
// barrel, imported by the handler files under the path alias; `split: true` for the app.
export default defineConfig({
  input: 'specs/petstore.yaml',
  schema: 'zod',
  defineHandler: { output: '__generated__/define-split/src/routes', split: true },
  basePath: '/api',
  split: true,
  pathAlias: '@/',
  output: '__generated__/define-split/src/handlers',
  components: { output: '__generated__/define-split/src/components/index.ts' },
})
