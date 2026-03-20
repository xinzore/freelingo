import { Router, type IRouter } from "express";
import { db, userAchievementsTable, userProgressTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

export const ACHIEVEMENTS = [
  {
    id: "first_lesson",
    title: "İlk Adım",
    description: "İlk dersini tamamla",
    icon: "🎉",
    xpReward: 10,
    condition: "complete_1_lesson",
  },
  {
    id: "three_lessons",
    title: "Öğrenme Azmi",
    description: "3 ders tamamla",
    icon: "📚",
    xpReward: 20,
    condition: "complete_3_lessons",
  },
  {
    id: "five_lessons",
    title: "Bilgi Avcısı",
    description: "5 ders tamamla",
    icon: "🏆",
    xpReward: 30,
    condition: "complete_5_lessons",
  },
  {
    id: "all_lessons",
    title: "Dil Ustası",
    description: "Tüm dersleri tamamla",
    icon: "👑",
    xpReward: 100,
    condition: "complete_all_lessons",
  },
  {
    id: "streak_3",
    title: "Tutarlı Öğrenci",
    description: "3 günlük seri yap",
    icon: "🔥",
    xpReward: 15,
    condition: "streak_3_days",
  },
  {
    id: "streak_7",
    title: "Haftalık Şampiyon",
    description: "7 günlük seri yap",
    icon: "⚡",
    xpReward: 50,
    condition: "streak_7_days",
  },
  {
    id: "streak_30",
    title: "Aylık Kahraman",
    description: "30 günlük seri yap",
    icon: "💎",
    xpReward: 200,
    condition: "streak_30_days",
  },
  {
    id: "xp_100",
    title: "XP Avcısı",
    description: "100 XP kazan",
    icon: "⭐",
    xpReward: 10,
    condition: "earn_100_xp",
  },
  {
    id: "xp_500",
    title: "XP Ustası",
    description: "500 XP kazan",
    icon: "🌟",
    xpReward: 25,
    condition: "earn_500_xp",
  },
  {
    id: "perfect_lesson",
    title: "Mükemmeliyetçi",
    description: "Bir dersi hata yapmadan tamamla",
    icon: "💯",
    xpReward: 20,
    condition: "perfect_score",
  },
  {
    id: "level_5",
    title: "Seviye Atlayan",
    description: "5. seviyeye ulaş",
    icon: "🚀",
    xpReward: 30,
    condition: "reach_level_5",
  },
  {
    id: "daily_goal_3",
    title: "Hedef Avcısı",
    description: "Günlük hedefini 3 gün üst üste tamamla",
    icon: "🎯",
    xpReward: 25,
    condition: "daily_goal_3_days",
  },
];

export async function checkAndUnlockAchievements(
  userId: string,
  progress: {
    totalLessonsCompleted: number;
    streak: number;
    xp: number;
    level: number;
    lastScoreWasPerfect?: boolean;
  }
) {
  const existing = await db
    .select({ achievementId: userAchievementsTable.achievementId })
    .from(userAchievementsTable)
    .where(eq(userAchievementsTable.userId, userId));

  const unlockedIds = new Set(existing.map((r) => r.achievementId));
  const toUnlock: string[] = [];

  const checks: { id: string; condition: boolean }[] = [
    { id: "first_lesson", condition: progress.totalLessonsCompleted >= 1 },
    { id: "three_lessons", condition: progress.totalLessonsCompleted >= 3 },
    { id: "five_lessons", condition: progress.totalLessonsCompleted >= 5 },
    { id: "all_lessons", condition: progress.totalLessonsCompleted >= 8 },
    { id: "streak_3", condition: progress.streak >= 3 },
    { id: "streak_7", condition: progress.streak >= 7 },
    { id: "streak_30", condition: progress.streak >= 30 },
    { id: "xp_100", condition: progress.xp >= 100 },
    { id: "xp_500", condition: progress.xp >= 500 },
    { id: "perfect_lesson", condition: progress.lastScoreWasPerfect === true },
    { id: "level_5", condition: progress.level >= 5 },
  ];

  for (const check of checks) {
    if (check.condition && !unlockedIds.has(check.id)) {
      toUnlock.push(check.id);
    }
  }

  if (toUnlock.length > 0) {
    await db.insert(userAchievementsTable).values(
      toUnlock.map((achievementId) => ({ userId, achievementId }))
    );
  }

  return toUnlock;
}

router.get("/achievements", async (req, res) => {
  if (!req.isAuthenticated()) {
    const result = ACHIEVEMENTS.map((a) => ({ ...a, unlocked: false, unlockedAt: null }));
    res.json(result);
    return;
  }

  const userId = req.user.id;
  const unlocked = await db
    .select()
    .from(userAchievementsTable)
    .where(eq(userAchievementsTable.userId, userId));

  const unlockedMap = new Map(unlocked.map((r) => [r.achievementId, r.unlockedAt]));

  const result = ACHIEVEMENTS.map((a) => ({
    ...a,
    unlocked: unlockedMap.has(a.id),
    unlockedAt: unlockedMap.get(a.id)?.toISOString() ?? null,
  }));

  res.json(result);
});

export default router;
