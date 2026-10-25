import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
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
    type({
      'ref_int?': CountSchema,
      'ref_big?': BigSchema,
      'ref_num?': RatioSchema,
      'ref_bool?': FlagSchema,
      'ref_enum?': LevelSchema,
      'ref_str?': NameSchema,
      'ref_arr?': CountsSchema,
      'arr_ref?': type('unknown').pipe(
        (data) => (data === undefined || Array.isArray(data) ? data : [data]),
        type(CountSchema).array(),
      ),
      'allof_ref?': CountSchema.describe('A count.'),
      'ref_ref?': CountSchema,
    }),
  ),
  (c) => {},
)
