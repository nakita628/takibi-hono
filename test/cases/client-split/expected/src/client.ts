import { hc } from 'hono/client'
import type { _202401, __root, pets } from '.'

type _202401Client = ReturnType<typeof hc<typeof _202401>>

const hc_202401WithType = (...args: Parameters<typeof hc>): _202401Client =>
  hc<typeof _202401>(...args)

export const _202401Client = hc_202401WithType('/').api

type __RootClient = ReturnType<typeof hc<typeof __root>>

const hc__RootWithType = (...args: Parameters<typeof hc>): __RootClient =>
  hc<typeof __root>(...args)

export const __rootClient = hc__RootWithType('/').api

type PetsClient = ReturnType<typeof hc<typeof pets>>

const hcPetsWithType = (...args: Parameters<typeof hc>): PetsClient => hc<typeof pets>(...args)

export const petsClient = hcPetsWithType('/').api
