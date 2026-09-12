import devServer from '@hono/vite-dev-server'
import { takibiHonoVite } from 'takibi-hono/vite-plugin'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [devServer({ entry: 'src/index.ts' }), takibiHonoVite()],
})
