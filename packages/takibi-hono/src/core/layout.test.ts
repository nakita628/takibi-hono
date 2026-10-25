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
  it('has no definitions without defineHandler, and scaffolds', () => {
    const layout = resolveLayout(base)
    expect(layout.definitions).toBe(undefined)
    expect(layout.scaffold).toBe(true)
  })

  it('shares the definitions file with the components, and stands alone without template', () => {
    const layout = resolveLayout({ ...base, defineHandler: { output: 'src/routes.ts' } })
    expect(layout.definitions).toStrictEqual({
      output: 'src/routes.ts',
      split: false,
      exportTypes: false,
      package: undefined,
    })
    expect(layout.aggregate).toBe('src/routes.ts')
    expect(layout.targets.schemas?.output).toBe('src/routes.ts')
    expect(layout.scaffold).toBe(false)
  })

  it('keeps the components apart when components names a module, and scaffolds with template', () => {
    const layout = resolveLayout({
      ...base,
      defineHandler: { output: 'src/routes.ts', template: true },
      components: { output: 'src/components.ts' },
    })
    expect(layout.aggregate).toBe('src/components.ts')
    expect(layout.scaffold).toBe(true)
  })

  it('takes a split target of their own, as a component kind, with the components apart', () => {
    const layout = resolveLayout({
      ...base,
      defineHandler: { output: 'packages/routes/src', split: true, package: '@acme/routes' },
    })
    expect(layout.definitions).toStrictEqual({
      output: 'packages/routes/src',
      split: true,
      exportTypes: false,
      package: '@acme/routes',
    })
    expect(layout.aggregate).toBe('src/components/index.ts')
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
