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

const app = new Hono();

app.use("/*", serveStatic({ root: "./public" }));

// app.get("/", (c) => {
//   return c.html("<h1>Tim Pengembang</h1><h2>Nama Kalian</h2>");
// });

app.post("/api/register", async (c) => {
  try {
    const { username, password } = await c.req.json();
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await db
      .insert(users)
      .values({ username, password: hashedPassword })
      .returning({ id: users.id, username: users.username });

    return c.json({ success: true, data: newUser[0] }, 201);
  } catch (error) {
    return c.json({ success: false, message: "Registrasi gagal" }, 400);
  }
});

app.post("/api/login", async (c) => {
  const { username, password } = await c.req.json();
  const user = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.username, username),
  });

  if (!user)
    return c.json(
      { success: false, message: "Username atau password salah" },
      401
    );

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid)
    return c.json(
      { success: false, message: "Username atau password salah" },
      401
    );

  const token = jwt.sign(
    { id: user.id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  setCookie(c, "token", token, {
    httpOnly: true,
    sameSite: "Lax",
    maxAge: 3600,
  });

  return c.json({ success: true, message: "Login berhasil" });
});

app.get("/api/me", (c) => {
  const token = getCookie(c, "token");
  if (!token) return c.json({ success: false, message: "Unauthorized" }, 401);
  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);

    return c.json({ success: true, data: user });
  } catch (error) {
    return c.json({ success: false, message: "Unauthorized" }, 401);
  }
});

app.post("/api/logout", (c) => {
  setCookie(c, "token", "", { maxAge: -1 });
  return c.json({ success: true, message: "Logout berhasil" });
});

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

app.post("/api/todos", async (c) => {
  const token = getCookie(c, "token");
  if (!token)
    return c.json({ success: false, message: "tidak di kenali" }, 401);
  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    const { note } = await c.req.json();
    // console.log("User from token and note:", user, note);
    const newTodo = await db
      .insert(todos)
      .values({ note, userId: Number(user.id) })
      .returning();
    return c.json({ success: true, data: newTodo[0] }, 201);
  } catch (error) {
    console.error("Error creating todo:", error);
    return c.json({ success: false, message: "server error" }, 500);
  }
});

app.get("/api/todos", async (c) => {
  const token = getCookie(c, "token");
  if (!token)
    return c.json({ success: false, message: "tidak di kenali" }, 401);
  // console.log("Token:", token);
  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    // console.log("User from token:", user);
    const userTodos = await db.query.todos.findMany({
      where: (todos, {eq} ) => eq(todos.userId, Number(user.id)),
    });
    return c.json({ success: true, data: userTodos });
  } catch (error) {
    return c.json({ success: false, message: "Unauthorized" }, 401);
  }
});

app.put("/api/todos/:id/status", async (c) => {
  const user = c.get("user");
  const id = parseInt(c.req.param("id"));
  const { status } = await c.req.json();

  const updatedTodo = await db
    .update(todos)
    .set({ status })
    .where(and(eq(todos.id, id), eq(todos.userId, Number(user.id))))
    .returning();

  console.log(updatedTodo);

  if (updatedTodo.length === 0) {
    return c.json(
      {
        success: false,
        message: "Todo tidak ditemukan atau tidak memiliki akses",
      },
      404
    );
  }

  return c.json(
    {
      success: true,
      message: "Todo berhasil diperbarui",
      data: updatedTodo[0],
    },
    200
  );
});

app.delete("/api/todos/:id", async (c) => {
  const user = c.get("user");
  const todoId = Number(c.req.param("id"));

  try {
    const deletedTodo = await db
      .delete(todos)
      .where(eq(todos.id, todoId), eq(todos.userId, user.id))
      .returning();

    if (deletedTodo.length === 0) {
      return c.json(
        {
          success: false,
          message: "Todo tidak ditemukan atau tidak memiliki akses",
        },
        404
      );
    }

    return c.json({ success: true, message: "Todo berhasil dihapus" }, 200);
  } catch (error) {
    console.error("Error deleting todo:", error);
    return c.json({ success: false, message: "Gagal menghapus todo" }, 500);
  }
});

const port = 6969;
console.log(`🚀 Server is running on http://localhost:${port}`);
serve({ fetch: app.fetch, port });
