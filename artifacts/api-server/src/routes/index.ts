import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import lessonsRouter from "./lessons";
import progressRouter from "./progress";
import achievementsRouter from "./achievements";
import notebookRouter from "./notebook";
import leaderboardRouter from "./leaderboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(lessonsRouter);
router.use(progressRouter);
router.use(achievementsRouter);
router.use(notebookRouter);
router.use(leaderboardRouter);

export default router;
