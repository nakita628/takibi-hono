type DeepReadonly<T> = T extends (infer R)[]
  ? readonly DeepReadonly<R>[]
  : T extends object
    ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
    : T
type Tag = 'dog' | 'cat' | 'bird'
type Pet = { id: number; name: string; tag?: Tag | undefined }
type NewPet = { name: string; tag?: Tag | undefined }
type Error = { message: string }
declare const routes: import('@hono/zod-openapi').OpenAPIHono<
  import('hono/types').Env,
  DeepReadonly<
    {
      '/': { $get: { input: {}; output: { status: 'ok' }; outputFormat: 'json'; status: 200 } }
    } & {
      '/pets': {
        $get: {
          input: { query: { limit?: number | undefined; tag?: Tag | undefined } } & {
            header: { 'X-Request-Id'?: string | undefined }
          } & { cookie: { session?: string | undefined } }
          output: Pet[]
          outputFormat: 'json'
          status: 200
        }
        $post:
          | {
              input: { header: { 'X-Request-Id'?: string | undefined } } & { json: NewPet }
              output: Pet
              outputFormat: 'json'
              status: 201
            }
          | {
              input: { header: { 'X-Request-Id'?: string | undefined } } & { json: NewPet }
              output: {}
              outputFormat: string
              status: 400
            }
        $head: {
          input: { header: { 'X-Request-Id'?: string | undefined } }
          output: {}
          outputFormat: string
          status: 200
        }
      }
    } & {
      '/pets/:petId': {
        $get:
          | { input: { param: { petId: number } }; output: Pet; outputFormat: 'json'; status: 200 }
          | {
              input: { param: { petId: number } }
              output: Error
              outputFormat: 'json'
              status: 404
            }
        $delete: {
          input: { param: { petId: number } }
          output: {}
          outputFormat: string
          status: 204
        }
      }
    } & {
      '/pets/:petId/photos': {
        $post: {
          input: { param: { petId: number } } & {
            json: { caption: string; featured?: boolean | undefined }
          } & { form: { caption: string; featured?: boolean | undefined } }
          output: {}
          outputFormat: string
          status: 201
        }
      }
    } & {
      '/2024-01/reports': {
        $get: { input: {}; output: string[]; outputFormat: 'json'; status: 200 }
      }
    }
  >,
  '/'
>
export default routes
