// Every case with a tsconfig.json typechecks against its host libraries.
//
// Runs scripts/typecheck.mjs, which runs `tsc -p` on the tsconfig.json of every such case:
// the generated code with its handler stubs filled (__app__/<name>) plus the case's overlay.
// This is what proves that the validators the generator emits fit Hono's and hono-openapi's
// generics, that every import resolves (relative, through a path alias, or an `import`
// override), and that a `describeRoute` object satisfies `DescribeRouteOptions` — none of
// which a comparison of generated source can tell.
//
// A case without a tsconfig.json is golden only; its config says why.
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { expect, it } from 'vite-plus/test'

const testRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

// The script exits with 0 only when every case compiles. Its output, inherited by this
// process, names the case that failed and tsc's diagnostics.
it('generated code typechecks against host libraries (tsc -p per case)', () => {
  const result = spawnSync(process.execPath, [path.join(testRoot, 'scripts', 'typecheck.mjs')], {
    stdio: 'inherit',
  })
  expect(result.status).toBe(0)
}, 600_000)
