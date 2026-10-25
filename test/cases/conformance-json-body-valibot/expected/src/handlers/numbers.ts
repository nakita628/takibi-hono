import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { IdSchema, FieldsResponse } from '../components'

export const numbersHandler = new Hono().post(
  '/numbers',
  describeRoute({ operationId: 'numbers', responses: { '200': FieldsResponse } }),
  validator(
    'json',
    v.object({
      id: v.optional(
        v.pipe(
          v.union([
            v.bigint(),
            v.pipe(v.number(), v.integer()),
            v.pipe(v.string(), v.regex(/^-?\d+$/)),
          ]),
          v.transform((input) => BigInt(input)),
          v.minValue(-9223372036854775808n),
          v.maxValue(9223372036854775807n),
        ),
      ),
      unsigned: v.optional(
        v.pipe(
          v.union([
            v.bigint(),
            v.pipe(v.number(), v.integer()),
            v.pipe(v.string(), v.regex(/^-?\d+$/)),
          ]),
          v.transform((input) => BigInt(input)),
          v.minValue(0n),
          v.maxValue(18446744073709551615n),
        ),
      ),
      ranged: v.optional(
        v.pipe(
          v.union([
            v.bigint(),
            v.pipe(v.number(), v.integer()),
            v.pipe(v.string(), v.regex(/^-?\d+$/)),
          ]),
          v.transform((input) => BigInt(input)),
          v.minValue(-9223372036854775808n),
          v.maxValue(9223372036854775807n),
          v.minValue(1n),
          v.maxValue(100n),
        ),
      ),
      level: v.optional(
        v.pipe(
          v.union([
            v.bigint(),
            v.pipe(v.number(), v.integer()),
            v.pipe(v.string(), v.regex(/^-?\d+$/)),
          ]),
          v.transform((input) => BigInt(input)),
          v.union([v.literal(1n), v.literal(2n)]),
        ),
      ),
      version: v.optional(
        v.pipe(
          v.union([
            v.bigint(),
            v.pipe(v.number(), v.integer()),
            v.pipe(v.string(), v.regex(/^-?\d+$/)),
          ]),
          v.transform((input) => BigInt(input)),
          v.literal(5n),
        ),
      ),
      cursor: v.optional(
        v.pipe(
          v.union([
            v.bigint(),
            v.pipe(v.number(), v.integer()),
            v.pipe(v.string(), v.regex(/^-?\d+$/)),
          ]),
          v.transform((input) => BigInt(input)),
          v.minValue(-9223372036854775808n),
          v.maxValue(9223372036854775807n),
        ),
        0n,
      ),
      maybe: v.optional(
        v.nullable(
          v.pipe(
            v.union([
              v.bigint(),
              v.pipe(v.number(), v.integer()),
              v.pipe(v.string(), v.regex(/^-?\d+$/)),
            ]),
            v.transform((input) => BigInt(input)),
            v.minValue(-9223372036854775808n),
            v.maxValue(9223372036854775807n),
          ),
        ),
      ),
      ids: v.optional(
        v.array(
          v.pipe(
            v.union([
              v.bigint(),
              v.pipe(v.number(), v.integer()),
              v.pipe(v.string(), v.regex(/^-?\d+$/)),
            ]),
            v.transform((input) => BigInt(input)),
            v.minValue(-9223372036854775808n),
            v.maxValue(9223372036854775807n),
          ),
        ),
      ),
      small: v.optional(
        v.pipe(v.number(), v.integer(), v.minValue(-2147483648), v.maxValue(2147483647)),
      ),
      ref: v.optional(IdSchema),
    }),
  ),
  (c) => {},
)
