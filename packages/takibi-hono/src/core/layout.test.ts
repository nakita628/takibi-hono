import { describe, expect, it } from 'vite-plus/test'

import { resolveLayout } from './layout.js'

describe('resolveLayout: defaults', () => {
  it.concurrent('uses src/handlers and src/components/index.ts when no config', () => {
    expect(resolveLayout(undefined)).toStrictEqual({
      schemasFile: 'src/components/index.ts',
      schemasDir: 'src/components',
      handlersDir: 'src/handlers',
      componentsBaseOutput: undefined,
      componentsSingleFile: undefined,
      pathAlias: undefined,
      appDir: 'src',
      componentPaths: { schemas: '../components' },
    })
  })
})

describe('resolveLayout: handlers / schemas overrides', () => {
  it.concurrent('handlers.output as a directory leaves it as handlersDir', () => {
    const layout = resolveLayout({ output: 'src/routes' })
    expect(layout.handlersDir).toBe('src/routes')
    expect(layout.appDir).toBe('src')
  })

  it.concurrent('handlers.output ending with .ts uses its directory', () => {
    const layout = resolveLayout({ output: 'src/handlers.ts' })
    expect(layout.handlersDir).toBe('src')
    expect(layout.appDir).toBe('.')
  })

  it.concurrent('schemas.output as a .ts file is used directly', () => {
    const layout = resolveLayout({ components: { schemas: { output: 'src/schemas.ts' } } })
    expect(layout.schemasFile).toBe('src/schemas.ts')
    expect(layout.schemasDir).toBe('src')
  })

  it.concurrent('schemas.output as a directory becomes <dir>/index.ts', () => {
    const layout = resolveLayout({ components: { schemas: { output: 'src/schemas' } } })
    expect(layout.schemasFile).toBe('src/schemas/index.ts')
    expect(layout.schemasDir).toBe('src/schemas')
  })
})

describe('resolveLayout: components.output base directory', () => {
  it.concurrent('uses <base>/index.ts for schemas when no schemas.output is set', () => {
    const layout = resolveLayout({ components: { output: 'src/openapi' } })
    expect(layout.schemasFile).toBe('src/openapi/index.ts')
    expect(layout.componentsBaseOutput).toBe('src/openapi')
  })

  it.concurrent('individual schemas.output overrides the base output', () => {
    const layout = resolveLayout({
      components: { output: 'src/openapi', schemas: { output: 'src/custom.ts' } },
    })
    expect(layout.schemasFile).toBe('src/custom.ts')
    expect(layout.componentsBaseOutput).toBe('src/openapi')
  })
})

describe('resolveLayout: componentPaths', () => {
  it.concurrent('emits relative path from handlersDir to schemasFile by default', () => {
    const layout = resolveLayout({
      output: 'src/handlers',
      components: { schemas: { output: 'src/schemas.ts' } },
    })
    expect(layout.componentPaths.schemas).toBe('../schemas')
  })

  it.concurrent('honors components.schemas.import override over relative path', () => {
    const layout = resolveLayout({
      output: 'src/handlers',
      components: {
        schemas: { output: 'src/schemas.ts', import: '@app/schemas' },
      },
    })
    expect(layout.componentPaths.schemas).toBe('@app/schemas')
  })

  it.concurrent('derives per-component paths from componentsBaseOutput when no individual config', () => {
    const layout = resolveLayout({
      output: 'src/handlers',
      components: { output: 'src/openapi' },
    })
    expect(layout.componentPaths.parameters).toBe('../openapi/parameters')
    expect(layout.componentPaths.responses).toBe('../openapi/responses')
    expect(layout.componentPaths.headers).toBe('../openapi/headers')
  })

  it.concurrent('honors per-component import override', () => {
    const layout = resolveLayout({
      output: 'src/handlers',
      components: {
        responses: { output: 'src/responses.ts', import: '@app/responses' },
      },
    })
    expect(layout.componentPaths.responses).toBe('@app/responses')
  })
})

describe('resolveLayout: pathAlias', () => {
  it.concurrent('resolves schemas import via the alias relative to appDir', () => {
    const layout = resolveLayout({
      pathAlias: '@',
      output: 'src/handlers',
      components: { schemas: { output: 'src/components/index.ts' } },
    })
    expect(layout.pathAlias).toBe('@')
    expect(layout.componentPaths.schemas).toBe('@/components')
  })

  it.concurrent('resolves componentsBaseOutput per-type paths via the alias', () => {
    const layout = resolveLayout({
      pathAlias: '@',
      output: 'src/handlers',
      components: { output: 'src/openapi' },
    })
    expect(layout.componentPaths.parameters).toBe('@/openapi/parameters')
    expect(layout.componentPaths.responses).toBe('@/openapi/responses')
  })

  it.concurrent('alias single-file mode points every key at the aggregate file', () => {
    const layout = resolveLayout({
      pathAlias: '@',
      output: 'src/handlers',
      components: { output: 'src/openapi.ts' },
    })
    expect(layout.componentsSingleFile).toBe('src/openapi.ts')
    expect(layout.componentPaths.schemas).toBe('@/openapi')
    expect(layout.componentPaths.responses).toBe('@/openapi')
  })

  it.concurrent('a trailing slash in the alias is normalized away', () => {
    const layout = resolveLayout({
      pathAlias: '@/',
      output: 'src/handlers',
      components: { schemas: { output: 'src/components/index.ts' } },
    })
    expect(layout.componentPaths.schemas).toBe('@/components')
  })

  it.concurrent('per-component import override still wins over the alias', () => {
    const layout = resolveLayout({
      pathAlias: '@',
      output: 'src/handlers',
      components: { responses: { output: 'src/responses.ts', import: '@app/responses' } },
    })
    expect(layout.componentPaths.responses).toBe('@app/responses')
  })
})
