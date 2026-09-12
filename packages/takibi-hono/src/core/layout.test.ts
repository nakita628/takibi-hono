import { describe, expect, it } from 'vite-plus/test'

import { makeSpecifier, resolveLayout } from './layout.js'

const base = { input: 'openapi.yaml', schema: 'zod' } as const

const aggregateTarget = (file: string) => ({ output: file, split: false, import: undefined })

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
        responses: { output: 'src/responses', split: true, import: '@/responses' },
        parameters: { output: 'src/parameters.ts', split: true, exportTypes: true },
      },
    })
    expect(layout.aggregate).toBe(undefined)
    expect(layout.targets).toStrictEqual({
      schemas: {
        output: 'src/components/index.ts',
        split: false,
        exportTypes: false,
        import: undefined,
      },
      responses: {
        output: 'src/responses',
        split: true,
        exportTypes: false,
        import: '@/responses',
      },
      parameters: {
        output: 'src/parameters.ts',
        split: false,
        exportTypes: true,
        import: undefined,
      },
    })
  })
})

describe('makeSpecifier', () => {
  const layout = resolveLayout(base)
  const target = {
    output: 'src/components/index.ts',
    split: false,
    exportTypes: false,
    import: undefined,
  }

  it.each([
    ['src/handlers', target, '../components'],
    ['src/components', target, '.'],
    ['src/handlers', { ...target, output: 'src/schemas', split: true }, '../schemas'],
    ['src/handlers', { ...target, import: '#components' }, '#components'],
  ])('from %s', (fromDir, t, expected) => {
    expect(makeSpecifier(layout, fromDir, t)).toBe(expected)
  })

  it('resolves through the path alias from the app directory', () => {
    expect(makeSpecifier({ ...layout, pathAlias: '@/' }, 'src/handlers', target)).toBe(
      '@/components',
    )
  })
})
