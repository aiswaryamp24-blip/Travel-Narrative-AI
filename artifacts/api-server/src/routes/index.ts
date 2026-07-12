import { Router, type IRouter } from "express";
import healthRouter from "./health";
import storageRouter from "./storage";
import tripsRouter from "./trips";
import usersRouter from "./users";

const router: IRouter = Router();

router.use(healthRouter);
router.use(storageRouter);
router.use(tripsRouter);
router.use(usersRouter);

export default router;
