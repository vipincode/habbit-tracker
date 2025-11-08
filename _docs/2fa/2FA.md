**simple email-based Two-Factor Authentication (2FA)** flow — no external apps, just email codes.

This approach is perfect for SaaS dashboards, admin panels, or regular web apps where users already have verified emails.

Let’s build it step by step using your existing Express + TypeScript + Mongoose stack.
We’ll make it **production-ready, clean, and modular.**

---

## 🧩 Overview of the Flow

| Step | Action               | Description                          |
| ---- | -------------------- | ------------------------------------ |
| 1️⃣   | User logs in         | Verify email + password              |
| 2️⃣   | Send 6-digit code    | Email OTP code (expires in 5 min)    |
| 3️⃣   | User enters code     | Verify OTP → issue JWT tokens        |
| 4️⃣   | User can disable 2FA | Stop requiring email codes next time |

---

## 🏗️ 1. Update Your User Model

Add these fields to your existing `User` schema:

```ts
const userSchema = new Schema<IUser>({
  name: String,
  email: String,
  password: String,
  isVerified: { type: Boolean, default: false },
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorCode: { type: String, default: null },
  twoFactorCodeExpires: { type: Date, default: null },
});
```

This allows us to temporarily store the 6-digit OTP and its expiry time.

---

## 🧰 2. Utility for Generating OTP Code

Create `src/utils/generateOtp.ts`:

```ts
export const generateOtp = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
};
```

---

## ✉️ 3. Email Utility (Send OTP)

You already have a mail setup (like Nodemailer).
Add this function in `src/utils/email.ts`:

```ts
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendTwoFactorCode = async (email: string, code: string) => {
  const html = `
    <h2>Your 2FA Login Code</h2>
    <p>Use this 6-digit code to complete your login:</p>
    <h3>${code}</h3>
    <p>This code will expire in 5 minutes.</p>
  `;

  await transporter.sendMail({
    from: '"Secure Login" <no-reply@yourapp.com>',
    to: email,
    subject: "Your Two-Factor Authentication Code",
    html,
  });
};
```

---

## 🔐 4. Login (Step 1 — Email + Password Check)

Modify your `login` controller so that if 2FA is enabled, you **don’t issue JWTs immediately** — instead, send the 6-digit code.

### ✅ Controller: `auth.controller.ts`

```ts
import { generateOtp } from "../utils/generateOtp";
import { sendTwoFactorCode } from "../utils/email";
import { signAccessToken, signRefreshToken } from "../utils/jwt";
import { cookieOptions } from "../utils/cookieOptions";

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) throw CustomError.BadRequest("Invalid credentials");
    if (!user.isVerified) throw CustomError.Forbidden("Please verify your email first");

    const isMatch = await user.comparePassword(password);
    if (!isMatch) throw CustomError.BadRequest("Invalid credentials");

    // 🔹 If 2FA is disabled → normal login
    if (!user.twoFactorEnabled) {
      const payload = { id: user._id, email: user.email, role: user.role };
      const accessToken = await signAccessToken(payload);
      const refreshToken = await signRefreshToken(payload);

      user.refreshToken = refreshToken;
      await user.save({ validateBeforeSave: false });

      res.cookie("refreshToken", refreshToken, cookieOptions());
      return res.status(200).json({ success: true, accessToken });
    }

    // 🔹 2FA is enabled → send code
    const otp = generateOtp();
    user.twoFactorCode = otp;
    user.twoFactorCodeExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 min
    await user.save({ validateBeforeSave: false });

    await sendTwoFactorCode(user.email, otp);

    res.status(200).json({
      success: true,
      message: "2FA code sent to your email. Please verify to complete login.",
    });
  } catch (error) {
    next(error);
  }
};
```

---

## ✅ 5. Verify 2FA Code (Step 2 — OTP Verification)

Now create a new route to handle code verification.

### **POST /api/auth/2fa/verify**

```ts
export const verifyTwoFactorCode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, code } = req.body;

    const user = await User.findOne({ email });
    if (!user) throw CustomError.BadRequest("User not found");
    if (!user.twoFactorEnabled) throw CustomError.BadRequest("2FA not enabled");

    // Check code validity
    if (
      !user.twoFactorCode ||
      user.twoFactorCode !== code ||
      user.twoFactorCodeExpires! < new Date()
    ) {
      throw CustomError.BadRequest("Invalid or expired code");
    }

    // Clear code after success
    user.twoFactorCode = null;
    user.twoFactorCodeExpires = null;
    await user.save({ validateBeforeSave: false });

    // Now issue tokens
    const payload = { id: user._id, email: user.email, role: user.role };
    const accessToken = await signAccessToken(payload);
    const refreshToken = await signRefreshToken(payload);

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    res.cookie("refreshToken", refreshToken, cookieOptions());
    res.status(200).json({ success: true, accessToken });
  } catch (error) {
    next(error);
  }
};
```

---

## 🚫 6. Disable 2FA Route

Users should be able to turn 2FA off if they prefer.

### **POST /api/auth/2fa/disable**

```ts
export const disableTwoFactor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.user.id); // assuming JWT middleware
    if (!user) throw CustomError.BadRequest("User not found");

    user.twoFactorEnabled = false;
    user.twoFactorCode = null;
    user.twoFactorCodeExpires = null;
    await user.save({ validateBeforeSave: false });

    res.json({ success: true, message: "Two-factor authentication disabled." });
  } catch (error) {
    next(error);
  }
};
```

---

## 🛠️ 7. Routes Setup

### `src/routes/auth.routes.ts`

```ts
router.post("/login", validateBody(validation.loginSchema), auth.login);
router.post(
  "/2fa/verify",
  validateBody(validation.verifyTwoFactorSchema),
  auth.verifyTwoFactorCode
);
router.post("/2fa/disable", authMiddleware, auth.disableTwoFactor);
```

---

## 🧠 Validation Schemas

### `auth.validation.ts`

```ts
export const verifyTwoFactorSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
});
```

---

## ⚙️ Optional: Enable/Disable 2FA UI

Add another route to **enable** 2FA manually from account settings:

```ts
router.post("/2fa/enable", authMiddleware, auth.enableTwoFactor);
```

Controller:

```ts
export const enableTwoFactor = async (req: Request, res: Response, next: NextFunction) => {
  const user = await User.findById(req.user.id);
  user.twoFactorEnabled = true;
  await user.save();
  res.json({ success: true, message: "2FA enabled. You'll receive codes during login." });
};
```

---

## 💎 Summary of the Flow

| Step                | Route                                             | Description |
| ------------------- | ------------------------------------------------- | ----------- |
| `POST /login`       | Verifies credentials → sends OTP (if 2FA enabled) |             |
| `POST /2fa/verify`  | Verifies OTP → issues JWTs                        |             |
| `POST /2fa/enable`  | Enables email 2FA                                 |             |
| `POST /2fa/disable` | Disables email 2FA                                |             |

---

## 🔒 Security Best Practices

✅ OTP expires after 5 minutes
✅ OTP is **single-use** (deleted after verification)
✅ Use HTTPS (to protect cookie + credentials)
✅ Rate limit `/2fa/verify` endpoint
✅ Don’t expose `twoFactorCode` in any response
✅ Store hashed version of OTP if extra security needed

```ts
import crypto from "crypto";
const hashed = crypto.createHash("sha256").update(code).digest("hex");
```

---
