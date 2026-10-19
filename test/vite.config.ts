import { defineConfig } from 'vite-plus'

// oxlint-disable-next-line import/no-default-export -- Vite resolves the config through its default export
export default defineConfig({
  test: {
    include: [
      // Self-contained concern directories: `<name>/<name>.test.ts` beside its own document
      // and config (the Vite plugin, which reads its config from the working directory).
      '*/*.test.ts',
      'runtime/**/*.test.ts',
    ],
    exclude: ['**/node_modules/**'],
    // Regenerates __generated__ and __app__ from the cases before the suite runs (needs
    // takibi-hono built).
    globalSetup: ['./scripts/global-setup.ts'],
    // The Vite plugin test changes directory, which must not leak into another file.
    pool: 'forks',
    // Importing a generated app pulls the schema library and hono-openapi in; compiling
    // TypeSpec and spawning tsc take longer still.
    testTimeout: 60_000,
  },
  lint: {
    ignorePatterns: [
      '**/node_modules/**',
      '**/__generated__/**',
      '**/__app__/**',
      // Generator output committed as the golden copy, and the files copied beside it: they
      // are the generator's words, formatted by the generator, not this workspace's code.
      'cases/*/expected/**',
      'cases/*/seed/**',
      'cases/*/overlay/**',
    ],
    env: { node: true, es2024: true },
    // Setting `plugins` replaces oxlint's default list — restate the defaults, then add
    // import and vitest (every source here is test code or its harness).
    plugins: ['typescript', 'unicorn', 'oxc', 'import', 'vitest'],
    options: {
      typeAware: true,
      typeCheck: true,
      reportUnusedDisableDirectives: 'deny',
      denyWarnings: true,
    },
    categories: {
      correctness: 'error',
      suspicious: 'error',
      perf: 'error',
    },
    // Strict by design, as in packages/takibi-hono: exceptions live next to the code as
    // `oxlint-disable-next-line` with a reason. Everything here is test code or its harness,
    // so the cast / `any` allowances of the package's `**/*.test.ts` override apply to the
    // whole workspace, and the rules that exist only to police casts are left out.
    rules: {
      eqeqeq: 'error',
      'no-new-func': 'error',
      'no-return-assign': 'error',
      'no-else-return': 'error',
      'no-lonely-if': 'error',
      'prefer-object-spread': 'error',
      'symbol-description': 'error',
      'typescript/no-deprecated': 'error',
      'typescript/restrict-plus-operands': 'error',
      'typescript/no-confusing-void-expression': 'error',
      'typescript/only-throw-error': 'error',
      'typescript/prefer-promise-reject-errors': 'error',
      'typescript/prefer-reduce-type-parameter': 'error',
      'typescript/prefer-includes': 'error',
      'typescript/prefer-string-starts-ends-with': 'error',
      'typescript/prefer-optional-chain': 'error',
      'typescript/use-unknown-in-catch-callback-variable': 'error',
      'typescript/return-await': 'error',
      'unicorn/no-await-expression-member': 'error',
      'unicorn/prefer-node-protocol': 'error',
      'unicorn/prefer-string-slice': 'error',
      'unicorn/prefer-at': 'error',
      'unicorn/explicit-length-check': 'error',
      'unicorn/throw-new-error': 'error',
      'import/no-default-export': 'error',
      'import/no-mutable-exports': 'error',
      'import/first': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      'no-param-reassign': ['error', { props: true }],
      'no-console': 'error',
      'no-plusplus': 'error',
      'typescript/no-non-null-assertion': 'error',
      'typescript/consistent-type-imports': 'error',
      'typescript/no-misused-promises': 'error',
      'typescript/require-await': 'error',
      'typescript/prefer-readonly': 'error',
      'typescript/prefer-nullish-coalescing': 'error',
      'typescript/switch-exhaustiveness-check': 'error',
      'unicorn/no-array-for-each': 'error',
      'unicorn/prefer-array-some': 'error',
      'unicorn/prefer-spread': 'error',
      'unicorn/prefer-string-replace-all': 'error',
      'import/no-cycle': 'error',
      'import/no-duplicates': 'error',
      'vitest/no-identical-title': 'error',
      'vitest/valid-expect': 'error',
      'vitest/valid-title': 'error',
      'vitest/valid-describe-callback': 'error',
      'vitest/no-standalone-expect': 'error',
      'vitest/no-test-return-statement': 'error',
      'vitest/no-test-prefixes': 'error',
      'vitest/no-duplicate-hooks': 'error',
      'vitest/prefer-hooks-on-top': 'error',
      'vitest/prefer-hooks-in-order': 'error',
      // `it` everywhere, inside and outside a describe, as in packages/takibi-hono.
      'vitest/consistent-test-it': ['error', { fn: 'it', withinDescribe: 'it' }],
      'vitest/no-alias-methods': 'error',
      'vitest/prefer-equality-matcher': 'error',
      'vitest/require-to-throw-message': 'error',
      'vitest/prefer-each': 'error',
      'vitest/prefer-spy-on': 'error',
      'vitest/no-mocks-import': 'error',
    },
    overrides: [
      {
        // The CLI reads a config file through its default export, and so does vitest its
        // globalSetup module.
        files: ['**/takibi-hono.config.ts', 'scripts/global-setup.ts'],
        rules: { 'import/no-default-export': 'off' },
      },
      {
        // A runtime test imports a generated app by a path built at run time, which TypeScript
        // can only type as `any`; the cast to the app's shape is the one that gives the test
        // its types, as the package's own `**/*.test.ts` override allows.
        files: ['**/*.test.ts'],
        rules: {
          'typescript/consistent-type-assertions': 'off',
          'typescript/no-unsafe-type-assertion': 'off',
        },
      },
    ],
  },
  // Style (printWidth / quotes / semicolons / import sorting) is inherited from the root
  // vite.config.ts; only the paths this workspace skips are declared here.
  fmt: {
    ignorePatterns: [
      '**/node_modules/**',
      '**/__generated__/**',
      '**/__app__/**',
      'cases/*/expected/**',
      'cases/*/seed/**',
      'cases/*/overlay/**',
    ],
  },
})
