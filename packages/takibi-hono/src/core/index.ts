/**
 * Public API of the `core` orchestration layer.
 *
 * Each generator lives in its own directory (`<feature>/index.ts` for the
 * orchestrator + `<feature>/code.ts` for the low-level code generation) and
 * consumes a `Layout` plus the parsed `OpenAPI` document. `hono()` is the
 * one-shot entry point that runs them in sequence; CLIs can compose generators
 * directly when finer error handling is needed.
 */

export { makeApp } from './app/index.js'
export { makeComponents } from './components/index.js'
export { makeHandlers } from './handlers/index.js'
export { hono } from './hono.js'
export { resolveLayout } from './layout.js'
export { makeSchemas } from './schemas/index.js'
export { makeWebhooks } from './webhooks/index.js'
