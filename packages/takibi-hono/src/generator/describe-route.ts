import { makeExternalDocsPart, makeResponse, makeServersPart } from '../helper/openapi.js'
import type { Operation } from '../openapi/index.js'

/**
 * Generates a describeRoute({...}) code string from an operation.
 */
export function makeDescribeRoute(
  operation: Operation,
  schemaLib: 'zod' | 'valibot' | 'typebox' | 'arktype' | 'effect',
) {
  const result = [
    ...(operation.description ? [`description:${JSON.stringify(operation.description)}`] : []),
    ...(operation.summary ? [`summary:${JSON.stringify(operation.summary)}`] : []),
    ...(operation.tags && operation.tags.length > 0
      ? [`tags:${JSON.stringify(operation.tags)}`]
      : []),
    ...(operation.operationId ? [`operationId:${JSON.stringify(operation.operationId)}`] : []),
    ...(operation.deprecated === true ? ['deprecated:true'] : []),
    ...(operation.security ? [`security:${JSON.stringify(operation.security)}`] : []),
    ...(operation.externalDocs ? [makeExternalDocsPart(operation.externalDocs)] : []),
    ...(operation.servers && operation.servers.length > 0
      ? [makeServersPart(operation.servers)]
      : []),
    ...(operation.responses
      ? (() => {
          const entries = Object.entries(operation.responses).map(([code, resp]) =>
            makeResponse(code, resp, schemaLib),
          )
          return entries.length > 0 ? [`responses:{${entries.join(',')}}`] : []
        })()
      : []),
  ]
  return `describeRoute({${result.join(',')}})`
}
