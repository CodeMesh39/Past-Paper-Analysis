import { Router, type IRouter } from "express";
import healthRouter from "./health";
import papersRouter from "./papers";
import syllabiRouter from "./syllabi";
import analysesRouter from "./analyses";
import topicsRouter from "./topics";
import studyPlansRouter from "./studyPlans";
import questionsRouter from "./questions";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(papersRouter);
router.use(syllabiRouter);
router.use(analysesRouter);
router.use(topicsRouter);
router.use(studyPlansRouter);
router.use(questionsRouter);
router.use(dashboardRouter);

export default router;
