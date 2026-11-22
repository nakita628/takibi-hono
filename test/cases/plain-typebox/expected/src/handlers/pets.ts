import { Hono } from 'hono'
import { tbValidator } from '@hono/typebox-validator'
import { Type, Codec } from 'typebox'
import { TagSchema, NewPetSchema } from '../components'

export const petsHandler = new Hono()
  .get(
    '/pets',
    tbValidator(
      'query',
      Type.Object({
        limit: Type.Optional(
          Codec(Type.String({ pattern: /^-?(?:0|[1-9]\d*)$/ }))
            .Decode((value) => Number(value))
            .Encode((value) => String(value)),
        ),
        tag: Type.Optional(TagSchema),
      }),
    ),
    tbValidator('header', Type.Object({ 'x-request-id': Type.Optional(Type.String()) })),
    tbValidator('cookie', Type.Object({ session: Type.Optional(Type.String()) })),
    (c) => {},
  )
  .post(
    '/pets',
    tbValidator('header', Type.Object({ 'x-request-id': Type.Optional(Type.String()) })),
    tbValidator('json', NewPetSchema),
    (c) => {},
  )
  .on(
    'HEAD',
    '/pets',
    tbValidator('header', Type.Object({ 'x-request-id': Type.Optional(Type.String()) })),
    (c) => {},
  )
  .get(
    '/pets/:petId',
    tbValidator(
      'param',
      Type.Object({
        petId: Codec(Type.String({ pattern: /^-?(?:0|[1-9]\d*)$/ }))
          .Decode((value) => Number(value))
          .Encode((value) => String(value)),
      }),
    ),
    (c) => {},
  )
  .delete(
    '/pets/:petId',
    tbValidator(
      'param',
      Type.Object({
        petId: Codec(Type.String({ pattern: /^-?(?:0|[1-9]\d*)$/ }))
          .Decode((value) => Number(value))
          .Encode((value) => String(value)),
      }),
    ),
    (c) => {},
  )
  .post(
    '/pets/:petId/photos',
    tbValidator(
      'param',
      Type.Object({
        petId: Codec(Type.String({ pattern: /^-?(?:0|[1-9]\d*)$/ }))
          .Decode((value) => Number(value))
          .Encode((value) => String(value)),
      }),
    ),
    tbValidator(
      'form',
      Type.Object({
        caption: Type.String({ minLength: 1 }),
        featured: Type.Optional(
          Codec(
            Type.String({ pattern: /^(?:true|1|yes|on|y|enabled|false|0|no|off|n|disabled)$/i }),
          )
            .Decode((value) => /^(?:true|1|yes|on|y|enabled)$/i.test(value))
            .Encode((value) => (value ? 'true' : 'false')),
        ),
      }),
    ),
    (c) => {},
  )
