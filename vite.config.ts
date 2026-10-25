import { defineConfig } from 'vite-plus'

// oxlint-disable-next-line import/no-default-export -- Vite resolves the config through its default export
export default defineConfig({
  // Single source of truth for formatting style. Vite+ merges this root config into every
  // workspace config, so `packages/takibi-hono` inherits these options and only declares what
  // is specific to it.
  //
  // `fmt.ignorePatterns` is inherited too, so keep every pattern here specific enough that it
  // matches nothing inside a workspace (a broad root-relative pattern such as `packages/**`
  // makes the workspaces' own `vp check` exclude every file). `fixtures/**` holds generator
  // output formatted by takibi-hono itself, and so do the golden copies, seeds and overlays
  // of the cases in `test/`. An example is formatted as the repository is (its config passes
  // the same `format`), except the rpc module, which hono-takibi formats on its own terms.
  fmt: {
    printWidth: 100,
    singleQuote: true,
    semi: false,
    sortPackageJson: true,
    experimentalSortImports: {},
    ignorePatterns: [
      'fixtures/**',
      'examples/*/src/rpc.ts',
      'test/cases/*/expected/**',
      'test/cases/*/seed/**',
      'test/cases/*/overlay/**',
      'test/conformance/*/valid.test.ts',
      'test/conformance/*/invalid.test.ts',
      'test/specs/conformance-*.yaml',
    ],
  },
})
