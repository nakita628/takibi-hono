import { makeExternalDocsPart, makeResponse, makeServersPart } from '../../../helper/openapi.js'
import type { Operation } from '../../../openapi/index.js'

/**
 * Generates a describeRoute({...}) code string from an operation.
 */
export function makeDescribeRoute(
  operation: Operation,
  schemaLib: 'zod' | 'valibot' | 'typebox' | 'arktype' | 'effect',
) {
  // Property order mirrors the `Operation` type declaration in openapi/index.ts
  // (= the OpenAPI spec field order).
  const result = [
    ...(operation.tags && operation.tags.length > 0
      ? [`tags:${JSON.stringify(operation.tags)}`]
      : []),
    ...(operation.summary ? [`summary:${JSON.stringify(operation.summary)}`] : []),
    ...(operation.description ? [`description:${JSON.stringify(operation.description)}`] : []),
    ...(operation.externalDocs ? [makeExternalDocsPart(operation.externalDocs)] : []),
    // YAML parses an unquoted reserved-word operationId (`operationId: true`) as a
    // boolean; OpenAPI defines operationId as a string, so coerce before quoting.
    ...(operation.operationId
      ? [`operationId:${JSON.stringify(String(operation.operationId))}`]
      : []),
    ...(operation.responses
      ? (() => {
          const entries = Object.entries(operation.responses).map(([code, resp]) =>
            makeResponse(code, resp, schemaLib),
          )
          return entries.length > 0 ? [`responses:{${entries.join(',')}}`] : []
        })()
      : []),
    ...(operation.deprecated === true ? ['deprecated:true'] : []),
    ...(operation.security ? [`security:${JSON.stringify(operation.security)}`] : []),
    ...(operation.servers && operation.servers.length > 0
      ? [makeServersPart(operation.servers)]
      : []),
  ]
  return `describeRoute({${result.join(',')}})`
}
