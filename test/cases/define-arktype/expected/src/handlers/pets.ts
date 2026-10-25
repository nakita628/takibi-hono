import { Hono } from 'hono'
import {
  getPetsHandler,
  postPetsHandler,
  headPetsHandler,
  getPetsPetIdHandler,
  deletePetsPetIdHandler,
  postPetsPetIdPhotosHandler,
} from '../routes'

export const petsHandler = new Hono()
  .get(
    '/pets',
    getPetsHandler(async (c, { query, header, cookie }) => {}),
  )
  .post(
    '/pets',
    postPetsHandler(async (c, { header, json }) => {}),
  )
  .on(
    'HEAD',
    '/pets',
    headPetsHandler(async (c, { header }) => {}),
  )
  .get(
    '/pets/:petId',
    getPetsPetIdHandler(async (c, { param }) => {}),
  )
  .delete(
    '/pets/:petId',
    deletePetsPetIdHandler(async (c, { param }) => {}),
  )
  .post(
    '/pets/:petId/photos',
    postPetsPetIdPhotosHandler(async (c, { param, form }) => {}),
  )
