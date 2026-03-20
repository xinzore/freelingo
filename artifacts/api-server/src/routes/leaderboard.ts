import { Router, type IRouter } from "express";
import { db, userProgressTable, usersTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/leaderboard", async (req, res) => {
  const currentUserId = req.isAuthenticated() ? req.user.id : null;

  const rows = await db
    .select({
      userId: userProgressTable.userId,
      xp: userProgressTable.xp,
      level: userProgressTable.level,
      streak: userProgressTable.streak,
      firstName: usersTable.firstName,
      lastName: usersTable.lastName,
      profileImageUrl: usersTable.profileImageUrl,
    })
    .from(userProgressTable)
    .innerJoin(usersTable, eq(userProgressTable.userId, usersTable.id))
    .orderBy(desc(userProgressTable.xp))
    .limit(20);

  const result = rows.map((row, index) => {
    const displayName =
      [row.firstName, row.lastName].filter(Boolean).join(" ") ||
      `Kullanıcı ${row.userId.slice(0, 6)}`;

    return {
      rank: index + 1,
      userId: row.userId,
      displayName,
      xp: row.xp,
      level: row.level,
      streak: row.streak,
      profileImageUrl: row.profileImageUrl ?? null,
      isCurrentUser: row.userId === currentUserId,
    };
  });

  res.json(result);
});

export default router;
