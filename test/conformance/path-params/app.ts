// hono-takibi's path-params suite, run against the app takibi-hono generated from the same
// document (cases/conformance-path-params). Its handlers answer the validated values the way the
// suite's own host does (see the case's overlay), through the host that answers a validation
// failure as the suite expects.
import generated from '../../__app__/conformance-path-params/src/index'
import { hostOf } from '../host'

export const pathParamsApp = hostOf(generated)
