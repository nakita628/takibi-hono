import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Regenerates every case before the suite runs.
 *
 * `TAKIBI_HONO_SKIP_GENERATE=1` skips it, for running one file against output that is
 * already there: regeneration rewrites all of `__generated__` and `__app__`, so two runs at
 * once would read each other's half-written files.
 */
export default function setup() {
  if (process.env['TAKIBI_HONO_SKIP_GENERATE'] === '1') return
  const dir = path.dirname(fileURLToPath(import.meta.url))
  const result = spawnSync(process.execPath, [path.join(dir, 'generate.mjs')], {
    stdio: 'inherit',
  })
  if (result.status !== 0) {
    throw new Error(
      'takibi-hono code generation failed. Build the CLI first: vp run takibi-hono#build',
    )
  }
}
