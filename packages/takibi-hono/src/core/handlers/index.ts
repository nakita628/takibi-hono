import path from 'node:path'

import { emit } from '../../emit/index.js'
import { readdir, readFile, unlink } from '../../fsp/index.js'
import { makeHandlerCode } from '../../generator/hono-openapi/routes/index.js'
import { makeBarrelCode } from '../../helper/barrel.js'
import { collectOperations } from '../../helper/operations.js'
import { mergeBarrelFile, mergeHandlerFile } from '../../merge/index.js'
import type { OpenAPI } from '../../openapi/index.js'
import type { Layout, SchemaLib } from '../layout.js'

/**
 * Emits one handler file per route group (`__root`, `users`, `pets`, …) plus
 * a barrel `index.ts`, then deletes any orphan handler files that no longer
 * appear in the spec.
 *
 * Existing handler bodies and JSDoc are preserved via `mergeHandlerFile`;
 * generated metadata (route paths, validators) overwrites whatever the user
 * had previously.
 */
export async function makeHandlers(
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
    const existingResult = await readFile(handlerOutput)
    if (!existingResult.ok) return existingResult
    const finalCode = existingResult.value
      ? mergeHandlerFile(existingResult.value, generatedCode)
      : generatedCode
    const handlerResult = await emit(finalCode, layout.handlersDir, handlerOutput)
    if (!handlerResult.ok) return handlerResult
  }
  if (handlerFileNames.length > 0) {
    const generatedBarrel = makeBarrelCode(handlerFileNames)
    const barrelOutput = path.join(layout.handlersDir, 'index.ts')
    const existingResult = await readFile(barrelOutput)
    if (!existingResult.ok) return existingResult
    const finalBarrel = existingResult.value
      ? mergeBarrelFile(existingResult.value, generatedBarrel)
      : generatedBarrel
    const barrelResult = await emit(finalBarrel, layout.handlersDir, barrelOutput)
    if (!barrelResult.ok) return barrelResult
  }
  // Clean up handler files that no longer correspond to any spec path. The
  // handlers directory only contains generated `.ts` files, so we filter by
  // extension (the wrapped `readdir` returns names only, no Dirent objects).
  const expectedFiles = new Set([...handlerFileNames.map((name) => `${name}.ts`), 'index.ts'])
  const dirResult = await readdir(layout.handlersDir)
  if (dirResult.ok) {
    for (const file of dirResult.value) {
      if (file.endsWith('.ts') && !expectedFiles.has(file)) {
        await unlink(path.join(layout.handlersDir, file))
      }
    }
  } else if (!dirResult.notFound) {
    return { ok: false, error: dirResult.error } as const
  }
  return { ok: true, value: { handlerFileNames: handlerFileNames as readonly string[] } } as const
}
