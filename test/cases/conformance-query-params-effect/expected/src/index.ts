import { Hono } from 'hono'
import {
  absentHandler,
  combinatorsHandler,
  contentHandler,
  defaultsHandler,
  inheritedHandler,
  isoHandler,
  limitsHandler,
  literalsHandler,
  objectsHandler,
  openHandler,
  optionalHandler,
  paramsHandler,
  refsHandler,
  requiredHandler,
  sharedHandler,
  stylesHandler,
} from './handlers'

const app = new Hono()

export const api = app
  .route('/', absentHandler)
  .route('/', combinatorsHandler)
  .route('/', contentHandler)
  .route('/', defaultsHandler)
  .route('/', inheritedHandler)
  .route('/', isoHandler)
  .route('/', limitsHandler)
  .route('/', literalsHandler)
  .route('/', objectsHandler)
  .route('/', openHandler)
  .route('/', optionalHandler)
  .route('/', paramsHandler)
  .route('/', refsHandler)
  .route('/', requiredHandler)
  .route('/', sharedHandler)
  .route('/', stylesHandler)

export default app
