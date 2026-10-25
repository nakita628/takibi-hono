import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
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
    v.partial(
      v.object({
        ref_int: CountSchema,
        ref_big: BigSchema,
        ref_num: RatioSchema,
        ref_bool: FlagSchema,
        ref_enum: LevelSchema,
        ref_str: NameSchema,
        ref_arr: CountsSchema,
        arr_ref: v.pipe(
          v.unknown(),
          v.transform((input) => (input === undefined || Array.isArray(input) ? input : [input])),
          v.array(CountSchema),
        ),
        allof_ref: v.pipe(CountSchema, v.description('A count.')),
        ref_ref: CountSchema,
      }),
    ),
  ),
  (c) => {},
)
