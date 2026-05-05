import path from 'node:path'

import { emit } from '../../emit/index.js'
import { makeCallbacksCode } from '../../generator/hono-openapi/components/callbacks.js'
import { makeExamplesCode } from '../../generator/hono-openapi/components/examples.js'
import { makeHeadersCode } from '../../generator/hono-openapi/components/headers.js'
import { makeLinksCode } from '../../generator/hono-openapi/components/links.js'
import { makeParametersCode } from '../../generator/hono-openapi/components/parameters.js'
import { makePathItemsCode } from '../../generator/hono-openapi/components/path-items.js'
import { makeRequestBodiesCode } from '../../generator/hono-openapi/components/request-bodies.js'
import { makeResponsesCode } from '../../generator/hono-openapi/components/responses.js'
import { makeSecuritySchemesCode } from '../../generator/hono-openapi/components/security-schemes.js'
import { makeComponentImports, makeModuleSpec } from '../../helper/imports.js'
import type { Components, OpenAPI } from '../../openapi/index.js'
import type { Layout, SchemaLib, TakibiHonoOptions } from '../layout.js'

/**
 * Emits component files (`responses`, `parameters`, `headers`, `requestBodies`,
 * `examples`, `securitySchemes`, `links`, `callbacks`, `pathItems`).
 *
 * Honors per-component `output` paths and `split` flags from the user's config.
 * When the user supplies a base `components.output` directory, missing
 * per-component paths default to `<base>/<kind>/index.ts`.
 */
export async function makeComponents(
  openapi: OpenAPI,
  schemaLib: SchemaLib,
  ohConfig: TakibiHonoOptions | undefined,
  layout: Layout,
) {
  const components = openapi.components
  if (!components) return { ok: true, value: undefined } as const
  const isReadonly = ohConfig?.readonly ?? false
  const generators = [
    {
      data: components.responses,
      configKey: 'responses' as const,
      make: () => makeResponsesCode(components.responses!, schemaLib, isReadonly),
    },
    {
      data: components.parameters,
      configKey: 'parameters' as const,
      make: () => makeParametersCode(components.parameters!, schemaLib),
    },
    {
      data: components.requestBodies,
      configKey: 'requestBodies' as const,
      make: () => makeRequestBodiesCode(components.requestBodies!, schemaLib, isReadonly),
    },
    {
      data: components.headers,
      configKey: 'headers' as const,
      make: () => makeHeadersCode(components.headers!, schemaLib),
    },
    {
      data: components.examples,
      configKey: 'examples' as const,
      make: () => makeExamplesCode(components.examples!, isReadonly),
    },
    {
      data: components.securitySchemes,
      configKey: 'securitySchemes' as const,
      make: () => makeSecuritySchemesCode(components.securitySchemes!, isReadonly),
    },
    {
      data: components.links,
      configKey: 'links' as const,
      make: () => makeLinksCode(components.links!, isReadonly),
    },
    {
      data: components.callbacks,
      configKey: 'callbacks' as const,
      make: () => makeCallbacksCode(components.callbacks!, isReadonly),
    },
    {
      data: components.pathItems,
      configKey: 'pathItems' as const,
      make: () => makePathItemsCode(components.pathItems!, isReadonly),
    },
  ] as const
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
    const dir = output.endsWith('.ts') ? path.dirname(output) : output
    const file = output.endsWith('.ts') ? output : path.join(output, 'index.ts')
    const bodyCode = await gen.make()
    if (isSplit && !output.endsWith('.ts')) {
      const splitResult = await splitComponentCode(bodyCode, dir, schemaLib, componentFiles)
      if (!splitResult.ok) return splitResult
    } else {
      const paths = Object.fromEntries(
        Object.entries(componentFiles)
          .filter(([, f]) => f !== file)
          .map(([k, f]) => [k, makeModuleSpec(file, f)]),
      )
      const importLines = makeComponentImports(bodyCode, schemaLib, paths)
      const fullCode = importLines.length > 0 ? [...importLines, '', bodyCode].join('\n') : bodyCode
      const result = await emit(fullCode, dir, file)
      if (!result.ok) return result
    }
  }
  return { ok: true, value: undefined } as const
}

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
] as const

function makeComponentFileMap(
  components: Components,
  ohConfig: TakibiHonoOptions | undefined,
  layout: Layout,
): Record<string, string> {
  const componentFiles: Record<string, string> = {}
  if (layout.schemasFile) componentFiles.schemas = layout.schemasFile
  const configsByKey = {
    parameters: ohConfig?.components?.parameters,
    headers: ohConfig?.components?.headers,
    securitySchemes: ohConfig?.components?.securitySchemes,
    requestBodies: ohConfig?.components?.requestBodies,
    responses: ohConfig?.components?.responses,
    examples: ohConfig?.components?.examples,
    links: ohConfig?.components?.links,
    callbacks: ohConfig?.components?.callbacks,
    pathItems: ohConfig?.components?.pathItems,
  }
  for (const [k, config] of Object.entries(configsByKey)) {
    if (config) {
      componentFiles[k] = config.output.endsWith('.ts')
        ? config.output
        : `${config.output}/index.ts`
    }
  }
  if (layout.componentsBaseOutput) {
    for (const key of COMPONENT_KEYS) {
      if (!componentFiles[key] && components[key]) {
        componentFiles[key] = `${layout.componentsBaseOutput}/${key}/index.ts`
      }
    }
  }
  return componentFiles
}

async function splitComponentCode(
  bodyCode: string,
  outputDir: string,
  schemaLib: SchemaLib,
  componentFiles: Record<string, string>,
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
  const fileNames: string[] = []
  for (const entry of entries) {
    const fileName = entry.name.charAt(0).toLowerCase() + entry.name.slice(1)
    fileNames.push(fileName)
    const filePath = path.join(outputDir, `${fileName}.ts`)
    const paths = Object.fromEntries(
      Object.entries(componentFiles).map(([k, f]) => [k, makeModuleSpec(filePath, f)]),
    )
    const importLines = makeComponentImports(entry.code, schemaLib, paths)
    const fullCode =
      importLines.length > 0 ? [...importLines, '', entry.code].join('\n') : entry.code
    const result = await emit(fullCode, outputDir, filePath)
    if (!result.ok) return result
  }
  const barrelCode = fileNames
    .toSorted()
    .map((name) => `export*from'./${name}'`)
    .join('\n')
  const barrelPath = path.join(outputDir, 'index.ts')
  const barrelResult = await emit(barrelCode, outputDir, barrelPath)
  if (!barrelResult.ok) return barrelResult
  return { ok: true, value: undefined } as const
}
