import path from 'node:path'

import { emit } from '../../emit/index.js'
import { readFile } from '../../fsp/index.js'
import { makeAppCode } from '../../generator/hono-openapi/app/index.js'
import { mergeAppFile } from '../../merge/index.js'
import type { OpenAPI } from '../../openapi/index.js'
import type { Layout } from '../layout.js'

/**
 * Emits the app entry file (`<appDir>/index.ts`) which wires every handler
 * module into a single Hono router, optionally applying `basePath`.
 *
 * If the file already exists, user-added imports / middleware are preserved
 * via `mergeAppFile`; generator-managed bits (handler imports, route chain)
 * are overwritten.
 */
export async function makeApp(
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
  const existingResult = await readFile(appOutput)
  if (!existingResult.ok) return existingResult
  const finalApp = existingResult.value ? mergeAppFile(existingResult.value, appCode) : appCode
  return emit(finalApp, layout.appDir, appOutput)
}
