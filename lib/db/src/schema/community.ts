import { sql } from "drizzle-orm";
import { boolean, integer, jsonb, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { usersTable } from "./auth";

export type CommunityLessonDifficulty = "beginner" | "intermediate" | "advanced";
export type CommunityExerciseType =
  | "multiple-choice"
  | "matching"
  | "fill-blank"
  | "speech-to-text"
  | "translate-written";

export interface CommunityWord {
  id: string;
  term: string;
  translation: string;
  example?: string | null;
  note?: string | null;
}

export interface CommunityExercisePair {
  id: string;
  left: string;
  right: string;
}

export interface CommunityExercise {
  id: string;
  type: CommunityExerciseType;
  prompt: string;
  instructions?: string | null;
  options?: string[];
  correctAnswers?: string[];
  pairs?: CommunityExercisePair[];
  voiceText?: string | null;
  sourceText?: string | null;
  hint?: string | null;
  explanation?: string | null;
}

export const communityLessonsTable = pgTable("community_lessons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  authorUserId: varchar("author_user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  title: varchar("title").notNull(),
  description: varchar("description").notNull(),
  category: varchar("category").notNull(),
  difficulty: varchar("difficulty").notNull().$type<CommunityLessonDifficulty>(),
  sourceLanguage: varchar("source_language").notNull().default("Turkish"),
  targetLanguage: varchar("target_language").notNull().default("English"),
  icon: varchar("icon").notNull().default("🧩"),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  objectives: jsonb("objectives").$type<string[]>().notNull().default([]),
  words: jsonb("words").$type<CommunityWord[]>().notNull().default([]),
  exercises: jsonb("exercises").$type<CommunityExercise[]>().notNull().default([]),
  estimatedMinutes: integer("estimated_minutes").notNull().default(5),
  playCount: integer("play_count").notNull().default(0),
  isPublished: boolean("is_published").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type CommunityLesson = typeof communityLessonsTable.$inferSelect;
export type InsertCommunityLesson = typeof communityLessonsTable.$inferInsert;
