import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { EchoResponse } from '../components'

export const durationHandler = new Hono().get(
  '/duration/:value',
  describeRoute({ operationId: 'durationParam', responses: { '200': EchoResponse } }),
  validator(
    'param',
    v.object({
      value: v.pipe(
        v.string(),
        v.regex(
          /^P(?:(\d+W)|(?!.*W)(?=\d|T\d)(\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+([.,]\d+)?S)?)?)$/,
        ),
      ),
    }),
  ),
  (c) => {},
)
