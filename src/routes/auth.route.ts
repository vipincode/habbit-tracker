import { Router } from "express";
import { sendWelcomeEmail } from "../utils/email-sender/send-email";

const router = Router();

router.post("/signup", async (req, res) => {
  const { name, email } = req.body;

  try {
    // For example, create user in DB here...

    await sendWelcomeEmail(email, name, email); // call your mail function

    res.json({ success: true, message: "Signup successful and email sent!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to send email" });
  }
});

export default router;
