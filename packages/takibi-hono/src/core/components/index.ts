import path from 'node:path'

import { emit } from '../../emit/index.js'
import { makeCallbacksCode } from '../../generator/hono-openapi/components/callbacks.js'
import { makeExamplesCode } from '../../generator/hono-openapi/components/examples.js'
import { makeHeadersCode } from '../../generator/hono-openapi/components/headers.js'
import { makeLinksCode } from '../../generator/hono-openapi/components/links.js'
import { makeMediaTypesCode } from '../../generator/hono-openapi/components/media-types.js'
import { makeParametersCode } from '../../generator/hono-openapi/components/parameters.js'
import { makePathItemsCode } from '../../generator/hono-openapi/components/path-items.js'
import { makeRequestBodiesCode } from '../../generator/hono-openapi/components/request-bodies.js'
import { makeResponsesCode } from '../../generator/hono-openapi/components/responses.js'
import { makeSchemasCode } from '../../generator/hono-openapi/components/schemas.js'
import { makeSecuritySchemesCode } from '../../generator/hono-openapi/components/security-schemes.js'
import { makeBarrelCode } from '../../helper/barrel.js'
import { makeComponentImports, makeModuleSpec } from '../../helper/imports.js'
import type { Components, OpenAPI } from '../../openapi/index.js'
import type { Layout, TakibiHonoOptions } from '../layout.js'

const COMPONENT_KEYS = [
  'parameters',
  'headers',
  'securitySchemes',
  'requestBodies',
  'responses',
  'examples',
  'links',
  'callbacks',
  'pathItems',
  'mediaTypes',
] as const

/** Honors per-component output / split flags; falls back to `<base>/<kind>/index.ts` when only `components.output` is given. */
export async function makeComponents(
  openapi: OpenAPI,
  schemaLib: 'zod' | 'valibot' | 'typebox' | 'arktype' | 'effect',
  useOpenAPI: boolean,
  ohConfig: TakibiHonoOptions | undefined,
  layout: Layout,
) {
  const components = openapi.components
  if (!components) return { ok: true, value: undefined } as const
  const isReadonly = ohConfig?.readonly ?? false
  const parametersExportTypes = ohConfig?.components?.parameters?.exportTypes ?? false
  const mediaTypesExportTypes = ohConfig?.components?.mediaTypes?.exportTypes ?? false
  // Single-file aggregate mode concatenates every generator's output into one
  // module, so a component that references another by identifier must be emitted
  // AFTER its dependency (else `used before declaration`). OpenAPI components form
  // a non-cyclic DAG; this order is one valid leaf→composite topological order:
  // leaves (parameters, headers, examples, securitySchemes, links) first, then the
  // composites that reference them (requestBodies → schemas/examples, responses →
  // schemas/headers/examples/links, callbacks/pathItems last).
  const generators = [
    {
      data: components.parameters,
      configKey: 'parameters',
      suffix: 'ParamsSchema',
      make: () => makeParametersCode(components.parameters!, schemaLib, parametersExportTypes),
    },
    {
      data: components.headers,
      configKey: 'headers',
      suffix: 'HeaderSchema',
      make: () => makeHeadersCode(components.headers!),
    },
    {
      data: components.examples,
      configKey: 'examples',
      suffix: 'Example',
      make: () => makeExamplesCode(components.examples!, isReadonly),
    },
    {
      data: components.securitySchemes,
      configKey: 'securitySchemes',
      suffix: 'SecurityScheme',
      make: () => makeSecuritySchemesCode(components.securitySchemes!, isReadonly),
    },
    {
      data: components.links,
      configKey: 'links',
      suffix: 'Link',
      make: () => makeLinksCode(components.links!, isReadonly),
    },
    {
      data: components.requestBodies,
      configKey: 'requestBodies',
      suffix: 'RequestBody',
      make: () => makeRequestBodiesCode(components.requestBodies!, schemaLib, isReadonly),
    },
    {
      data: components.responses,
      configKey: 'responses',
      suffix: 'Response',
      make: () => makeResponsesCode(components.responses!, schemaLib, isReadonly, useOpenAPI),
    },
    {
      data: components.callbacks,
      configKey: 'callbacks',
      suffix: 'Callback',
      make: () => makeCallbacksCode(components.callbacks!, isReadonly),
    },
    {
      data: components.pathItems,
      configKey: 'pathItems',
      suffix: 'PathItem',
      make: () => makePathItemsCode(components.pathItems!, isReadonly),
    },
    {
      data: components.mediaTypes,
      configKey: 'mediaTypes',
      suffix: 'MediaTypeSchema',
      make: () => makeMediaTypesCode(components.mediaTypes!, schemaLib, mediaTypesExportTypes),
    },
  ] as const satisfies readonly {
    readonly data: unknown
    readonly configKey: (typeof COMPONENT_KEYS)[number]
    readonly suffix: string
    readonly make: () => string | Promise<string>
  }[]
  // Single-file aggregate mode: schemas + every component in one file (imports are local, so only
  // the schema-library import is needed).
  if (layout.componentsSingleFile) {
    const parts = await Promise.all([
      components.schemas
        ? makeSchemasCode(components.schemas, schemaLib, {
            exportTypes: true,
            readonly: isReadonly,
            registerRef: useOpenAPI,
          })
        : Promise.resolve(''),
      ...generators.map((gen) => (gen.data ? gen.make() : Promise.resolve(''))),
    ])
    const body = parts
      .map((code) =>
        code
          .split('\n')
          .filter((line) => !line.startsWith('import'))
          .join('\n')
          .trim(),
      )
      .filter(Boolean)
      .join('\n\n')
    const importLines = makeComponentImports(body, schemaLib, {})
    const fullCode = importLines.length > 0 ? [...importLines, '', body].join('\n') : body
    return emit(fullCode, path.dirname(layout.componentsSingleFile), layout.componentsSingleFile)
  }
  const componentFiles = makeComponentFileMap(components, ohConfig, layout)
  for (const gen of generators) {
    if (!gen.data) continue
    const componentConfig =
      ohConfig?.components?.[gen.configKey] ??
      (layout.componentsBaseOutput
        ? { output: `${layout.componentsBaseOutput}/${gen.configKey}/index.ts` }
        : undefined)
    if (!componentConfig) continue
    const output = componentConfig.output
    const isSplit = 'split' in componentConfig ? (componentConfig.split ?? false) : false
    const bodyCode = await gen.make()
    const result =
      isSplit && !output.endsWith('.ts')
        ? await splitComponentCode(
            bodyCode,
            output,
            schemaLib,
            componentFiles,
            ohConfig,
            gen.suffix,
          )
        : await emitMergedComponent(bodyCode, output, schemaLib, componentFiles, ohConfig)
    if (!result.ok) return result
  }
  return { ok: true, value: undefined } as const
}

async function emitMergedComponent(
  bodyCode: string,
  output: string,
  schemaLib: 'zod' | 'valibot' | 'typebox' | 'arktype' | 'effect',
  componentFiles: Record<string, string>,
  ohConfig: TakibiHonoOptions | undefined,
) {
  const dir = output.endsWith('.ts') ? path.dirname(output) : output
  const file = output.endsWith('.ts') ? output : path.join(output, 'index.ts')
  const paths = Object.fromEntries(
    Object.entries(componentFiles)
      .filter(([, f]) => f !== file)
      .map(([k, f]) => [k, resolveComponentImportSpec(file, k, f, ohConfig)]),
  )
  const importLines = makeComponentImports(bodyCode, schemaLib, paths)
  const fullCode = importLines.length > 0 ? [...importLines, '', bodyCode].join('\n') : bodyCode
  return emit(fullCode, dir, file)
}

/** Honors `components.<key>.import` alias; falls back to a relative path. */
function resolveComponentImportSpec(
  fromFile: string,
  componentKey: string,
  targetFile: string,
  ohConfig: TakibiHonoOptions | undefined,
): string {
  const alias = isComponentKey(componentKey)
    ? ohConfig?.components?.[componentKey]
    : componentKey === 'schemas'
      ? ohConfig?.components?.schemas
      : undefined
  if (alias?.import) return alias.import
  return makeModuleSpec(fromFile, targetFile)
}

function isComponentKey(key: string): key is (typeof COMPONENT_KEYS)[number] {
  return (COMPONENT_KEYS as readonly string[]).includes(key)
}

function makeComponentFileMap(
  components: Components,
  ohConfig: TakibiHonoOptions | undefined,
  layout: Layout,
): Record<string, string> {
  const configured = Object.fromEntries(
    COMPONENT_KEYS.flatMap((key) => {
      const config = ohConfig?.components?.[key]
      if (!config) return []
      const file = config.output.endsWith('.ts') ? config.output : `${config.output}/index.ts`
      return [[key, file] as const]
    }),
  )
  const fromBase = layout.componentsBaseOutput
    ? Object.fromEntries(
        COMPONENT_KEYS.filter((key) => !configured[key] && components[key]).map(
          (key) => [key, `${layout.componentsBaseOutput}/${key}/index.ts`] as const,
        ),
      )
    : {}
  return {
    ...(layout.schemasFile ? { schemas: layout.schemasFile } : {}),
    ...configured,
    ...fromBase,
  }
}

async function splitComponentCode(
  bodyCode: string,
  outputDir: string,
  schemaLib: 'zod' | 'valibot' | 'typebox' | 'arktype' | 'effect',
  componentFiles: Record<string, string>,
  ohConfig: TakibiHonoOptions | undefined,
  suffix?: string,
) {
  const declPattern = /export\s+const\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*=/g
  const matches = Array.from(bodyCode.matchAll(declPattern), (m) => ({
    name: m[1],
    start: m.index!,
  }))
  const entries = matches.map((m, i) => {
    const end = i + 1 < matches.length ? matches[i + 1].start : bodyCode.length
    return { name: m.name, code: bodyCode.slice(m.start, end).trim() }
  })
  if (entries.length === 0) return { ok: true, value: undefined } as const
  const fileNames = entries.map((entry) => {
    const baseName =
      suffix && entry.name.endsWith(suffix) ? entry.name.slice(0, -suffix.length) : entry.name
    return baseName.charAt(0).toLowerCase() + baseName.slice(1)
  })
  for (const [i, entry] of entries.entries()) {
    const fileName = fileNames[i]
    const filePath = path.join(outputDir, `${fileName}.ts`)
    const paths = Object.fromEntries(
      Object.entries(componentFiles).map(([k, f]) => [
        k,
        resolveComponentImportSpec(filePath, k, f, ohConfig),
      ]),
    )
    const importLines = makeComponentImports(entry.code, schemaLib, paths)
    const fullCode =
      importLines.length > 0 ? [...importLines, '', entry.code].join('\n') : entry.code
    const result = await emit(fullCode, outputDir, filePath)
    if (!result.ok) return result
  }
  const barrelCode = makeBarrelCode(fileNames)
  const barrelPath = path.join(outputDir, 'index.ts')
  return emit(barrelCode, outputDir, barrelPath)
}
