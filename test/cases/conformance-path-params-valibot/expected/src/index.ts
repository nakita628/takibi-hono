import { Hono } from 'hono'
import {
  allofHandler,
  base64Handler,
  base64urlHandler,
  benumHandler,
  bigintHandler,
  booleanHandler,
  byteHandler,
  cidrv4Handler,
  cidrv6Handler,
  creditcardHandler,
  cuid2Handler,
  currencycodeHandler,
  dateHandler,
  datetimeHandler,
  doubleHandler,
  durationHandler,
  e164Handler,
  emailHandler,
  emojiHandler,
  exclusiveHandler,
  floatHandler,
  float32Handler,
  float64Handler,
  guidHandler,
  hexHandler,
  hostnameHandler,
  httpurlHandler,
  ibanHandler,
  iconstHandler,
  ienumHandler,
  int32Handler,
  int64Handler,
  int64rangeHandler,
  integerHandler,
  inullHandler,
  ipv4Handler,
  ipv6Handler,
  ksuidHandler,
  labelHandler,
  labelarrHandler,
  labelexplodeHandler,
  labelobjxHandler,
  labelstrHandler,
  lengthHandler,
  macHandler,
  matrixHandler,
  matrixarrHandler,
  matrixexplodeHandler,
  matrixobjHandler,
  matrixobjxHandler,
  matrixstrHandler,
  multipleHandler,
  namedHandler,
  nanoidHandler,
  nenumHandler,
  numberHandler,
  numericsenumHandler,
  numpasswordHandler,
  oneofHandler,
  oneofisHandler,
  orgsHandler,
  overrideHandler,
  paramrefHandler,
  patternHandler,
  rangeHandler,
  schemarefHandler,
  sconstHandler,
  senumHandler,
  sharedHandler,
  simplearrHandler,
  simpleobjHandler,
  simpleobjxHandler,
  simplestrarrHandler,
  stringHandler,
  strpasswordHandler,
  timeHandler,
  trimHandler,
  txemailHandler,
  txlowerHandler,
  txnormalizeHandler,
  txupperHandler,
  uint32Handler,
  uint64Handler,
  ulidHandler,
  uriHandler,
  urlHandler,
  uuidHandler,
  uuidv4Handler,
  uuidv7Handler,
  xidHandler,
} from './handlers'

const app = new Hono()

export const api = app
  .route('/', allofHandler)
  .route('/', base64Handler)
  .route('/', base64urlHandler)
  .route('/', benumHandler)
  .route('/', bigintHandler)
  .route('/', booleanHandler)
  .route('/', byteHandler)
  .route('/', cidrv4Handler)
  .route('/', cidrv6Handler)
  .route('/', creditcardHandler)
  .route('/', cuid2Handler)
  .route('/', currencycodeHandler)
  .route('/', dateHandler)
  .route('/', datetimeHandler)
  .route('/', doubleHandler)
  .route('/', durationHandler)
  .route('/', e164Handler)
  .route('/', emailHandler)
  .route('/', emojiHandler)
  .route('/', exclusiveHandler)
  .route('/', floatHandler)
  .route('/', float32Handler)
  .route('/', float64Handler)
  .route('/', guidHandler)
  .route('/', hexHandler)
  .route('/', hostnameHandler)
  .route('/', httpurlHandler)
  .route('/', ibanHandler)
  .route('/', iconstHandler)
  .route('/', ienumHandler)
  .route('/', int32Handler)
  .route('/', int64Handler)
  .route('/', int64rangeHandler)
  .route('/', integerHandler)
  .route('/', inullHandler)
  .route('/', ipv4Handler)
  .route('/', ipv6Handler)
  .route('/', ksuidHandler)
  .route('/', labelHandler)
  .route('/', labelarrHandler)
  .route('/', labelexplodeHandler)
  .route('/', labelobjxHandler)
  .route('/', labelstrHandler)
  .route('/', lengthHandler)
  .route('/', macHandler)
  .route('/', matrixHandler)
  .route('/', matrixarrHandler)
  .route('/', matrixexplodeHandler)
  .route('/', matrixobjHandler)
  .route('/', matrixobjxHandler)
  .route('/', matrixstrHandler)
  .route('/', multipleHandler)
  .route('/', namedHandler)
  .route('/', nanoidHandler)
  .route('/', nenumHandler)
  .route('/', numberHandler)
  .route('/', numericsenumHandler)
  .route('/', numpasswordHandler)
  .route('/', oneofHandler)
  .route('/', oneofisHandler)
  .route('/', orgsHandler)
  .route('/', overrideHandler)
  .route('/', paramrefHandler)
  .route('/', patternHandler)
  .route('/', rangeHandler)
  .route('/', schemarefHandler)
  .route('/', sconstHandler)
  .route('/', senumHandler)
  .route('/', sharedHandler)
  .route('/', simplearrHandler)
  .route('/', simpleobjHandler)
  .route('/', simpleobjxHandler)
  .route('/', simplestrarrHandler)
  .route('/', stringHandler)
  .route('/', strpasswordHandler)
  .route('/', timeHandler)
  .route('/', trimHandler)
  .route('/', txemailHandler)
  .route('/', txlowerHandler)
  .route('/', txnormalizeHandler)
  .route('/', txupperHandler)
  .route('/', uint32Handler)
  .route('/', uint64Handler)
  .route('/', ulidHandler)
  .route('/', uriHandler)
  .route('/', urlHandler)
  .route('/', uuidHandler)
  .route('/', uuidv4Handler)
  .route('/', uuidv7Handler)
  .route('/', xidHandler)

export default app
