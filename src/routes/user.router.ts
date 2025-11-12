import { Router } from "express";
import * as user from "../controllers/user.controller";
import { protect } from "../middlewares/protected.middleware";

const router = Router();

router.get("/me", protect, user.me);
router.get("/", protect, user.getAllUser);
router.get("/:id", protect, user.getUser);
router.get("/:id", protect, user.updateUser);
router.get("/:id", protect, user.deleteUser);

export default router;
