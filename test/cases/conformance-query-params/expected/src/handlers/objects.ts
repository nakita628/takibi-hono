import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { FieldsResponse } from '../components'

export const objectsHandler = new Hono().get(
  '/objects',
  describeRoute({ operationId: 'queryObjects', responses: { '200': FieldsResponse } }),
  validator(
    'query',
    z.object({
      deep: z
        .object({
          name: z.string().exactOptional(),
          age: z
            .preprocess(
              (val) =>
                typeof val === 'string' && /^-?(?:0|[1-9]\d*)$/.test(val) ? Number(val) : val,
              z.number().int().min(0),
            )
            .exactOptional(),
          active: z.stringbool().exactOptional(),
          ids: z
            .preprocess(
              (val) => (val === undefined || Array.isArray(val) ? val : [val]),
              z.array(
                z.preprocess(
                  (val) =>
                    typeof val === 'string' && /^-?(?:0|[1-9]\d*)$/.test(val) ? Number(val) : val,
                  z.number().int(),
                ),
              ),
            )
            .exactOptional(),
          points: z
            .preprocess(
              (val) => (val === undefined || Array.isArray(val) ? val : [val]),
              z.array(
                z.object({
                  x: z
                    .preprocess(
                      (val) =>
                        typeof val === 'string' && /^-?(?:0|[1-9]\d*)$/.test(val)
                          ? Number(val)
                          : val,
                      z.number().int(),
                    )
                    .exactOptional(),
                  y: z
                    .preprocess(
                      (val) =>
                        typeof val === 'string' && /^-?(?:0|[1-9]\d*)$/.test(val)
                          ? Number(val)
                          : val,
                      z.number().int(),
                    )
                    .exactOptional(),
                }),
              ),
            )
            .exactOptional(),
          tags: z
            .preprocess(
              (val) => (val === undefined || Array.isArray(val) ? val : [val]),
              z.array(z.string()),
            )
            .exactOptional(),
          range: z
            .object({
              min: z
                .preprocess(
                  (val) =>
                    typeof val === 'string' && /^-?(?:0|[1-9]\d*)$/.test(val) ? Number(val) : val,
                  z.number().int(),
                )
                .exactOptional(),
              max: z
                .preprocess(
                  (val) =>
                    typeof val === 'string' && /^-?(?:0|[1-9]\d*)$/.test(val) ? Number(val) : val,
                  z.number().int(),
                )
                .exactOptional(),
            })
            .exactOptional(),
        })
        .exactOptional(),
      deep_ref: z
        .object({
          from: z.preprocess(
            (val) =>
              typeof val === 'string' && /^-?(?:0|[1-9]\d*)$/.test(val) ? Number(val) : val,
            z.number().int(),
          ),
          to: z
            .preprocess(
              (val) =>
                typeof val === 'string' && /^-?(?:0|[1-9]\d*)$/.test(val) ? Number(val) : val,
              z.number().int(),
            )
            .exactOptional(),
        })
        .exactOptional(),
      spread: z
        .object({
          sort: z.enum(['asc', 'desc']).exactOptional(),
          size: z
            .preprocess(
              (val) =>
                typeof val === 'string' && /^-?(?:0|[1-9]\d*)$/.test(val) ? Number(val) : val,
              z.number().int(),
            )
            .exactOptional(),
          page: z
            .preprocess(
              (val) =>
                typeof val === 'string' && /^-?(?:0|[1-9]\d*)$/.test(val) ? Number(val) : val,
              z.number().int(),
            )
            .exactOptional(),
        })
        .exactOptional(),
      pairs: z
        .object({
          name: z.string().exactOptional(),
          age: z
            .preprocess(
              (val) =>
                typeof val === 'string' && /^-?(?:0|[1-9]\d*)$/.test(val) ? Number(val) : val,
              z.number().int(),
            )
            .exactOptional(),
        })
        .exactOptional(),
      page: z.string().exactOptional(),
      limit: z
        .preprocess(
          (val) => (typeof val === 'string' && /^-?(?:0|[1-9]\d*)$/.test(val) ? Number(val) : val),
          z.number().int(),
        )
        .exactOptional(),
    }),
  ),
  (c) => {},
)
