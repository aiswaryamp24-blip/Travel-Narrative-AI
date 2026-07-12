import { Router, type IRouter } from "express";
import healthRouter from "./health";
import storageRouter from "./storage";
import tripsRouter from "./trips";
import usersRouter from "./users";
import digestsRouter from "./digests";

const router: IRouter = Router();

router.use(healthRouter);
router.use(storageRouter);
router.use(tripsRouter);
router.use(usersRouter);
router.use(digestsRouter);

export default router;
