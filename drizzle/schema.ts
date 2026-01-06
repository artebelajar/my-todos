import { pgTable, smallint, varchar, date, unique, serial, foreignKey, text, integer } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const siswa = pgTable("siswa", {
	nis: smallint().primaryKey().generatedByDefaultAsIdentity({ name: "siswa_nis_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 32767, cache: 1 }),
	nama: varchar().notNull(),
	tempatLahir: varchar("tempat_lahir"),
	tanggalLahir: date("tanggal_lahir"),
	alamat: varchar(),
});

export const users = pgTable("users", {
	id: serial().primaryKey().notNull(),
	username: varchar({ length: 256 }).notNull(),
	password: varchar({ length: 256 }).notNull(),
}, (table) => [
	unique("users_username_unique").on(table.username),
]);

export const todos = pgTable("todos", {
	id: serial().primaryKey().notNull(),
	note: text().notNull(),
	userId: integer().notNull(),
	status: text().default('pending').notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "todos_user_id_users_id_fk"
		}),
]);
