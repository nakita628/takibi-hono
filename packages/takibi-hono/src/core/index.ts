import fsp from 'node:fs/promises'
import path from 'node:path'

import { emit } from '../emit/index.js'
import { setFormatOptions } from '../format/index.js'
import { makeComponentImports, makeModuleSpec } from '../helper/imports.js'
import { mergeAppFile, mergeBarrelFile, mergeHandlerFile } from '../merge/index.js'
import type { Components, OpenAPI } from '../openapi/index.js'
import { parseOpenAPI } from '../openapi/index.js'
import { makeAppCode } from './app.js'
import { makeBarrelCode } from './barrel.js'
import {
  makeCallbacksCode,
  makeExamplesCode,
  makeHeadersCode,
  makeLinksCode,
  makeParametersCode,
  makePathItemsCode,
  makeRequestBodiesCode,
  makeResponsesCode,
  makeSecuritySchemesCode,
} from './components/index.js'
import { collectOperations, makeHandlerCode } from './handler.js'
import { makeSchemasCode, makeSplitSchemas } from './schemas.js'
import { makeWebhooksCode } from './webhooks.js'

type SchemaLib = 'zod' | 'valibot' | 'typebox' | 'arktype' | 'effect'

type ComponentEntryConfig = {
  readonly output: string
  readonly exportTypes?: boolean | undefined
  readonly split?: boolean | undefined
  readonly import?: string | undefined
}

export type TakibiHonoOptions = {
  readonly readonly?: boolean | undefined
  readonly exportSchemasTypes?: boolean | undefined
  readonly exportParametersTypes?: boolean | undefined
  readonly exportHeadersTypes?: boolean | undefined
  readonly handlers?: { readonly output: string } | undefined
  readonly components?:
    | {
        readonly output?: string | undefined
        readonly schemas?: ComponentEntryConfig | undefined
        readonly parameters?: ComponentEntryConfig | undefined
        readonly headers?: ComponentEntryConfig | undefined
        readonly securitySchemes?: ComponentEntryConfig | undefined
        readonly requestBodies?: ComponentEntryConfig | undefined
        readonly responses?: ComponentEntryConfig | undefined
        readonly examples?: ComponentEntryConfig | undefined
        readonly links?: ComponentEntryConfig | undefined
        readonly callbacks?: ComponentEntryConfig | undefined
        readonly pathItems?: ComponentEntryConfig | undefined
        readonly webhooks?: ComponentEntryConfig | undefined
      }
    | undefined
}

export type Layout = {
  readonly schemasFile: string
  readonly schemasDir: string
  readonly handlersDir: string
  readonly componentsBaseOutput: string | undefined
  readonly componentPaths: Record<string, string>
  readonly appDir: string
}

export function resolveLayout(ohConfig: TakibiHonoOptions | undefined): Layout {
  const handlersOutput = ohConfig?.handlers?.output ?? 'src/handlers'
  const componentsBaseOutput = ohConfig?.components?.output
  const schemasConfig = ohConfig?.components?.schemas
  const schemasOutput =
    schemasConfig?.output ??
    (componentsBaseOutput ? `${componentsBaseOutput}/index.ts` : 'src/components/index.ts')
  const schemasDir = schemasOutput.endsWith('.ts') ? path.dirname(schemasOutput) : schemasOutput
  const schemasFile = schemasOutput.endsWith('.ts')
    ? schemasOutput
    : path.join(schemasOutput, 'index.ts')
  const handlersDir = handlersOutput.endsWith('.ts') ? path.dirname(handlersOutput) : handlersOutput
  const componentPaths = makeComponentPaths(handlersDir, schemasFile, ohConfig, componentsBaseOutput)
  const appDir = path.dirname(handlersDir)
  return { schemasFile, schemasDir, handlersDir, componentsBaseOutput, componentPaths, appDir }
}

export async function generateSchemas(
  openapi: OpenAPI,
  schemaLib: SchemaLib,
  ohConfig: TakibiHonoOptions | undefined,
  layout: Layout,
) {
  if (!openapi.components?.schemas) return { ok: true, value: undefined } as const
  const schemasConfig = ohConfig?.components?.schemas
  const exportTypes = schemasConfig?.exportTypes ?? ohConfig?.exportSchemasTypes ?? false
  const isReadonly = ohConfig?.readonly ?? false
  const split = schemasConfig?.split ?? false
  if (split) {
    const splitDir = layout.schemasFile.replace(/\/index\.ts$/, '').replace(/\.ts$/, '')
    return makeSplitSchemas(openapi.components.schemas, schemaLib, splitDir, {
      exportTypes,
      readonly: isReadonly,
    })
  }
  const schemasCode = await makeSchemasCode(openapi.components.schemas, schemaLib, {
    exportTypes,
    readonly: isReadonly,
  })
  return emit(schemasCode, layout.schemasDir, layout.schemasFile)
}

export async function generateComponents(
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

export async function generateHandlers(
  openapi: OpenAPI,
  schemaLib: SchemaLib,
  useOpenAPI: boolean,
  layout: Layout,
) {
  const groups = collectOperations(openapi)
  const handlerFileNames: string[] = []
  for (const [groupName, operations] of groups) {
    handlerFileNames.push(groupName)
    const generatedCode = makeHandlerCode(groupName, operations, schemaLib, {
      componentPaths: layout.componentPaths,
      openapi: useOpenAPI,
    })
    const handlerOutput = path.join(layout.handlersDir, `${groupName}.ts`)
    const existingCode = await readFileOrNull(handlerOutput)
    const finalCode = existingCode ? mergeHandlerFile(existingCode, generatedCode) : generatedCode
    const handlerResult = await emit(finalCode, layout.handlersDir, handlerOutput)
    if (!handlerResult.ok) return handlerResult
  }
  if (handlerFileNames.length > 0) {
    const generatedBarrel = makeBarrelCode(handlerFileNames)
    const barrelOutput = path.join(layout.handlersDir, 'index.ts')
    const existingBarrel = await readFileOrNull(barrelOutput)
    const finalBarrel = existingBarrel
      ? mergeBarrelFile(existingBarrel, generatedBarrel)
      : generatedBarrel
    const barrelResult = await emit(finalBarrel, layout.handlersDir, barrelOutput)
    if (!barrelResult.ok) return barrelResult
  }
  const expectedFiles = new Set([...handlerFileNames.map((name) => `${name}.ts`), 'index.ts'])
  const existingFiles = await fsp
    .readdir(layout.handlersDir, { withFileTypes: true })
    .then((entries) =>
      entries.filter((e) => e.isFile() && e.name.endsWith('.ts')).map((e) => e.name),
    )
    .catch((): string[] => [])
  for (const file of existingFiles) {
    if (!expectedFiles.has(file)) {
      await fsp.unlink(path.join(layout.handlersDir, file)).catch(() => {})
    }
  }
  return { ok: true, value: { handlerFileNames: handlerFileNames as readonly string[] } } as const
}

export async function generateWebhooks(
  openapi: OpenAPI,
  schemaLib: SchemaLib,
  ohConfig: TakibiHonoOptions | undefined,
  layout: Layout,
) {
  if (!openapi.webhooks) return { ok: true, value: undefined } as const
  const webhooksCode = makeWebhooksCode(openapi, schemaLib, {
    componentPaths: layout.componentPaths,
  })
  if (!webhooksCode) return { ok: true, value: undefined } as const
  const webhooksConfig = ohConfig?.components?.webhooks
  const webhooksOutput =
    webhooksConfig?.output ??
    (layout.componentsBaseOutput
      ? `${layout.componentsBaseOutput}/webhooks/index.ts`
      : path.join(layout.handlersDir, 'webhooks.ts'))
  const webhooksDir = webhooksOutput.endsWith('.ts')
    ? path.dirname(webhooksOutput)
    : webhooksOutput
  const webhooksFile = webhooksOutput.endsWith('.ts')
    ? webhooksOutput
    : path.join(webhooksOutput, 'index.ts')
  return emit(webhooksCode, webhooksDir, webhooksFile)
}

export async function generateApp(
  openapi: OpenAPI,
  handlerFileNames: readonly string[],
  basePath: string | undefined,
  layout: Layout,
) {
  const appCode = makeAppCode(openapi, [...handlerFileNames], {
    basePath,
    handlersImportPath: `./${path.relative(layout.appDir, layout.handlersDir)}`,
  })
  const appOutput = path.join(layout.appDir, 'index.ts')
  const existingApp = await readFileOrNull(appOutput)
  const finalApp = existingApp ? mergeAppFile(existingApp, appCode) : appCode
  return emit(finalApp, layout.appDir, appOutput)
}

export async function hono(config: {
  readonly input: string
  readonly schema: SchemaLib
  readonly basePath?: string | undefined
  readonly format?: Record<string, unknown> | undefined
  readonly openapi?: boolean | undefined
  readonly 'takibi-hono'?: TakibiHonoOptions | undefined
}) {
  if (config.format) setFormatOptions(config.format)
  const parseResult = await parseOpenAPI(config.input)
  if (!parseResult.ok) return parseResult
  const openapi = parseResult.value
  const ohConfig = config['takibi-hono']
  const useOpenAPI = config.openapi === true
  const layout = resolveLayout(ohConfig)
  const schemasResult = await generateSchemas(openapi, config.schema, ohConfig, layout)
  if (!schemasResult.ok) return schemasResult
  if (useOpenAPI) {
    const componentsResult = await generateComponents(openapi, config.schema, ohConfig, layout)
    if (!componentsResult.ok) return componentsResult
  }
  const handlersResult = await generateHandlers(openapi, config.schema, useOpenAPI, layout)
  if (!handlersResult.ok) return handlersResult
  if (useOpenAPI) {
    const webhooksResult = await generateWebhooks(openapi, config.schema, ohConfig, layout)
    if (!webhooksResult.ok) return webhooksResult
  }
  return generateApp(openapi, handlersResult.value.handlerFileNames, config.basePath, layout)
}

async function readFileOrNull(filePath: string) {
  return fsp.readFile(filePath, 'utf-8').catch(() => null)
}

function makeComponentFileMap(
  components: Components,
  ohConfig: TakibiHonoOptions | undefined,
  layout: Layout,
): Record<string, string> {
  const componentFiles: Record<string, string> = {}
  if (layout.schemasFile) componentFiles.schemas = layout.schemasFile
  const componentKeyMap = {
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
  for (const [k, config] of Object.entries(componentKeyMap)) {
    if (config) {
      componentFiles[k] = config.output.endsWith('.ts')
        ? config.output
        : `${config.output}/index.ts`
    }
  }
  if (layout.componentsBaseOutput) {
    const componentTypeKeys = [
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
    for (const key of componentTypeKeys) {
      if (!componentFiles[key] && components[key]) {
        componentFiles[key] = `${layout.componentsBaseOutput}/${key}/index.ts`
      }
    }
  }
  return componentFiles
}

function makeComponentPaths(
  handlersDir: string,
  schemasFile: string,
  ohConfig: TakibiHonoOptions | undefined,
  componentsBaseOutput?: string,
): Record<string, string> {
  const paths: Record<string, string> = {}
  const schemasImport = ohConfig?.components?.schemas?.import
  paths.schemas = schemasImport ?? computeRelativeImport(handlersDir, schemasFile)
  const componentKeys = [
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
  for (const k of componentKeys) {
    const componentConfig = ohConfig?.components?.[k]
    if (componentConfig) {
      if (componentConfig.import) {
        paths[k] = componentConfig.import
      } else {
        const output = componentConfig.output
        const file = output.endsWith('.ts') ? output : path.join(output, 'index.ts')
        paths[k] = computeRelativeImport(handlersDir, file)
      }
    } else if (componentsBaseOutput) {
      const file = path.join(componentsBaseOutput, k, 'index.ts')
      paths[k] = computeRelativeImport(handlersDir, file)
    }
  }
  return paths
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
  if (entries.length === 0) return { ok: true, value: undefined }
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

function computeRelativeImport(fromDir: string, toFile: string) {
  const rel = path.relative(fromDir, toFile)
  const stripped = rel.replace(/\.ts$/, '').replace(/\/index$/, '')
  const normalized = stripped.replace(/\\/g, '/')
  return normalized.startsWith('.') ? normalized : `./${normalized}`
}
