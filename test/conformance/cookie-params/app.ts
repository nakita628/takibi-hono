// hono-takibi's cookie-params suite, run against the app takibi-hono generated from the same
// document (cases/conformance-cookie-params). Its handlers answer the validated values the way the
// suite's own host does (see the case's overlay), through the host that answers a validation
// failure as the suite expects.
import generated from '../../__app__/conformance-cookie-params/src/index'
import { hostOf } from '../host'

export const cookieParamsApp = hostOf(generated)
