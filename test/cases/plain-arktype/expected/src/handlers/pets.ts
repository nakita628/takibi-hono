import { Hono } from 'hono'
import { sValidator } from '@hono/standard-validator'
import { type } from 'arktype'
import { TagSchema, NewPetSchema } from '../components'

export const petsHandler = new Hono()
  .get(
    '/pets',
    sValidator(
      'query',
      type({
        'limit?': type('string.integer.parse').to(
          type('number.integer >= 1').and(type('number.integer <= 100')),
        ),
        'tag?': TagSchema,
      }),
    ),
    sValidator('header', type({ 'X-Request-Id?': 'string' })),
    sValidator('cookie', type({ 'session?': 'string' })),
    (c) => {},
  )
  .post(
    '/pets',
    sValidator('header', type({ 'X-Request-Id?': 'string' })),
    sValidator('json', NewPetSchema),
    (c) => {},
  )
  .on('HEAD', '/pets', sValidator('header', type({ 'X-Request-Id?': 'string' })), (c) => {})
  .get(
    '/pets/:petId',
    sValidator('param', type({ petId: type('string.integer.parse').to('number.integer >= 1') })),
    (c) => {},
  )
  .delete('/pets/:petId', sValidator('param', type({ petId: 'string.integer.parse' })), (c) => {})
  .post(
    '/pets/:petId/photos',
    sValidator('param', type({ petId: 'string.integer.parse' })),
    sValidator('form', type({ caption: type('string >= 1'), 'featured?': 'boolean' })),
    (c) => {},
  )
