import "@typespec/http";

using Http;
@service(#{ title: "Hono Service" })
namespace HonoService;

@example(#{
  hono: "Hono"
})
model Test {
  hono: "Hono" | "HonoX" | "ZodOpenAPIHOno";
}

@route("/hono")
@tag("Hono")
interface Hono {
  @get list(): {
    hono: "Hono" | "HonoX" | "ZodOpenAPIHono";
  }[] | {
    code: int32;
    message: string;
  };
}
