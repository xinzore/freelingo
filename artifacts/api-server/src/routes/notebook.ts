import { Router, type IRouter } from "express";
import { db, wordNotebookTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router: IRouter = Router();

const guestNotebook: Map<string, object[]> = new Map();

router.get("/notebook", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.json([]);
    return;
  }

  const words = await db
    .select()
    .from(wordNotebookTable)
    .where(eq(wordNotebookTable.userId, req.user.id))
    .orderBy(wordNotebookTable.addedAt);

  res.json(
    words.map((w) => ({
      id: w.id,
      english: w.english,
      turkish: w.turkish,
      pronunciation: w.pronunciation,
      example: w.example,
      lessonId: w.lessonId,
      addedAt: w.addedAt.toISOString(),
      reviewCount: w.reviewCount,
      known: w.known,
    }))
  );
});

router.post("/notebook", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Giriş yapmalısınız" });
    return;
  }

  const { english, turkish, pronunciation, example, lessonId } = req.body as {
    english: string;
    turkish: string;
    pronunciation?: string;
    example?: string;
    lessonId?: number;
  };

  if (!english || !turkish) {
    res.status(400).json({ error: "Kelime ve çeviri gereklidir" });
    return;
  }

  const [word] = await db
    .insert(wordNotebookTable)
    .values({
      userId: req.user.id,
      english,
      turkish,
      pronunciation: pronunciation ?? null,
      example: example ?? null,
      lessonId: lessonId ?? null,
    })
    .returning();

  res.json({
    id: word.id,
    english: word.english,
    turkish: word.turkish,
    pronunciation: word.pronunciation,
    example: word.example,
    lessonId: word.lessonId,
    addedAt: word.addedAt.toISOString(),
    reviewCount: word.reviewCount,
    known: word.known,
  });
});

router.delete("/notebook/:id", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Giriş yapmalısınız" });
    return;
  }

  await db
    .delete(wordNotebookTable)
    .where(
      and(
        eq(wordNotebookTable.id, req.params.id),
        eq(wordNotebookTable.userId, req.user.id)
      )
    );

  res.json({ success: true, message: "Kelime silindi" });
});

export default router;
