import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { FieldsResponse } from '../components'

export const objectsHandler = new Hono().get(
  '/objects',
  describeRoute({ operationId: 'queryObjects', responses: { '200': FieldsResponse } }),
  validator(
    'query',
    v.partial(
      v.object({
        deep: v.partial(
          v.object({
            name: v.string(),
            age: v.pipe(
              v.string(),
              v.transform(Number),
              v.number(),
              v.safeInteger(),
              v.minValue(0),
            ),
            active: v.pipe(
              v.string(),
              v.regex(/^(?:true|1|yes|on|y|enabled|false|0|no|off|n|disabled)$/i),
              v.transform((input) => /^(?:true|1|yes|on|y|enabled)$/i.test(input)),
            ),
            ids: v.pipe(
              v.unknown(),
              v.transform((input) =>
                input === undefined || Array.isArray(input) ? input : [input],
              ),
              v.array(v.pipe(v.string(), v.transform(Number), v.number(), v.safeInteger())),
            ),
            points: v.pipe(
              v.unknown(),
              v.transform((input) =>
                input === undefined || Array.isArray(input) ? input : [input],
              ),
              v.array(
                v.partial(
                  v.object({
                    x: v.pipe(v.string(), v.transform(Number), v.number(), v.safeInteger()),
                    y: v.pipe(v.string(), v.transform(Number), v.number(), v.safeInteger()),
                  }),
                ),
              ),
            ),
            tags: v.pipe(
              v.unknown(),
              v.transform((input) =>
                input === undefined || Array.isArray(input) ? input : [input],
              ),
              v.array(v.string()),
            ),
            range: v.partial(
              v.object({
                min: v.pipe(v.string(), v.transform(Number), v.number(), v.safeInteger()),
                max: v.pipe(v.string(), v.transform(Number), v.number(), v.safeInteger()),
              }),
            ),
          }),
        ),
        deep_ref: v.object({
          from: v.pipe(v.string(), v.transform(Number), v.number(), v.safeInteger()),
          to: v.optional(v.pipe(v.string(), v.transform(Number), v.number(), v.safeInteger())),
        }),
        spread: v.partial(
          v.object({
            sort: v.picklist(['asc', 'desc']),
            size: v.pipe(v.string(), v.transform(Number), v.number(), v.safeInteger()),
            page: v.pipe(v.string(), v.transform(Number), v.number(), v.safeInteger()),
          }),
        ),
        pairs: v.partial(
          v.object({
            name: v.string(),
            age: v.pipe(v.string(), v.transform(Number), v.number(), v.safeInteger()),
          }),
        ),
        page: v.string(),
        limit: v.pipe(v.string(), v.transform(Number), v.number(), v.safeInteger()),
      }),
    ),
  ),
  (c) => {},
)
