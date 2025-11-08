import { Router } from "express";
import * as auth from "../controllers/auth.controller";
import { validateBody, validateQuery } from "../middlewares/validate.middleware";
import * as validation from "../validation/auth.validation";

const router = Router();

router.post("/register", validateBody(validation.registerSchema), auth.register);
router.post("/verify-email", validateQuery(validation.verifyEmailQuerySchema), auth.verifyEmail);
router.post("/login", validateBody(validation.loginSchema), auth.login);
router.post("/refresh", auth.refresh);
router.post("/logout", auth.logout);

// (Optional)- Resend verification email
// router.post(
//   "/resend-verification",
//   validateBody(validation.resendVerificationSchema),
//   auth.resendVerification);

export default router;
