// Each client of a split app is typed by the routes of its own group: `petsClient` knows the
// pets routes and no other group's, which is what keeps its type small.
import { __rootClient, _202401Client, petsClient } from './client'

export const pets = petsClient.pets.$get
export const reports = _202401Client['2024-01'].reports.$get
export const root = __rootClient.$get

// @ts-expect-error -- the reports routes belong to the `_202401` group
export const notInPets = petsClient['2024-01']

// @ts-expect-error -- the pets routes belong to the `pets` group
export const notInReports = _202401Client.pets
