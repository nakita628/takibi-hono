import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { FieldsResponse } from '../components'

export const literalsHandler = new Hono().get(
  '/literals',
  describeRoute({ operationId: 'queryLiterals', responses: { '200': FieldsResponse } }),
  validator(
    'query',
    type({
      'ienum?': '1 | 2 | 3',
      'nenum?': '1.5 | 2.5',
      'benum?': 'true',
      'iconst?': '7',
      'senum?': "'asc' | 'desc'",
      'sconst?': "'fixed'",
      'numericsenum?': "'1' | '02' | 'true'",
      'inull?': 'string.integer.parse | null',
      'bnull?': type(type("'true' | 'false'").pipe((data) => data === 'true')).or('null'),
      'nullof?': 'string.integer.parse | null | null',
      'inull_arr?': 'string.integer.parse | null[]',
      'inull_list?': 'string.integer.parse[] | null',
      'snull?': 'string | null',
      'ioneof?': "string.integer.parse | 'all'",
      'ienum_arr?': '1 | 2 | 3[]',
      'senum_arr?': "'asc' | 'desc'[]",
    }),
  ),
  (c) => {},
)
