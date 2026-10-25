import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { FieldsResponse } from '../components'

export const literalsHandler = new Hono().get(
  '/literals',
  describeRoute({ operationId: 'queryLiterals', responses: { '200': FieldsResponse } }),
  validator(
    'query',
    v.partial(
      v.object({
        ienum: v.pipe(
          v.string(),
          v.transform(Number),
          v.union([v.literal(1), v.literal(2), v.literal(3)]),
        ),
        nenum: v.pipe(v.string(), v.transform(Number), v.union([v.literal(1.5), v.literal(2.5)])),
        benum: v.pipe(
          v.string(),
          v.regex(/^(?:true|1|yes|on|y|enabled|false|0|no|off|n|disabled)$/i),
          v.transform((input) => /^(?:true|1|yes|on|y|enabled)$/i.test(input)),
          v.literal(true),
        ),
        iconst: v.pipe(v.string(), v.transform(Number), v.literal(7)),
        senum: v.picklist(['asc', 'desc']),
        sconst: v.literal('fixed'),
        numericsenum: v.picklist(['1', '02', 'true']),
        inull: v.pipe(
          v.unknown(),
          v.transform((input) => (input === 'null' ? null : input)),
          v.nullable(v.pipe(v.string(), v.transform(Number), v.number(), v.safeInteger())),
        ),
        bnull: v.pipe(
          v.unknown(),
          v.transform((input) => (input === 'null' ? null : input)),
          v.nullable(
            v.pipe(
              v.string(),
              v.regex(/^(?:true|1|yes|on|y|enabled|false|0|no|off|n|disabled)$/i),
              v.transform((input) => /^(?:true|1|yes|on|y|enabled)$/i.test(input)),
            ),
          ),
        ),
        nullof: v.pipe(
          v.unknown(),
          v.transform((input) => (input === 'null' ? null : input)),
          v.nullable(
            v.union([
              v.pipe(v.string(), v.transform(Number), v.number(), v.safeInteger()),
              v.pipe(
                v.unknown(),
                v.transform((input) => (input === 'null' ? null : input)),
                v.nullable(v.null()),
              ),
            ]),
          ),
        ),
        inull_arr: v.pipe(
          v.unknown(),
          v.transform((input) => (input === undefined || Array.isArray(input) ? input : [input])),
          v.array(
            v.pipe(
              v.unknown(),
              v.transform((input) => (input === 'null' ? null : input)),
              v.nullable(v.pipe(v.string(), v.transform(Number), v.number(), v.safeInteger())),
            ),
          ),
        ),
        inull_list: v.pipe(
          v.unknown(),
          v.transform((input) => (input === 'null' ? null : input)),
          v.nullable(
            v.pipe(
              v.unknown(),
              v.transform((input) =>
                input === undefined || Array.isArray(input) ? input : [input],
              ),
              v.array(v.pipe(v.string(), v.transform(Number), v.number(), v.safeInteger())),
            ),
          ),
        ),
        snull: v.nullable(v.string()),
        ioneof: v.union([
          v.pipe(v.string(), v.transform(Number), v.number(), v.safeInteger()),
          v.literal('all'),
        ]),
        ienum_arr: v.pipe(
          v.unknown(),
          v.transform((input) => (input === undefined || Array.isArray(input) ? input : [input])),
          v.array(
            v.pipe(
              v.string(),
              v.transform(Number),
              v.union([v.literal(1), v.literal(2), v.literal(3)]),
            ),
          ),
        ),
        senum_arr: v.pipe(
          v.unknown(),
          v.transform((input) => (input === undefined || Array.isArray(input) ? input : [input])),
          v.array(v.picklist(['asc', 'desc'])),
        ),
      }),
    ),
  ),
  (c) => {},
)
