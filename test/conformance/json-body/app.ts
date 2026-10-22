// hono-takibi's json-body suite, run against the app takibi-hono generated from the same
// document (cases/conformance-json-body, or its -<library> sibling under
// TAKIBI_HONO_CONFORMANCE_LIB). Its handlers answer the validated values the way the suite's
// own host does (see the case's overlay), through the host that answers a validation failure
// as the suite expects.
import { generatedApp, hostOf } from '../host'

export const jsonBodyApp = hostOf(await generatedApp('json-body'))
