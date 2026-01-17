import { getCookie } from "hono/cookie";
import jwt from "jsonwebtoken";
import { db } from "../db/index.js";
import { todos } from "../db/schema.js";

export function addTodosRoute(app) {
    app.post("/api/todos", async (c) => {
      const token = getCookie(c, "token");
      if (!token)
        return c.json({ success: false, message: "tidak di kenali" }, 401);
      try {
        const user = jwt.verify(token, process.env.JWT_SECRET);
        const { note } = await c.req.json();
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
}