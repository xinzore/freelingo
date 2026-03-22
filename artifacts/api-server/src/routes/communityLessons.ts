import { Router, type IRouter } from "express";
import { and, desc, eq, sql } from "drizzle-orm";
import { communityLessonsTable, db, usersTable, type CommunityExercise, type CommunityExercisePair, type CommunityWord } from "@workspace/db";

const router: IRouter = Router();

const LESSON_DIFFICULTIES = new Set(["beginner", "intermediate", "advanced"]);
const EXERCISE_TYPES = new Set([
  "multiple-choice",
  "matching",
  "fill-blank",
  "speech-to-text",
  "translate-written",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getTrimmedString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function getOptionalString(value: unknown): string | null {
  if (value == null) return null;
  return getTrimmedString(value);
}

function parseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => getTrimmedString(item))
    .filter((item): item is string => Boolean(item));
}

function parseWords(value: unknown): CommunityWord[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item, index) => {
    if (!isRecord(item)) return [];

    return [
      {
        id: getTrimmedString(item.id) ?? `word-${index + 1}`,
        term: getOptionalString(item.term) ?? "",
        translation: getOptionalString(item.translation) ?? "",
        example: getOptionalString(item.example),
        note: getOptionalString(item.note),
      },
    ];
  });
}

function parsePairs(value: unknown): CommunityExercisePair[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item, index) => {
    if (!isRecord(item)) return [];

    return [
      {
        id: getTrimmedString(item.id) ?? `pair-${index + 1}`,
        left: getOptionalString(item.left) ?? "",
        right: getOptionalString(item.right) ?? "",
      },
    ];
  });
}

function validateExercise(exercise: CommunityExercise): string | null {
  const options = (exercise.options ?? []).map((option) => option.trim()).filter(Boolean);
  const correctAnswers = (exercise.correctAnswers ?? []).map((answer) => answer.trim()).filter(Boolean);
  const pairs = (exercise.pairs ?? []).filter((pair) => pair.left.trim() && pair.right.trim());

  if (!EXERCISE_TYPES.has(exercise.type)) {
    return "Desteklenmeyen alistirma tipi.";
  }

  if (!exercise.prompt.trim()) {
    return "Her alistirma icin bir baslik veya soru gerekir.";
  }

  if (exercise.type === "multiple-choice") {
    if (options.length < 2) {
      return "Coktan secmeli sorularda en az iki secenek olmali.";
    }
    if (correctAnswers.length !== 1) {
      return "Coktan secmeli sorularda tek dogru cevap secilmelidir.";
    }
  }

  if (exercise.type === "matching" && pairs.length < 2) {
    return "Eslesme alistirmalarinda en az iki cift gerekir.";
  }

  if (exercise.type !== "matching" && correctAnswers.length === 0) {
    return "Dogru cevap listesi bos birakilamaz.";
  }

  if (exercise.type === "speech-to-text" && !getTrimmedString(exercise.voiceText)) {
    return "Sesten yaziya alistirmalarinda okunacak metin zorunludur.";
  }

  if (exercise.type === "translate-written" && !getTrimmedString(exercise.sourceText)) {
    return "Yazili ceviri alistirmalarinda kaynak cumle zorunludur.";
  }

  return null;
}

function parseExercises(value: unknown): CommunityExercise[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item, index) => {
    if (!isRecord(item)) return [];

    const type = getTrimmedString(item.type);

    if (!type) return [];

    const exercise: CommunityExercise = {
      id: getTrimmedString(item.id) ?? `exercise-${index + 1}`,
      type: type as CommunityExercise["type"],
      prompt: getOptionalString(item.prompt) ?? "",
      instructions: getOptionalString(item.instructions),
      options: parseStringArray(item.options),
      correctAnswers: parseStringArray(item.correctAnswers),
      pairs: parsePairs(item.pairs),
      voiceText: getOptionalString(item.voiceText),
      sourceText: getOptionalString(item.sourceText),
      hint: getOptionalString(item.hint),
      explanation: getOptionalString(item.explanation),
    };

    return [exercise];
  });
}

function parseLessonPayload(body: unknown) {
  if (!isRecord(body)) {
    return { error: "Gecerli bir icerik gonderilmedi." };
  }

  const title = getTrimmedString(body.title);
  const description = getTrimmedString(body.description);
  const category = getTrimmedString(body.category);
  const difficulty = getTrimmedString(body.difficulty);
  const sourceLanguage = getTrimmedString(body.sourceLanguage) ?? "Turkish";
  const targetLanguage = getTrimmedString(body.targetLanguage) ?? "English";
  const icon = getTrimmedString(body.icon) ?? "🧩";
  const tags = parseStringArray(body.tags);
  const objectives = parseStringArray(body.objectives);
  const words = parseWords(body.words);
  const exercises = parseExercises(body.exercises);
  const estimatedMinutes =
    typeof body.estimatedMinutes === "number" && Number.isFinite(body.estimatedMinutes)
      ? Math.max(1, Math.min(90, Math.round(body.estimatedMinutes)))
      : 5;
  const isPublished = body.isPublished === true;

  if (!title || !description || !category || !difficulty) {
    return { error: "Baslik, aciklama, kategori ve zorluk zorunludur." };
  }

  if (!LESSON_DIFFICULTIES.has(difficulty)) {
    return { error: "Gecersiz zorluk seviyesi." };
  }

  if (isPublished && exercises.length === 0) {
    return { error: "Yayimlamak icin en az bir alistirma eklemelisin." };
  }

  const invalidExercise = exercises.find((exercise) => validateExercise(exercise));
  if (invalidExercise) {
    return { error: validateExercise(invalidExercise) ?? "Alistirma dogrulanamadi." };
  }

  return {
    data: {
      title,
      description,
      category,
      difficulty: difficulty as "beginner" | "intermediate" | "advanced",
      sourceLanguage,
      targetLanguage,
      icon,
      tags,
      objectives,
      words,
      exercises,
      estimatedMinutes,
      isPublished,
    },
  };
}

function getAuthorName(firstName: string | null, lastName: string | null, fallback: string | null) {
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
  return fullName || fallback || "Topluluk yazari";
}

function toLessonSummary(
  lesson: {
    id: string;
    authorUserId: string;
    title: string;
    description: string;
    category: string;
    difficulty: string;
    sourceLanguage: string;
    targetLanguage: string;
    icon: string;
    tags: string[];
    objectives: string[];
    words: CommunityWord[];
    exercises: CommunityExercise[];
    estimatedMinutes: number;
    playCount: number;
    isPublished: boolean;
    createdAt: Date;
    updatedAt: Date;
    authorFirstName: string | null;
    authorLastName: string | null;
    authorEmail: string | null;
  },
  currentUserId?: string,
) {
  return {
    id: lesson.id,
    title: lesson.title,
    description: lesson.description,
    category: lesson.category,
    difficulty: lesson.difficulty,
    sourceLanguage: lesson.sourceLanguage,
    targetLanguage: lesson.targetLanguage,
    icon: lesson.icon,
    tags: lesson.tags ?? [],
    objectives: lesson.objectives ?? [],
    estimatedMinutes: lesson.estimatedMinutes,
    playCount: lesson.playCount,
    isPublished: lesson.isPublished,
    wordCount: Array.isArray(lesson.words) ? lesson.words.length : 0,
    exerciseCount: Array.isArray(lesson.exercises) ? lesson.exercises.length : 0,
    createdAt: lesson.createdAt,
    updatedAt: lesson.updatedAt,
    isOwner: currentUserId === lesson.authorUserId,
    author: {
      id: lesson.authorUserId,
      name: getAuthorName(lesson.authorFirstName, lesson.authorLastName, lesson.authorEmail),
    },
  };
}

function toLessonDetail(
  lesson: {
    id: string;
    authorUserId: string;
    title: string;
    description: string;
    category: string;
    difficulty: string;
    sourceLanguage: string;
    targetLanguage: string;
    icon: string;
    tags: string[];
    objectives: string[];
    words: CommunityWord[];
    exercises: CommunityExercise[];
    estimatedMinutes: number;
    playCount: number;
    isPublished: boolean;
    createdAt: Date;
    updatedAt: Date;
    authorFirstName: string | null;
    authorLastName: string | null;
    authorEmail: string | null;
  },
  currentUserId?: string,
) {
  return {
    ...toLessonSummary(lesson, currentUserId),
    words: lesson.words ?? [],
    exercises: lesson.exercises ?? [],
  };
}

async function findLessonForRead(id: string) {
  const [lesson] = await db
    .select({
      id: communityLessonsTable.id,
      authorUserId: communityLessonsTable.authorUserId,
      title: communityLessonsTable.title,
      description: communityLessonsTable.description,
      category: communityLessonsTable.category,
      difficulty: communityLessonsTable.difficulty,
      sourceLanguage: communityLessonsTable.sourceLanguage,
      targetLanguage: communityLessonsTable.targetLanguage,
      icon: communityLessonsTable.icon,
      tags: communityLessonsTable.tags,
      objectives: communityLessonsTable.objectives,
      words: communityLessonsTable.words,
      exercises: communityLessonsTable.exercises,
      estimatedMinutes: communityLessonsTable.estimatedMinutes,
      playCount: communityLessonsTable.playCount,
      isPublished: communityLessonsTable.isPublished,
      createdAt: communityLessonsTable.createdAt,
      updatedAt: communityLessonsTable.updatedAt,
      authorFirstName: usersTable.firstName,
      authorLastName: usersTable.lastName,
      authorEmail: usersTable.email,
    })
    .from(communityLessonsTable)
    .innerJoin(usersTable, eq(communityLessonsTable.authorUserId, usersTable.id))
    .where(eq(communityLessonsTable.id, id));

  return lesson ?? null;
}

router.get("/community-lessons", async (req, res) => {
  const lessons = await db
    .select({
      id: communityLessonsTable.id,
      authorUserId: communityLessonsTable.authorUserId,
      title: communityLessonsTable.title,
      description: communityLessonsTable.description,
      category: communityLessonsTable.category,
      difficulty: communityLessonsTable.difficulty,
      sourceLanguage: communityLessonsTable.sourceLanguage,
      targetLanguage: communityLessonsTable.targetLanguage,
      icon: communityLessonsTable.icon,
      tags: communityLessonsTable.tags,
      objectives: communityLessonsTable.objectives,
      words: communityLessonsTable.words,
      exercises: communityLessonsTable.exercises,
      estimatedMinutes: communityLessonsTable.estimatedMinutes,
      playCount: communityLessonsTable.playCount,
      isPublished: communityLessonsTable.isPublished,
      createdAt: communityLessonsTable.createdAt,
      updatedAt: communityLessonsTable.updatedAt,
      authorFirstName: usersTable.firstName,
      authorLastName: usersTable.lastName,
      authorEmail: usersTable.email,
    })
    .from(communityLessonsTable)
    .innerJoin(usersTable, eq(communityLessonsTable.authorUserId, usersTable.id))
    .where(eq(communityLessonsTable.isPublished, true))
    .orderBy(desc(communityLessonsTable.updatedAt));

  res.json(lessons.map((lesson) => toLessonSummary(lesson, req.user?.id)));
});

router.get("/community-lessons/mine", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Icerik eklemek icin giris yapmalisin." });
    return;
  }

  const lessons = await db
    .select({
      id: communityLessonsTable.id,
      authorUserId: communityLessonsTable.authorUserId,
      title: communityLessonsTable.title,
      description: communityLessonsTable.description,
      category: communityLessonsTable.category,
      difficulty: communityLessonsTable.difficulty,
      sourceLanguage: communityLessonsTable.sourceLanguage,
      targetLanguage: communityLessonsTable.targetLanguage,
      icon: communityLessonsTable.icon,
      tags: communityLessonsTable.tags,
      objectives: communityLessonsTable.objectives,
      words: communityLessonsTable.words,
      exercises: communityLessonsTable.exercises,
      estimatedMinutes: communityLessonsTable.estimatedMinutes,
      playCount: communityLessonsTable.playCount,
      isPublished: communityLessonsTable.isPublished,
      createdAt: communityLessonsTable.createdAt,
      updatedAt: communityLessonsTable.updatedAt,
      authorFirstName: usersTable.firstName,
      authorLastName: usersTable.lastName,
      authorEmail: usersTable.email,
    })
    .from(communityLessonsTable)
    .innerJoin(usersTable, eq(communityLessonsTable.authorUserId, usersTable.id))
    .where(eq(communityLessonsTable.authorUserId, req.user.id))
    .orderBy(desc(communityLessonsTable.updatedAt));

  res.json(lessons.map((lesson) => toLessonSummary(lesson, req.user.id)));
});

router.get("/community-lessons/:id", async (req, res) => {
  const lesson = await findLessonForRead(req.params.id);

  if (!lesson) {
    res.status(404).json({ error: "Icerik bulunamadi." });
    return;
  }

  const isOwner = req.user?.id === lesson.authorUserId;
  if (!lesson.isPublished && !isOwner) {
    res.status(404).json({ error: "Bu taslak icerige erisemezsin." });
    return;
  }

  if (lesson.isPublished) {
    await db
      .update(communityLessonsTable)
      .set({ playCount: sql`${communityLessonsTable.playCount} + 1` })
      .where(eq(communityLessonsTable.id, lesson.id));
  }

  const refreshed = await findLessonForRead(req.params.id);
  res.json(toLessonDetail(refreshed ?? lesson, req.user?.id));
});

router.post("/community-lessons", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Icerik eklemek icin giris yapmalisin." });
    return;
  }

  const parsed = parseLessonPayload(req.body);
  if ("error" in parsed) {
    res.status(400).json({ error: parsed.error });
    return;
  }

  const [created] = await db
    .insert(communityLessonsTable)
    .values({
      authorUserId: req.user.id,
      ...parsed.data,
    })
    .returning({ id: communityLessonsTable.id });

  const lesson = await findLessonForRead(created.id);
  res.status(201).json(toLessonDetail(lesson!, req.user.id));
});

router.put("/community-lessons/:id", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Icerik duzenlemek icin giris yapmalisin." });
    return;
  }

  const [existing] = await db
    .select({ id: communityLessonsTable.id, authorUserId: communityLessonsTable.authorUserId })
    .from(communityLessonsTable)
    .where(eq(communityLessonsTable.id, req.params.id));

  if (!existing) {
    res.status(404).json({ error: "Icerik bulunamadi." });
    return;
  }

  if (existing.authorUserId !== req.user.id) {
    res.status(403).json({ error: "Sadece kendi icerigini duzenleyebilirsin." });
    return;
  }

  const parsed = parseLessonPayload(req.body);
  if ("error" in parsed) {
    res.status(400).json({ error: parsed.error });
    return;
  }

  await db
    .update(communityLessonsTable)
    .set(parsed.data)
    .where(and(eq(communityLessonsTable.id, req.params.id), eq(communityLessonsTable.authorUserId, req.user.id)));

  const lesson = await findLessonForRead(req.params.id);
  res.json(toLessonDetail(lesson!, req.user.id));
});

export default router;
