import { db } from "../db/index.js";
import { todos } from "../db/schema.js";
import { eq } from "drizzle-orm";

export function deleteTodosRoute(app) {
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
      return c.json({ success: false, message: `Gagal menghapus todo ${todoId}, ${todos.id}, ${todos.userId}, ${user}: ${error.message}` }, 500);
    }
  });
}
