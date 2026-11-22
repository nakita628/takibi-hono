// `pnpm fix` at the repository root, as vite-plus plans it.
//
// The root `fix` script reaches into the workspaces through `vp run`, which appends whatever
// arguments it was given to the script it runs in each one. A workspace whose script cannot take
// them makes `pnpm fix` fail on every machine, and CI never runs `pnpm fix`, so this test reads
// the plan `vp run --dry-run --json` resolves for it (nothing is run) and pins every command it
// would start, in the root and in each workspace.
import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { expect, it } from 'vite-plus/test'

const rootDir = path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url))))
// vite-plus's own entry, run by this node: `node_modules/.bin/vp` is a shell shim on POSIX and
// `vp.cmd` on Windows, neither of which `execFileSync` can start everywhere.
const vp = path.join(rootDir, 'node_modules', 'vite-plus', 'bin', 'vp')

type Step = {
  readonly program?: string
  readonly args?: readonly string[]
  readonly plan?: Plan
}
type Plan = Readonly<Record<string, { readonly steps: readonly Step[] }>>

// Every step of every task, as `<task>: <bin> <args>` (`fix` for the root's own task,
// `<dir>#<task>` for a workspace's), following each `vp run` the plan expands. A program, and
// an absolute path among its arguments, is named by its basename: vite-plus resolves some of
// them to absolute paths into the pnpm store (oxfmt runs as `node <store>/oxfmt/bin/oxfmt`).
const commands = (plan: Plan): readonly string[] =>
  Object.entries(plan).flatMap(([key, task]) =>
    task.steps.flatMap((step) => {
      if (step.plan !== undefined) return commands(step.plan)
      if (step.program === undefined) return []
      const args = (step.args ?? []).map((arg) => (path.isAbsolute(arg) ? path.basename(arg) : arg))
      return [`${key}: ${[path.basename(step.program), ...args].join(' ')}`]
    }),
  )

it('runs only commands that take the arguments it gives them', () => {
  const output = execFileSync(process.execPath, [vp, 'run', '-w', '--dry-run', '--json', 'fix'], {
    cwd: rootDir,
    encoding: 'utf8',
  })
  const { version, plan } = JSON.parse(output) as { readonly version: unknown; readonly plan: Plan }
  // The plan's format is vite-plus's; a new version of it fails here rather than in the walk.
  expect(version).toBe(1)
  expect(commands(plan)).toStrictEqual([
    'fix: node oxfmt',
    'packages/takibi-hono#fix: vp check --fix',
    'test#fix: vp check --fix',
    'fix: markdownlint-cli2 --fix',
    'fix: textlint --fix **/*.md',
  ])
})
