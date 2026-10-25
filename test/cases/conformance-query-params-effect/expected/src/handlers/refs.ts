import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Schema, SchemaTransformation } from 'effect'
import {
  CountSchema,
  BigSchema,
  RatioSchema,
  FlagSchema,
  LevelSchema,
  NameSchema,
  CountsSchema,
  FieldsResponse,
} from '../components'

export const refsHandler = new Hono().get(
  '/refs',
  describeRoute({ operationId: 'queryRefs', responses: { '200': FieldsResponse } }),
  validator(
    'query',
    Schema.toStandardSchemaV1(
      Schema.Struct({
        ref_int: Schema.optional(CountSchema),
        ref_big: Schema.optional(BigSchema),
        ref_num: Schema.optional(RatioSchema),
        ref_bool: Schema.optional(FlagSchema),
        ref_enum: Schema.optional(LevelSchema),
        ref_str: Schema.optional(NameSchema),
        ref_arr: Schema.optional(CountsSchema),
        arr_ref: Schema.optional(
          Schema.Unknown.pipe(
            Schema.decodeTo(
              Schema.Unknown,
              SchemaTransformation.transform<unknown, unknown>({
                decode: (input) => (input === undefined || Array.isArray(input) ? input : [input]),
                encode: (output) => output,
              }),
            ),
            Schema.decodeTo(Schema.Array(CountSchema)),
          ),
        ),
        allof_ref: Schema.optional(CountSchema.annotate({ description: 'A count.' })),
        ref_ref: Schema.optional(CountSchema),
      }),
    ),
  ),
  (c) => {},
)
