import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
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
    z.object({
      ref_int: CountSchema.exactOptional(),
      ref_big: BigSchema.exactOptional(),
      ref_num: RatioSchema.exactOptional(),
      ref_bool: FlagSchema.exactOptional(),
      ref_enum: LevelSchema.exactOptional(),
      ref_str: NameSchema.exactOptional(),
      ref_arr: CountsSchema.exactOptional(),
      arr_ref: z.array(CountSchema).exactOptional(),
      allof_ref: CountSchema.meta({ description: 'A count.' }).exactOptional(),
      ref_ref: CountSchema.exactOptional(),
    }),
  ),
  (c) => {},
)
