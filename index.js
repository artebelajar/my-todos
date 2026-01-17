import { serveStatic } from "@hono/node-server/serve-static";
import "dotenv/config";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { db } from "./db/index.js";
import { users, todos } from "./db/schema.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { setCookie, getCookie } from "hono/cookie";
import { and, eq } from "drizzle-orm";
import "./API/register.js";
import { registerRoute } from "./API/register.js";
import { loginRoute } from "./API/login.js";
import { checkAuth } from "./API/index.js";
import { logoutRoute } from "./API/logout.js";
import { addTodosRoute } from "./API/addTodos.js";
import { getTodosRoute } from "./API/getTodos.js";
import { putTodosRoute } from "./API/putTodos.js";
import { deleteTodosRoute } from "./API/deleteTodos.js";

const app = new Hono();

app.use("/*", serveStatic({ root: "./public" }));

// app.get("/", (c) => {
//   return c.html("<h1>Tim Pengembang</h1><h2>Nama Kalian</h2>");
// });

registerRoute(app);
loginRoute(app);
checkAuth(app);
logoutRoute(app);
app.use("/api/*", async (c, next) => {
  const token = getCookie(c, "token");
  if (!token) return c.json({ success: false, message: "Unauthorized" }, 401);
  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    c.set("user", user);
    await next();
  } catch {
    return c.json({ success: false, message: "Unauthorized" }, 401);
  }
});
addTodosRoute(app);
getTodosRoute(app);
putTodosRoute(app);
deleteTodosRoute(app);

const port = 6969;
console.log(`🚀 Server is running on http://localhost:${port}`);
serve({ fetch: app.fetch, port });

export default app;
