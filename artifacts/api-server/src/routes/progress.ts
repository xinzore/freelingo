import { Router, type IRouter } from "express";
import { db, userProgressTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { checkAndUnlockAchievements } from "./achievements";

const router: IRouter = Router();

const guestProgress = {
  xp: 0,
  streak: 1,
  level: 1,
  completedLessons: [] as number[],
  hearts: 5,
  totalLessonsCompleted: 0,
  dailyGoalXp: 20,
  dailyXpEarned: 0,
  longestStreak: 1,
};

function calculateLevel(xp: number): number {
  if (xp < 50) return 1;
  if (xp < 150) return 2;
  if (xp < 300) return 3;
  if (xp < 500) return 4;
  if (xp < 750) return 5;
  return Math.floor(xp / 150) + 1;
}

function getTodayStr() {
  return new Date().toISOString().split("T")[0];
}

async function getOrCreateProgress(userId: string) {
  const [existing] = await db
    .select()
    .from(userProgressTable)
    .where(eq(userProgressTable.userId, userId));

  if (existing) {
    const today = getTodayStr();
    if (existing.lastActivityDate !== today) {
      const updatedStreak =
        existing.lastActivityDate === getPreviousDayStr()
          ? existing.streak
          : 1;
      const [updated] = await db
        .update(userProgressTable)
        .set({ dailyXpEarned: 0, streak: updatedStreak })
        .where(eq(userProgressTable.userId, userId))
        .returning();
      return updated;
    }
    return existing;
  }

  const [created] = await db
    .insert(userProgressTable)
    .values({ userId })
    .returning();
  return created;
}

function getPreviousDayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

function formatProgress(p: typeof userProgressTable.$inferSelect) {
  return {
    xp: p.xp,
    streak: p.streak,
    level: calculateLevel(p.xp),
    completedLessons: (p.completedLessons as number[]) || [],
    hearts: p.hearts,
    totalLessonsCompleted: p.totalLessonsCompleted,
    dailyGoalXp: p.dailyGoalXp,
    dailyXpEarned: p.dailyXpEarned,
    longestStreak: p.longestStreak,
  };
}

router.get("/progress", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.json({ ...guestProgress, level: calculateLevel(guestProgress.xp) });
    return;
  }

  const progress = await getOrCreateProgress(req.user.id);
  res.json(formatProgress(progress));
});

router.post("/progress/complete-lesson", async (req, res) => {
  const { lessonId, score } = req.body as { lessonId: number; score: number };

  if (!lessonId || score === undefined) {
    res.status(400).json({ error: "lessonId ve score gereklidir" });
    return;
  }

  const xpEarned = Math.round((score / 100) * 15);
  const today = getTodayStr();

  if (!req.isAuthenticated()) {
    if (!guestProgress.completedLessons.includes(lessonId)) {
      guestProgress.completedLessons.push(lessonId);
      guestProgress.totalLessonsCompleted += 1;
    }
    guestProgress.xp += xpEarned;
    guestProgress.dailyXpEarned += xpEarned;
    guestProgress.level = calculateLevel(guestProgress.xp);
    res.json({ ...guestProgress, level: calculateLevel(guestProgress.xp) });
    return;
  }

  const progress = await getOrCreateProgress(req.user.id);
  const completedLessons = (progress.completedLessons as number[]) || [];
  const isNewLesson = !completedLessons.includes(lessonId);
  const isPerfect = score === 100;

  if (isNewLesson) {
    completedLessons.push(lessonId);
  }

  const newXp = progress.xp + xpEarned;
  const newDailyXp = progress.dailyXpEarned + xpEarned;
  const newTotal = isNewLesson ? progress.totalLessonsCompleted + 1 : progress.totalLessonsCompleted;
  const newStreak = progress.lastActivityDate === today ? progress.streak : progress.streak + 1;
  const newLongestStreak = Math.max(newStreak, progress.longestStreak);

  const [updated] = await db
    .update(userProgressTable)
    .set({
      xp: newXp,
      completedLessons,
      totalLessonsCompleted: newTotal,
      dailyXpEarned: newDailyXp,
      streak: newStreak,
      longestStreak: newLongestStreak,
      lastActivityDate: today,
      level: calculateLevel(newXp),
    })
    .where(eq(userProgressTable.userId, req.user.id))
    .returning();

  await checkAndUnlockAchievements(req.user.id, {
    totalLessonsCompleted: newTotal,
    streak: newStreak,
    xp: newXp,
    level: calculateLevel(newXp),
    lastScoreWasPerfect: isPerfect,
  });

  res.json(formatProgress(updated));
});

router.post("/progress/set-daily-goal", async (req, res) => {
  const { goalXp } = req.body as { goalXp: number };

  if (!goalXp || goalXp < 5) {
    res.status(400).json({ error: "Geçersiz hedef" });
    return;
  }

  if (!req.isAuthenticated()) {
    guestProgress.dailyGoalXp = goalXp;
    res.json({ ...guestProgress, level: calculateLevel(guestProgress.xp) });
    return;
  }

  const progress = await getOrCreateProgress(req.user.id);
  const [updated] = await db
    .update(userProgressTable)
    .set({ dailyGoalXp: goalXp })
    .where(eq(userProgressTable.userId, req.user.id))
    .returning();

  res.json(formatProgress(updated));
});

router.post("/progress/reset", async (req, res) => {
  if (!req.isAuthenticated()) {
    guestProgress.xp = 0;
    guestProgress.streak = 1;
    guestProgress.level = 1;
    guestProgress.completedLessons = [];
    guestProgress.hearts = 5;
    guestProgress.totalLessonsCompleted = 0;
    guestProgress.dailyGoalXp = 20;
    guestProgress.dailyXpEarned = 0;
    res.json({ success: true, message: "İlerleme sıfırlandı" });
    return;
  }

  await db
    .update(userProgressTable)
    .set({
      xp: 0,
      streak: 1,
      level: 1,
      completedLessons: [],
      hearts: 5,
      totalLessonsCompleted: 0,
      dailyGoalXp: 20,
      dailyXpEarned: 0,
      longestStreak: 0,
      lastActivityDate: null,
    })
    .where(eq(userProgressTable.userId, req.user.id));

  res.json({ success: true, message: "İlerleme sıfırlandı" });
});

export default router;
