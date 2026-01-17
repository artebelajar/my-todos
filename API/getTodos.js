import { getCookie } from "hono/cookie";
import jwt from "jsonwebtoken";
import { db } from "../db/index.js";
import { todos } from "../db/schema.js";


export function getTodosRoute(app) {
  app.get("/api/todos", async (c) => {
    const token = getCookie(c, "token");
    if (!token)
      return c.json({ success: false, message: "tidak di kenali" }, 401);
    // console.log("Token:", token);
    try {
      const user = jwt.verify(token, process.env.JWT_SECRET);
      // console.log("User from token:", user);
      const userTodos = await db.query.todos.findMany({
        where: (todos, { eq }) => eq(todos.userId, Number(user.id)),
      });
      return c.json({ success: true, data: userTodos });
    } catch (error) {
      return c.json({ success: false, message: "Unauthorized" }, 401);
    }
  });
}
