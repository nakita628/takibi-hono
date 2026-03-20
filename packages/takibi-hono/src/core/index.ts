import fsp from 'node:fs/promises'
import path from 'node:path'

import { setFormatOptions } from '../format/index.js'
import { core } from '../helper/core.js'
import { makeComponentImports, makeModuleSpec } from '../helper/imports.js'
import { mergeAppFile, mergeBarrelFile, mergeHandlerFile } from '../merge/index.js'
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

/**
 * Main orchestrator: generates all output files from an OpenAPI spec.
 */
export async function hono(config: {
  readonly input: string
  readonly schema: 'zod' | 'valibot' | 'typebox' | 'arktype' | 'effect'
  readonly basePath?: string | undefined
  readonly format?: Record<string, unknown> | undefined
  readonly openapi?: boolean | undefined
  readonly 'takibi-hono'?:
    | {
        readonly readonly?: boolean | undefined
        readonly exportSchemasTypes?: boolean | undefined
        readonly exportParametersTypes?: boolean | undefined
        readonly exportHeadersTypes?: boolean | undefined
        readonly handlers?: { readonly output: string } | undefined
        readonly components?:
          | {
              readonly output?: string | undefined
              readonly schemas?:
                | {
                    readonly output: string
                    readonly exportTypes?: boolean | undefined
                    readonly split?: boolean | undefined
                    readonly import?: string | undefined
                  }
                | undefined
              readonly parameters?:
                | {
                    readonly output: string
                    readonly exportTypes?: boolean | undefined
                    readonly split?: boolean | undefined
                    readonly import?: string | undefined
                  }
                | undefined
              readonly headers?:
                | {
                    readonly output: string
                    readonly exportTypes?: boolean | undefined
                    readonly split?: boolean | undefined
                    readonly import?: string | undefined
                  }
                | undefined
              readonly securitySchemes?:
                | {
                    readonly output: string
                    readonly exportTypes?: boolean | undefined
                    readonly split?: boolean | undefined
                    readonly import?: string | undefined
                  }
                | undefined
              readonly requestBodies?:
                | {
                    readonly output: string
                    readonly exportTypes?: boolean | undefined
                    readonly split?: boolean | undefined
                    readonly import?: string | undefined
                  }
                | undefined
              readonly responses?:
                | {
                    readonly output: string
                    readonly exportTypes?: boolean | undefined
                    readonly split?: boolean | undefined
                    readonly import?: string | undefined
                  }
                | undefined
              readonly examples?:
                | {
                    readonly output: string
                    readonly exportTypes?: boolean | undefined
                    readonly split?: boolean | undefined
                    readonly import?: string | undefined
                  }
                | undefined
              readonly links?:
                | {
                    readonly output: string
                    readonly exportTypes?: boolean | undefined
                    readonly split?: boolean | undefined
                    readonly import?: string | undefined
                  }
                | undefined
              readonly callbacks?:
                | {
                    readonly output: string
                    readonly exportTypes?: boolean | undefined
                    readonly split?: boolean | undefined
                    readonly import?: string | undefined
                  }
                | undefined
              readonly pathItems?:
                | {
                    readonly output: string
                    readonly exportTypes?: boolean | undefined
                    readonly split?: boolean | undefined
                    readonly import?: string | undefined
                  }
                | undefined
              readonly webhooks?:
                | {
                    readonly output: string
                    readonly exportTypes?: boolean | undefined
                    readonly split?: boolean | undefined
                    readonly import?: string | undefined
                  }
                | undefined
            }
          | undefined
      }
    | undefined
}): Promise<
  { readonly ok: true; readonly value: undefined } | { readonly ok: false; readonly error: string }
> {
  if (config.format) {
    setFormatOptions(config.format)
  }

  const parseResult = await parseOpenAPI(config.input)
  if (!parseResult.ok) return parseResult

  const openapi = parseResult.value
  const ohConfig = config['takibi-hono']
  const useOpenAPI = config.openapi === true

  // Resolve output paths from config
  const handlersOutput = ohConfig?.handlers?.output ?? 'src/handlers'
  const componentsBaseOutput = ohConfig?.components?.output
  const schemasConfig = ohConfig?.components?.schemas
  const schemasOutput =
    schemasConfig?.output ??
    (componentsBaseOutput ? `${componentsBaseOutput}/index.ts` : 'src/components/index.ts')
  const exportTypes = schemasConfig?.exportTypes ?? ohConfig?.exportSchemasTypes ?? false
  const isReadonly = ohConfig?.readonly ?? false

  // Compute the directory for schemas output
  const schemasDir = schemasOutput.endsWith('.ts') ? path.dirname(schemasOutput) : schemasOutput
  const schemasFile = schemasOutput.endsWith('.ts')
    ? schemasOutput
    : path.join(schemasOutput, 'index.ts')

  // Generate schemas when the spec has component schemas
  if (openapi.components?.schemas) {
    const schemasSplit = schemasConfig?.split ?? false
    if (schemasSplit) {
      const splitDir = schemasOutput.endsWith('.ts')
        ? schemasOutput.replace(/\.ts$/, '')
        : schemasOutput
      const splitResult = await makeSplitSchemas(
        openapi.components.schemas,
        config.schema,
        splitDir,
        { exportTypes, readonly: isReadonly },
      )
      if (!splitResult.ok) return splitResult
    } else {
      const schemasCode = await makeSchemasCode(openapi.components.schemas, config.schema, {
        exportTypes,
        readonly: isReadonly,
      })
      const schemasResult = await core(schemasCode, schemasDir, schemasFile)
      if (!schemasResult.ok) return schemasResult
    }
  }

  // Generate component files (only when openapi mode)
  if (useOpenAPI) {
    const componentsResult = await makeComponentFiles(
      openapi,
      config.schema,
      ohConfig,
      schemasFile,
      componentsBaseOutput,
    )
    if (!componentsResult.ok) return componentsResult
  }

  // Collect operations and generate handlers
  const groups = collectOperations(openapi)
  const handlerFileNames: string[] = []

  // Compute handler directory
  const handlersDir = handlersOutput.endsWith('.ts') ? path.dirname(handlersOutput) : handlersOutput

  // Build component import paths relative to handlers directory
  const componentPaths = makeComponentPaths(
    handlersDir,
    schemasFile,
    ohConfig,
    componentsBaseOutput,
  )

  // Split mode: one file per path group
  for (const [groupName, operations] of groups) {
    handlerFileNames.push(groupName)
    const generatedCode = makeHandlerCode(groupName, operations, config.schema, {
      componentPaths,
      openapi: useOpenAPI,
    })
    const handlerOutput = path.join(handlersDir, `${groupName}.ts`)
    const existingCode = await readFileOrNull(handlerOutput)
    const finalCode = existingCode ? mergeHandlerFile(existingCode, generatedCode) : generatedCode
    const handlerResult = await core(finalCode, handlersDir, handlerOutput)
    if (!handlerResult.ok) return handlerResult
  }

  // Generate barrel file
  if (handlerFileNames.length > 0) {
    const generatedBarrel = makeBarrelCode(handlerFileNames)
    const barrelOutput = path.join(handlersDir, 'index.ts')
    const existingBarrel = await readFileOrNull(barrelOutput)
    const finalBarrel = existingBarrel
      ? mergeBarrelFile(existingBarrel, generatedBarrel)
      : generatedBarrel
    const barrelResult = await core(finalBarrel, handlersDir, barrelOutput)
    if (!barrelResult.ok) return barrelResult
  }

  // Delete stale handler files (removed from OpenAPI spec)
  const expectedFiles = new Set([...handlerFileNames.map((name) => `${name}.ts`), 'index.ts'])
  const existingFiles = await fsp
    .readdir(handlersDir, { withFileTypes: true })
    .then((entries) =>
      entries.filter((e) => e.isFile() && e.name.endsWith('.ts')).map((e) => e.name),
    )
    .catch((): string[] => [])
  for (const file of existingFiles) {
    if (!expectedFiles.has(file)) {
      await fsp.unlink(path.join(handlersDir, file)).catch(() => {})
    }
  }

  // Generate webhook handlers (only when openapi mode)
  if (useOpenAPI) {
    const webhooksConfig = ohConfig?.components?.webhooks
    if (openapi.webhooks) {
      const webhooksCode = makeWebhooksCode(openapi, config.schema, {
        componentPaths,
      })
      if (webhooksCode) {
        const webhooksOutput =
          webhooksConfig?.output ??
          (componentsBaseOutput
            ? `${componentsBaseOutput}/webhooks/index.ts`
            : path.join(handlersDir, 'webhooks.ts'))
        const webhooksDir = webhooksOutput.endsWith('.ts')
          ? path.dirname(webhooksOutput)
          : webhooksOutput
        const webhooksFile = webhooksOutput.endsWith('.ts')
          ? webhooksOutput
          : path.join(webhooksOutput, 'index.ts')
        const webhooksResult = await core(webhooksCode, webhooksDir, webhooksFile)
        if (!webhooksResult.ok) return webhooksResult
      }
    }
  }

  // Generate app index in parent of handlers dir
  const appDir = path.dirname(handlersDir)
  const appCode = makeAppCode(openapi, handlerFileNames, {
    basePath: config.basePath,
    handlersImportPath: `./${path.relative(appDir, handlersDir)}`,
  })
  const appOutput = path.join(appDir, 'index.ts')
  const existingApp = await readFileOrNull(appOutput)
  const finalApp = existingApp ? mergeAppFile(existingApp, appCode) : appCode
  const appResult = await core(finalApp, appDir, appOutput)
  if (!appResult.ok) return appResult

  return { ok: true, value: undefined }
}

async function readFileOrNull(filePath: string): Promise<string | null> {
  return fsp.readFile(filePath, 'utf-8').catch(() => null)
}

/**
 * Generates component files based on config.
 */
async function makeComponentFiles(
  openapi: { readonly components?: import('../openapi/index.js').Components },
  schemaLib: 'zod' | 'valibot' | 'typebox' | 'arktype' | 'effect',
  ohConfig: NonNullable<Parameters<typeof hono>[0]['takibi-hono']> | undefined,
  schemasFile: string,
  componentsBaseOutput?: string,
): Promise<
  { readonly ok: true; readonly value: undefined } | { readonly ok: false; readonly error: string }
> {
  const components = openapi.components
  if (!components) return { ok: true, value: undefined }

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

  // Build component output file map for cross-component import resolution
  const componentFiles: Record<string, string> = {}
  if (schemasFile) componentFiles.schemas = schemasFile
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
  for (const [key, cfg] of Object.entries(componentKeyMap)) {
    if (cfg) {
      componentFiles[key] = cfg.output.endsWith('.ts') ? cfg.output : `${cfg.output}/index.ts`
    }
  }
  // Auto-populate component files from base output for types with data
  if (componentsBaseOutput) {
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
        componentFiles[key] = `${componentsBaseOutput}/${key}/index.ts`
      }
    }
  }

  for (const gen of generators) {
    if (!gen.data) continue
    const componentConfig =
      ohConfig?.components?.[gen.configKey] ??
      (componentsBaseOutput
        ? { output: `${componentsBaseOutput}/${gen.configKey}/index.ts` }
        : undefined)
    if (!componentConfig) continue

    const output = componentConfig.output
    const isSplit = 'split' in componentConfig ? (componentConfig.split ?? false) : false
    const dir = output.endsWith('.ts') ? path.dirname(output) : output
    const file = output.endsWith('.ts') ? output : path.join(output, 'index.ts')

    // Generate body code (declarations only)
    const bodyCode = await gen.make()

    if (isSplit && !output.endsWith('.ts')) {
      // Split mode: each export const → individual file + barrel
      const splitResult = await splitComponentCode(bodyCode, dir, schemaLib, componentFiles)
      if (!splitResult.ok) return splitResult
    } else {
      // Single file mode
      // Build component paths relative to this component's file
      const paths = Object.fromEntries(
        Object.entries(componentFiles)
          .filter(([, f]) => f !== file)
          .map(([k, f]) => [k, makeModuleSpec(file, f)]),
      )

      // Scan body and prepend imports
      const importLines = makeComponentImports(bodyCode, schemaLib, paths)
      const fullCode = importLines.length > 0 ? [...importLines, '', bodyCode].join('\n') : bodyCode

      const result = await core(fullCode, dir, file)
      if (!result.ok) return result
    }
  }

  return { ok: true, value: undefined }
}

/**
 * Builds a map of component key → relative import path from the handlers directory.
 * Each configured component output path is resolved relative to the handlers dir.
 */
function makeComponentPaths(
  handlersDir: string,
  schemasFile: string,
  ohConfig: NonNullable<Parameters<typeof hono>[0]['takibi-hono']> | undefined,
  componentsBaseOutput?: string,
): Record<string, string> {
  const paths: Record<string, string> = {}

  // Always include schemas (use import override if provided)
  const schemasImport = ohConfig?.components?.schemas?.import
  paths.schemas = schemasImport ?? computeRelativeImport(handlersDir, schemasFile)

  // Map component config keys to import path keys
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

  for (const key of componentKeys) {
    const componentConfig = ohConfig?.components?.[key]
    if (componentConfig) {
      // Use explicit import override if provided, otherwise compute relative path
      if (componentConfig.import) {
        paths[key] = componentConfig.import
      } else {
        const output = componentConfig.output
        const file = output.endsWith('.ts') ? output : path.join(output, 'index.ts')
        paths[key] = computeRelativeImport(handlersDir, file)
      }
    } else if (componentsBaseOutput) {
      // Auto-derive path from base output directory
      const file = path.join(componentsBaseOutput, key, 'index.ts')
      paths[key] = computeRelativeImport(handlersDir, file)
    }
  }

  return paths
}

/**
 * Splits component code into individual files with a barrel index.
 * Each `export const XxxYyy = ...` becomes its own file.
 */
async function splitComponentCode(
  bodyCode: string,
  outputDir: string,
  schemaLib: 'zod' | 'valibot' | 'typebox' | 'arktype' | 'effect',
  componentFiles: Record<string, string>,
): Promise<
  { readonly ok: true; readonly value: undefined } | { readonly ok: false; readonly error: string }
> {
  // Split by `export const` declarations
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
    // Convert PascalCase name to camelCase file name
    const fileName = entry.name.charAt(0).toLowerCase() + entry.name.slice(1)
    fileNames.push(fileName)

    // Build component paths relative to this split file
    const filePath = path.join(outputDir, `${fileName}.ts`)
    const paths = Object.fromEntries(
      Object.entries(componentFiles).map(([k, f]) => [k, makeModuleSpec(filePath, f)]),
    )

    const importLines = makeComponentImports(entry.code, schemaLib, paths)
    const fullCode =
      importLines.length > 0 ? [...importLines, '', entry.code].join('\n') : entry.code

    const result = await core(fullCode, outputDir, filePath)
    if (!result.ok) return result
  }

  // Generate barrel index
  const barrelCode = fileNames
    .toSorted()
    .map((name) => `export*from'./${name}'`)
    .join('\n')

  const barrelPath = path.join(outputDir, 'index.ts')
  const barrelResult = await core(barrelCode, outputDir, barrelPath)
  if (!barrelResult.ok) return barrelResult

  return { ok: true, value: undefined }
}

/**
 * Computes a relative import path from a source directory to a target file.
 * Strips .ts extension for TypeScript import compatibility.
 */
function computeRelativeImport(fromDir: string, toFile: string): string {
  const rel = path.relative(fromDir, toFile)
  const stripped = rel.replace(/\.ts$/, '').replace(/\/index$/, '')
  const normalized = stripped.replace(/\\/g, '/')
  return normalized.startsWith('.') ? normalized : `./${normalized}`
}
