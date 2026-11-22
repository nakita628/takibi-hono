// `pnpm fix` at the repository root, as vite-plus plans it.
//
// The root `fix` script reaches into the workspaces through `vp run`, which appends whatever
// arguments it was given to the script it runs in each one. A workspace whose script cannot take
// them makes `pnpm fix` fail on every machine, and CI never runs `pnpm fix`, so this test reads
// the plan `vp run --dry-run --json` resolves for it (nothing is run) and pins the commands it
// would start in each workspace.
import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { expect, it } from 'vite-plus/test'

const workspaceDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const rootDir = path.dirname(workspaceDir)
const vp = path.join(rootDir, 'node_modules', '.bin', 'vp')

type Step = {
  readonly program?: string
  readonly args?: readonly string[]
  readonly plan?: Plan
}
type Plan = Readonly<Record<string, { readonly steps: readonly Step[] }>>

// Every step a task of a workspace (`<dir>#<task>`) would run, as `<dir>#<task>: <bin> <args>`,
// following each `vp run` the plan expands. The root's own steps (`fix`) are left out: their
// programs are resolved to absolute paths into the pnpm store.
const workspaceCommands = (plan: Plan): readonly string[] =>
  Object.entries(plan).flatMap(([key, task]) =>
    task.steps.flatMap((step) => {
      if (step.plan !== undefined) return workspaceCommands(step.plan)
      if (!key.includes('#') || step.program === undefined) return []
      return [`${key}: ${[path.basename(step.program), ...(step.args ?? [])].join(' ')}`]
    }),
  )

it('runs only commands that take --fix in the workspaces', () => {
  const output = execFileSync(vp, ['run', '-w', '--dry-run', '--json', 'fix'], {
    cwd: rootDir,
    encoding: 'utf8',
  })
  const { plan } = JSON.parse(output) as { readonly plan: Plan }
  expect(workspaceCommands(plan)).toStrictEqual([
    'packages/takibi-hono#fix: vp check --fix',
    'test#fix: vp check --fix',
  ])
})
