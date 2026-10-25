import { Hono } from 'hono'
import { defineHandler } from 'hono/factory'
import { type } from 'arktype'
import { TagSchema, PetSchema, NewPetSchema } from '../components'

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
})(async (c, { query, header, cookie }) => {})

export const postPetsHandler = defineHandler({
  header: { '~standard': type({ 'x-request-id?': 'string' })['~standard'] },
  json: { '~standard': NewPetSchema['~standard'] },
  response: { '~standard': PetSchema['~standard'] },
})(async (c, { header, json }) => {})

export const headPetsHandler = defineHandler({
  header: { '~standard': type({ 'x-request-id?': 'string' })['~standard'] },
})(async (c, { header }) => {})

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
})(async (c, { param }) => {})

export const deletePetsPetIdHandler = defineHandler({
  param: {
    '~standard': type({
      petId: type('string').pipe((data, ctx) => {
        const value = Number(data)
        return Number.isSafeInteger(value) ? value : ctx.error('an integer')
      }),
    })['~standard'],
  },
})(async (c, { param }) => {})

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
})(async (c, { param, form }) => {})

export const petsHandler = new Hono()
  .get('/pets', getPetsHandler)
  .post('/pets', postPetsHandler)
  .on('HEAD', '/pets', headPetsHandler)
  .get('/pets/:petId', getPetsPetIdHandler)
  .delete('/pets/:petId', deletePetsPetIdHandler)
  .post('/pets/:petId/photos', postPetsPetIdPhotosHandler)
