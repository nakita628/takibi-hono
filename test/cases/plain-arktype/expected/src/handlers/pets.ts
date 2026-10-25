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
        'limit?': type('string')
          .pipe((data, ctx) => {
            const value = Number(data)
            return Number.isSafeInteger(value) ? value : ctx.error('an integer')
          })
          .to('number.integer >= 1 & number.integer <= 100'),
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
    sValidator(
      'param',
      type({
        petId: type('string')
          .pipe((data, ctx) => {
            const value = Number(data)
            return Number.isSafeInteger(value) ? value : ctx.error('an integer')
          })
          .to('number.integer >= 1'),
      }),
    ),
    (c) => {},
  )
  .delete(
    '/pets/:petId',
    sValidator(
      'param',
      type({
        petId: type('string').pipe((data, ctx) => {
          const value = Number(data)
          return Number.isSafeInteger(value) ? value : ctx.error('an integer')
        }),
      }),
    ),
    (c) => {},
  )
  .post(
    '/pets/:petId/photos',
    sValidator(
      'param',
      type({
        petId: type('string').pipe((data, ctx) => {
          const value = Number(data)
          return Number.isSafeInteger(value) ? value : ctx.error('an integer')
        }),
      }),
    ),
    sValidator(
      'form',
      type({
        caption: type('string').narrow(
          (data, ctx) => [...data].length >= 1 || ctx.mustBe('at least 1 character'),
        ),
        'featured?': 'boolean',
      }),
    ),
    (c) => {},
  )
