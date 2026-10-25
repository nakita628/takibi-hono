import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { FieldsResponse } from '../components'

export const stylesHandler = new Hono().get(
  '/styles',
  describeRoute({ operationId: 'queryStyles', responses: { '200': FieldsResponse } }),
  validator(
    'query',
    v.partial(
      v.object({
        csv: v.pipe(
          v.unknown(),
          v.transform((input) => (input === undefined || Array.isArray(input) ? input : [input])),
          v.array(v.pipe(v.string(), v.transform(Number), v.number(), v.safeInteger())),
        ),
        pipes: v.pipe(
          v.unknown(),
          v.transform((input) => (input === undefined || Array.isArray(input) ? input : [input])),
          v.array(v.pipe(v.string(), v.transform(Number), v.number(), v.safeInteger())),
        ),
        spaces: v.pipe(
          v.unknown(),
          v.transform((input) => (input === undefined || Array.isArray(input) ? input : [input])),
          v.array(v.pipe(v.string(), v.transform(Number), v.number(), v.safeInteger())),
        ),
        filter: v.partial(
          v.object({
            name: v.string(),
            age: v.pipe(v.string(), v.transform(Number), v.number(), v.safeInteger()),
          }),
        ),
        csv_str: v.pipe(
          v.unknown(),
          v.transform((input) => (input === undefined || Array.isArray(input) ? input : [input])),
          v.array(v.string()),
        ),
      }),
    ),
  ),
  (c) => {},
)
