import { pgTable, varchar, integer, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { usersTable } from "./auth";

export const userProgressTable = pgTable("user_progress", {
  id: varchar("id").primaryKey().default("gen_random_uuid()"),
  userId: varchar("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  xp: integer("xp").notNull().default(0),
  streak: integer("streak").notNull().default(1),
  level: integer("level").notNull().default(1),
  hearts: integer("hearts").notNull().default(5),
  totalLessonsCompleted: integer("total_lessons_completed").notNull().default(0),
  completedLessons: jsonb("completed_lessons").notNull().default([]),
  dailyGoalXp: integer("daily_goal_xp").notNull().default(20),
  dailyXpEarned: integer("daily_xp_earned").notNull().default(0),
  lastActivityDate: varchar("last_activity_date"),
  longestStreak: integer("longest_streak").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type UserProgress = typeof userProgressTable.$inferSelect;
export type InsertUserProgress = typeof userProgressTable.$inferInsert;

export const userAchievementsTable = pgTable("user_achievements", {
  id: varchar("id").primaryKey().default("gen_random_uuid()"),
  userId: varchar("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  achievementId: varchar("achievement_id").notNull(),
  unlockedAt: timestamp("unlocked_at", { withTimezone: true }).notNull().defaultNow(),
});

export type UserAchievement = typeof userAchievementsTable.$inferSelect;

export const wordNotebookTable = pgTable("word_notebook", {
  id: varchar("id").primaryKey().default("gen_random_uuid()"),
  userId: varchar("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  english: varchar("english").notNull(),
  turkish: varchar("turkish").notNull(),
  pronunciation: varchar("pronunciation"),
  example: varchar("example"),
  lessonId: integer("lesson_id"),
  addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
  reviewCount: integer("review_count").notNull().default(0),
  nextReviewAt: timestamp("next_review_at", { withTimezone: true }),
  known: boolean("known").notNull().default(false),
});

export type WordNotebookEntry = typeof wordNotebookTable.$inferSelect;
export type InsertWordNotebookEntry = typeof wordNotebookTable.$inferInsert;
