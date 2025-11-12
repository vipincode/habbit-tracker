import { Router } from "express";
import { validateBody } from "../middlewares/validate.middleware";
import * as validation from "../validation/habit.validation";
import * as habit from "../controllers/habit.controller";
import { protect } from "../middlewares/protected.middleware";

const router = Router();

router.post("/", protect, validateBody(validation.habitSchema), habit.createHabit);

export default router;
