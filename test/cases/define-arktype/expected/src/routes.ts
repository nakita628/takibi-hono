import { defineHandler } from 'hono/factory'
import { type } from 'arktype'
import { TagSchema, PetSchema, NewPetSchema } from './components'

export const getHandler = defineHandler({
  response: { '~standard': type({ status: "'ok'" })['~standard'] },
})

export const getPetsHandler = defineHandler({
  query: {
    '~standard': type({
      'limit?': type('string')
        .pipe((data, ctx) => {
          const value = Number(data)
          return Number.isSafeInteger(value) ? value : ctx.error('an integer')
        })
        .to('number.integer >= 1 & number.integer <= 100'),
      'tag?': TagSchema,
    })['~standard'],
  },
  header: { '~standard': type({ 'x-request-id?': 'string' })['~standard'] },
  cookie: { '~standard': type({ 'session?': 'string' })['~standard'] },
  response: { '~standard': type(PetSchema).array()['~standard'] },
})

export const postPetsHandler = defineHandler({
  header: { '~standard': type({ 'x-request-id?': 'string' })['~standard'] },
  json: { '~standard': NewPetSchema['~standard'] },
  response: { '~standard': PetSchema['~standard'] },
})

export const headPetsHandler = defineHandler({
  header: { '~standard': type({ 'x-request-id?': 'string' })['~standard'] },
})

export const getPetsPetIdHandler = defineHandler({
  param: {
    '~standard': type({
      petId: type('string')
        .pipe((data, ctx) => {
          const value = Number(data)
          return Number.isSafeInteger(value) ? value : ctx.error('an integer')
        })
        .to('number.integer >= 1'),
    })['~standard'],
  },
  response: { '~standard': PetSchema['~standard'] },
})

export const deletePetsPetIdHandler = defineHandler({
  param: {
    '~standard': type({
      petId: type('string').pipe((data, ctx) => {
        const value = Number(data)
        return Number.isSafeInteger(value) ? value : ctx.error('an integer')
      }),
    })['~standard'],
  },
})

export const postPetsPetIdPhotosHandler = defineHandler({
  param: {
    '~standard': type({
      petId: type('string').pipe((data, ctx) => {
        const value = Number(data)
        return Number.isSafeInteger(value) ? value : ctx.error('an integer')
      }),
    })['~standard'],
  },
  form: {
    '~standard': type({
      caption: type('string').narrow(
        (data, ctx) => [...data].length >= 1 || ctx.mustBe('at least 1 character'),
      ),
      'featured?': type(/^(?:true|1|yes|on|y|enabled|false|0|no|off|n|disabled)$/i).pipe((data) =>
        /^(?:true|1|yes|on|y|enabled)$/i.test(data),
      ),
    })['~standard'],
  },
})

export const get202401ReportsHandler = defineHandler({
  response: { '~standard': type('string[]')['~standard'] },
})
