import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { FieldsResponse } from '../components'

export const optionalHandler = new Hono().get(
  '/optional',
  describeRoute({ operationId: 'queryOptional', responses: { '200': FieldsResponse } }),
  validator(
    'query',
    z.object({
      int_opt: z.coerce.number().int().exactOptional(),
      int64_opt: z.coerce.bigint().pipe(z.int64()).exactOptional(),
      num_opt: z.coerce.number().exactOptional(),
      bool_opt: z.stringbool().exactOptional(),
      str_opt: z.string().exactOptional(),
      uuid_opt: z.uuid().exactOptional(),
      arr_opt: z.array(z.coerce.number().int()).exactOptional(),
      'page-size': z.coerce.number().int().exactOptional(),
      'filter[name]': z.string().exactOptional(),
      $top: z.coerce.number().int().exactOptional(),
      'user.id': z.coerce.number().int().exactOptional(),
      'ids[]': z.array(z.coerce.number().int()).exactOptional(),
      Int_Opt: z.string().exactOptional(),
      constructor: z.coerce.number().int().exactOptional(),
    }),
  ),
  (c) => {},
)
