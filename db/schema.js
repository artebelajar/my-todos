import {
  pgTable,
  unique,
  serial,
  varchar,
  foreignKey,
  text,
  integer,
  smallint,
  date
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const users = pgTable(
  "users",
  {
    id: serial().primaryKey().notNull(),
    username: varchar({ length: 256 }).notNull(),
    password: varchar({ length: 256 }).notNull(),
  },
  (table) => [unique("users_username_unique").on(table.username)]
);

export const todos = pgTable(
  "todos",
  {
    id: serial().primaryKey().notNull(),
    note: text().notNull(),
    userId: integer().notNull(),
    status: text().notNull().default("pending")
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "todos_user_id_users_id_fk",
    }),
  ]
);
