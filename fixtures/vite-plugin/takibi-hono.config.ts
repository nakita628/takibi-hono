import { defineConfig } from 'takibi-hono/config'

export default defineConfig({
  input: 'main.tsp',
  schema: 'effect',
  openapi: true,
  'takibi-hono': {
    exportSchemasTypes: true,
  },  
})
