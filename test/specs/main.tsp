import "@typespec/http";

using Http;

@service(#{ title: "Takibi Hono API" })
namespace TakibiHonoAPI;

model Todo {
  id: int32;
  title: string;
  done: boolean;
}

@route("/hono")
interface Hono {
  @summary("Welcome")
  @doc("Returns a welcome message from Takibi Hono.")
  @get welcome(): {
    message: string;
  };
}

@route("/todos")
interface Todos {
  @get list(@query done?: boolean): Todo[];
  @post create(@body todo: Todo): Todo;
  @get read(@path id: int32): Todo;
}
