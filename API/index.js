import jwt from "jsonwebtoken";
import { getCookie } from "hono/cookie";

export function checkAuth(app) {
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
}