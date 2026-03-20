import { Router, type IRouter } from "express";

const router: IRouter = Router();

let userProgress = {
  xp: 0,
  streak: 1,
  level: 1,
  completedLessons: [] as number[],
  hearts: 5,
  totalLessonsCompleted: 0,
};

function calculateLevel(xp: number): number {
  if (xp < 50) return 1;
  if (xp < 150) return 2;
  if (xp < 300) return 3;
  if (xp < 500) return 4;
  if (xp < 750) return 5;
  return Math.floor(xp / 150) + 1;
}

router.get("/progress", (_req, res) => {
  res.json({
    ...userProgress,
    level: calculateLevel(userProgress.xp),
  });
});

router.post("/progress/complete-lesson", (req, res) => {
  const { lessonId, score } = req.body as { lessonId: number; score: number };

  if (!lessonId || score === undefined) {
    res.status(400).json({ error: "lessonId ve score gereklidir" });
    return;
  }

  const xpEarned = Math.round((score / 100) * 15);

  if (!userProgress.completedLessons.includes(lessonId)) {
    userProgress.completedLessons.push(lessonId);
    userProgress.totalLessonsCompleted += 1;
  }

  userProgress.xp += xpEarned;
  userProgress.level = calculateLevel(userProgress.xp);

  res.json({
    ...userProgress,
    level: calculateLevel(userProgress.xp),
  });
});

router.post("/progress/reset", (_req, res) => {
  userProgress = {
    xp: 0,
    streak: 1,
    level: 1,
    completedLessons: [],
    hearts: 5,
    totalLessonsCompleted: 0,
  };
  res.json({ success: true, message: "İlerleme sıfırlandı" });
});

export default router;
