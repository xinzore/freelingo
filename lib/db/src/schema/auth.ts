import { sql } from "drizzle-orm";
import { boolean, index, jsonb, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

// Session records for authenticated users.
export const sessionsTable = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Application user records.
export const usersTable = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type UpsertUser = typeof usersTable.$inferInsert;
export type User = typeof usersTable.$inferSelect;

export const emailAuthTable = pgTable("email_auth", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique().references(() => usersTable.id, { onDelete: "cascade" }),
  passwordHash: varchar("password_hash").notNull(),
  isVerified: boolean("is_verified").notNull().default(false),
  verificationToken: varchar("verification_token"),
  verificationTokenExpires: timestamp("verification_token_expires", { withTimezone: true }),
  resetToken: varchar("reset_token"),
  resetTokenExpires: timestamp("reset_token_expires", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type EmailAuth = typeof emailAuthTable.$inferSelect;
export type InsertEmailAuth = typeof emailAuthTable.$inferInsert;
