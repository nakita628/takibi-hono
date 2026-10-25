import { defineConfig } from 'takibi-hono/config'

// The definitions standing alone, without `template`: one file holding the components and the
// definition of every operation, as the one-shot `-o` writes it, and nothing else.
export default defineConfig({
  input: 'specs/petstore.yaml',
  schema: 'zod',
  defineHandler: { output: '__generated__/define-file/src/routes.ts' },
})
