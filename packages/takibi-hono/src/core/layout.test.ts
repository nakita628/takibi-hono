import { describe, expect, it } from 'vite-plus/test'

import { makeSpecifier, resolveLayout } from './layout.js'

const base = { input: 'openapi.yaml', schema: 'zod' } as const

const aggregateTarget = (file: string) => ({ output: file, split: false, package: undefined })

describe('resolveLayout', () => {
  it('puts every component kind in src/components/index.ts by default', () => {
    const layout = resolveLayout(base)
    expect(layout.handlersDir).toBe('src/handlers')
    expect(layout.appDir).toBe('src')
    expect(layout.aggregate).toBe('src/components/index.ts')
    expect(layout.targets.schemas).toStrictEqual({
      ...aggregateTarget('src/components/index.ts'),
      exportTypes: true,
    })
    expect(layout.targets.responses).toStrictEqual({
      ...aggregateTarget('src/components/index.ts'),
      exportTypes: false,
    })
  })

  it.each([
    ['src/api/components.ts', 'src/api/components.ts'],
    ['src/api/components', 'src/api/components/index.ts'],
  ])('aggregates into components.output %s', (output, file) => {
    const { handlersDir, appDir, aggregate } = resolveLayout({
      ...base,
      output: 'app/routes',
      components: { output },
    })
    expect({ handlersDir, appDir, aggregate }).toStrictEqual({
      handlersDir: 'app/routes',
      appDir: 'app',
      aggregate: file,
    })
  })

  it('places only the configured kinds (schemas always) in per-kind mode', () => {
    const layout = resolveLayout({
      ...base,
      components: {
        responses: { output: 'src/responses', split: true, package: '@acme/responses' },
        parameters: { output: 'src/parameters.ts', split: true, exportTypes: true },
      },
    })
    expect(layout.aggregate).toBe(undefined)
    expect(layout.targets).toStrictEqual({
      schemas: {
        output: 'src/components/index.ts',
        split: false,
        exportTypes: false,
        package: undefined,
      },
      responses: {
        output: 'src/responses',
        split: true,
        exportTypes: false,
        package: '@acme/responses',
      },
      parameters: {
        output: 'src/parameters.ts',
        split: false,
        exportTypes: true,
        package: undefined,
      },
    })
  })
})

describe('resolveLayout: defineHandler', () => {
  it('has no definitions without defineHandler', () => {
    expect(resolveLayout(base).definitions).toBe(undefined)
  })

  it('places the definitions in routes.ts beside the app entry for `true`', () => {
    expect(
      resolveLayout({ ...base, output: 'app/handlers', defineHandler: true }).definitions,
    ).toStrictEqual({
      output: 'app/routes.ts',
      split: false,
      exportTypes: false,
      package: undefined,
    })
  })

  it('takes a target of their own, as a component kind', () => {
    expect(
      resolveLayout({
        ...base,
        defineHandler: { output: 'packages/routes/src', split: true, package: '@acme/routes' },
      }).definitions,
    ).toStrictEqual({
      output: 'packages/routes/src',
      split: true,
      exportTypes: false,
      package: '@acme/routes',
    })
  })
})

// `packages/` is a package of its own; everything else is the app's.
const twoPackages = (file: string) => (/(?:^|\/)packages\//u.test(file) ? '/pkg' : '/app')

describe('makeSpecifier', () => {
  const layout = resolveLayout(base)
  const target = {
    output: 'src/components/index.ts',
    split: false,
    exportTypes: false,
    package: undefined,
  }

  it.each([
    ['src/handlers', target, '../components'],
    ['src/components', target, '.'],
    ['src/handlers', { ...target, output: 'src/schemas', split: true }, '../schemas'],
    // `package` is for other packages: inside the same one the import stays relative.
    ['src/handlers', { ...target, package: '@acme/components' }, '../components'],
  ])('from %s', (fromDir, t, expected) => {
    expect(makeSpecifier(layout, fromDir, t)).toBe(expected)
  })

  it('imports a target of another package by its package name', () => {
    expect(
      makeSpecifier({ ...layout, packageRoot: twoPackages }, 'src/handlers', {
        ...target,
        output: 'packages/components/src/index.ts',
        package: '@acme/components',
      }),
    ).toBe('@acme/components')
  })

  it.each([
    ['a target in the app directory', target, '@/components'],
    [
      'a split target in the app directory',
      { ...target, output: 'src/schemas', split: true },
      '@/schemas',
    ],
    [
      'a target outside the app directory',
      { ...target, output: 'shared/components.ts' },
      '../../shared/components',
    ],
  ])('resolves %s through the path alias only inside the app directory', (_, t, expected) => {
    expect(makeSpecifier({ ...layout, pathAlias: '@/' }, 'src/handlers', t)).toBe(expected)
  })

  it('does not use the path alias from a file of another package', () => {
    const layoutWithAlias = { ...layout, pathAlias: '@/', packageRoot: twoPackages }
    expect(makeSpecifier(layoutWithAlias, 'packages/kit/src', target)).toBe(
      '../../../src/components',
    )
  })
})
