# Define Handler, one file

An API whose definitions takibi-hono's one-shot mode writes, `takibi-hono openapi.yaml -o src/routes.ts`: no config file, one generated file, and an app written by hand against it.

## What the one-shot mode writes

[`src/routes.ts`](./src/routes.ts) holds everything the generator takes from [`openapi.yaml`](./openapi.yaml), as hono-takibi's `-o` writes the route definitions its handlers import:

- The `components.schemas`, as zod schemas with their types (`UserSchema`, `User`).
- One [`defineHandler`](https://hono.dev/docs/helpers/factory#definehandler) definition per operation, named by its method and path: `export const getUsersUserIdHandler = defineHandler({ param, response })`. Its options validate the request targets the operation declares (`param`, `query`, `json`) and, under `response`, the JSON of its success response. It is the function that takes the handler.

Nothing in the file is yours, so `pnpm generate` writes it over.

## What you write

[`src/index.ts`](./src/index.ts) is the app: a Hono under `/api` that calls each definition with its handler, `getUsersHandler(async (c, { query }) => ...)`, with the data in [`src/store.ts`](./src/store.ts). The handler gets the validated values as its second argument and returns the value; the status is set with `c.status(201)`, and a miss is thrown as an `HTTPException` with the response to send. Middleware goes before the handler: `getUsersHandler(auth, async (c, { query }) => ...)`.

The one-shot mode is `defineHandler: { output: 'src/routes.ts' }` without a config file. Add `template: true` in a config and takibi-hono writes the handler files and the app around the same file: that is [`define-handler-split`](../define-handler-split).

## Try it

```bash
pnpm generate  # write src/routes.ts again from openapi.yaml
pnpm dev       # serve the app at http://localhost:5173/api
pnpm check     # type-check
pnpm test      # request every operation through the app
```

```bash
curl http://localhost:5173/api/health
curl http://localhost:5173/api/users/1
curl http://localhost:5173/api/users/0   # 400 from defineHandler, with the issues
```
