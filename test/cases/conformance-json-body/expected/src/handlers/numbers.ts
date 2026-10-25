import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { IdSchema, FieldsResponse } from '../components'

export const numbersHandler = new Hono().post(
  '/numbers',
  describeRoute({ operationId: 'numbers', responses: { '200': FieldsResponse } }),
  validator(
    'json',
    z.object({
      id: z
        .union([z.bigint(), z.number().int(), z.string().regex(/^-?\d+$/)])
        .transform((val) => BigInt(val))
        .pipe(z.int64())
        .exactOptional(),
      unsigned: z
        .union([z.bigint(), z.number().int(), z.string().regex(/^-?\d+$/)])
        .transform((val) => BigInt(val))
        .pipe(z.uint64())
        .exactOptional(),
      ranged: z
        .union([z.bigint(), z.number().int(), z.string().regex(/^-?\d+$/)])
        .transform((val) => BigInt(val))
        .pipe(z.int64().min(1n).max(100n))
        .exactOptional(),
      level: z
        .union([z.bigint(), z.number().int(), z.string().regex(/^-?\d+$/)])
        .transform((val) => BigInt(val))
        .pipe(z.union([z.literal(1n), z.literal(2n)]))
        .exactOptional(),
      version: z
        .union([z.bigint(), z.number().int(), z.string().regex(/^-?\d+$/)])
        .transform((val) => BigInt(val))
        .pipe(z.literal(5n))
        .exactOptional(),
      cursor: z
        .union([z.bigint(), z.number().int(), z.string().regex(/^-?\d+$/)])
        .transform((val) => BigInt(val))
        .pipe(z.int64())
        .default(0n)
        .exactOptional(),
      maybe: z
        .union([z.bigint(), z.number().int(), z.string().regex(/^-?\d+$/)])
        .transform((val) => BigInt(val))
        .pipe(z.int64())
        .nullable()
        .exactOptional(),
      ids: z
        .array(
          z
            .union([z.bigint(), z.number().int(), z.string().regex(/^-?\d+$/)])
            .transform((val) => BigInt(val))
            .pipe(z.int64()),
        )
        .exactOptional(),
      small: z.int32().exactOptional(),
      ref: IdSchema.exactOptional(),
    }),
  ),
  (c) => {},
)
