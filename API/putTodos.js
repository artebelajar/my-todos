import { and, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { todos } from "../db/schema.js";

export function putTodosRoute(app) {
  app.put("/api/todos/:id/status", async (c) => {
    try {
      const user = c.get("user");
      const id = Number(c.req.param("id"));
      const { status } = await c.req.json();

      const updatedTodo = await db
        .update(todos)
        .set({ status })
        .where(
          and(
            eq(todos.id, id),
            eq(todos.userId, Number(user.id))
          )
        )
        .returning();

      if (updatedTodo.length === 0) {
        return c.json(
          {
            success: false,
            message:
              "Todo tidak ditemukan atau tidak memiliki akses",
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
    } catch (error) {
      console.error("PUT /todos/:id/status error:", error);
      return c.json(
        {
          success: false,
          message:
            "Terjadi kesalahan saat mengubah status",
        },
        500
      );
    }
  });
}
