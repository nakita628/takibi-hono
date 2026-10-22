import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { RangeSchema, FieldsResponse } from '../components'

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
            age: v.pipe(v.string(), v.transform(Number), v.number(), v.integer(), v.minValue(0)),
            active: v.pipe(
              v.picklist(['true', 'false']),
              v.transform((input) => input === 'true'),
            ),
            ids: v.array(v.pipe(v.string(), v.transform(Number), v.number(), v.integer())),
            points: v.array(
              v.partial(
                v.object({
                  x: v.pipe(v.string(), v.transform(Number), v.number(), v.integer()),
                  y: v.pipe(v.string(), v.transform(Number), v.number(), v.integer()),
                }),
              ),
            ),
            tags: v.array(v.string()),
            range: v.partial(
              v.object({
                min: v.pipe(v.string(), v.transform(Number), v.number(), v.integer()),
                max: v.pipe(v.string(), v.transform(Number), v.number(), v.integer()),
              }),
            ),
          }),
        ),
        deep_ref: RangeSchema,
        spread: v.partial(
          v.object({
            sort: v.picklist(['asc', 'desc']),
            size: v.pipe(v.string(), v.transform(Number), v.number(), v.integer()),
            page: v.pipe(v.string(), v.transform(Number), v.number(), v.integer()),
          }),
        ),
        pairs: v.partial(
          v.object({
            name: v.string(),
            age: v.pipe(v.string(), v.transform(Number), v.number(), v.integer()),
          }),
        ),
        page: v.string(),
        limit: v.pipe(v.string(), v.transform(Number), v.number(), v.integer()),
      }),
    ),
  ),
  (c) => {},
)
