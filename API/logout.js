import { setCookie } from "hono/cookie";

export function logoutRoute(app) {
  app.post("/api/logout", (c) => {
    setCookie(c, "token", "", { maxAge: -1 });
    return c.json({ success: true, message: "Logout berhasil" });
  });
}
