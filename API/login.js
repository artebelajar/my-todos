import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { setCookie } from "hono/cookie";
import { and, eq } from "drizzle-orm";

export function loginRoute(app) {
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
}
