import devServer from '@hono/vite-dev-server'
import { defineConfig } from 'vite'

// `pnpm dev` serves the app at http://localhost:5173/api; `pnpm generate` regenerates it from
// openapi.yaml, keeping the handler bodies.
export default defineConfig({
  plugins: [devServer({ entry: 'src/index.ts' })],
})
