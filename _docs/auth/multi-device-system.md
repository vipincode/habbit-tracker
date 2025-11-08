You’ll be able to:
✅ Log in from multiple devices (each with its own refresh token)
✅ Refresh tokens independently
✅ Logout one device (only)
✅ Logout from all devices

Let’s go step-by-step 👇

---

## 🧩 1. Update the Mongoose Model

### 📄 `models/User.ts`

Change `refreshToken` → `refreshTokens` (array of strings)

```ts
import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  username: string;
  role: string;
  isVerified: boolean;
  verificationToken?: string | null;
  verificationTokenExpires?: Date | null;
  refreshTokens?: string[]; // ✅ multiple tokens
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, default: "user" },
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String, default: null },
    verificationTokenExpires: { type: Date, default: null },
    refreshTokens: { type: [String], default: [] }, // ✅ multiple refresh tokens
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>("User", userSchema);
```

---

## 🧩 2. Update Login Controller

When a user logs in, push their new refresh token into the array.

### 📄 `controllers/auth.controller.ts`

```ts
// 🧠 Login controller (multi-device)
export const login = async (
  req: Request<{}, {}, LoginUserInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) throw CustomError.BadRequest("Invalid credentials");

    if (!user.isVerified) {
      throw CustomError.Forbidden("Please verify your email before logging in");
    }

    const isMatch = await comparePasswords(password, user.password);
    if (!isMatch) throw CustomError.BadRequest("Invalid credentials");

    // JWT payload
    const payload = {
      userId: user._id.toString(),
      email: user.email,
      username: user.username,
      role: user.role,
    };

    // Generate tokens
    const accessToken = await signAccessToken(payload);
    const refreshToken = await signRefreshToken(payload);

    // 🧩 Push refresh token to array
    user.refreshTokens?.push(refreshToken);
    await user.save({ validateBeforeSave: false });

    // Set cookie
    res.cookie("refreshToken", refreshToken, cookieOptions());

    return res.status(200).json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      accessToken,
    });
  } catch (error) {
    next(error);
  }
};
```

✅ Each device now gets its own refresh token stored in the DB.

---

## 🧩 3. Update Refresh Controller

Now you must **validate** that the refresh token exists in the user’s `refreshTokens` array, and then **rotate** it (remove old + add new).

```ts
export const refresh = async (req: Request, res: Response) => {
  try {
    const cookieToken = req.cookies?.refreshToken;
    if (!cookieToken) {
      throw CustomError.Unauthorized("Missing refresh token");
    }

    const decoded = await verifyRefreshToken(cookieToken);
    const userId = decoded.userId;

    const user = await User.findById(userId);
    if (!user || !user.refreshTokens?.includes(cookieToken)) {
      throw CustomError.Forbidden("Invalid or expired refresh token");
    }

    const payload = {
      userId: user._id.toString(),
      email: user.email,
      username: user.username,
      role: user.role,
    };

    const newAccessToken = await signAccessToken(payload);
    const newRefreshToken = await signRefreshToken(payload);

    // 🧩 Rotate refresh token for this device only
    user.refreshTokens = user.refreshTokens.filter((t) => t !== cookieToken);
    user.refreshTokens.push(newRefreshToken);
    await user.save({ validateBeforeSave: false });

    // Replace cookie
    res.cookie("refreshToken", newRefreshToken, cookieOptions());

    return res.status(200).json({
      success: true,
      message: "Access token refreshed successfully",
      accessToken: newAccessToken,
    });
  } catch (err) {
    console.error("Refresh error:", err);
    return res.status(403).json({ message: "Token invalid or expired" });
  }
};
```

✅ Each device maintains its own token lifecycle.
✅ Refresh on one device doesn’t affect others.

---

## 🧩 4. Update Logout Controller

You can now log out **this device only**, or optionally **all devices**.

### Logout (current device only)

```ts
export const logout = async (req: Request, res: Response) => {
  const cookieToken = req.cookies?.refreshToken;

  if (cookieToken) {
    await User.findOneAndUpdate(
      { refreshTokens: cookieToken },
      { $pull: { refreshTokens: cookieToken } }, // 🧩 remove only this token
      { new: true }
    );
  }

  // Clear cookie
  res.clearCookie("refreshToken", { ...cookieOptions(), maxAge: 0 });

  return res.status(200).json({
    success: true,
    message: "Logged out from this device successfully",
  });
};
```

✅ Removes only the token used by the current device.

---

### Logout All Devices

You can add a separate endpoint (e.g. `/logout-all`) to remove all tokens at once:

```ts
export const logoutAll = async (req: Request, res: Response) => {
  const cookieToken = req.cookies?.refreshToken;

  if (cookieToken) {
    const decoded = await verifyRefreshToken(cookieToken);
    const userId = decoded.userId;
    await User.findByIdAndUpdate(userId, { $set: { refreshTokens: [] } });
  }

  res.clearCookie("refreshToken", { ...cookieOptions(), maxAge: 0 });

  return res.status(200).json({
    success: true,
    message: "Logged out from all devices successfully",
  });
};
```

✅ Clears every token → logs out all sessions.

---

## 🧠 5. Updated Routes

### 📄 `routes/auth.routes.ts`

```ts
router.post("/register", validateBody(registerSchema), auth.register);
router.post("/login", validateBody(loginSchema), auth.login);
router.post("/refresh", auth.refresh);
router.post("/logout", auth.logout);
router.post("/logout-all", auth.logoutAll);
```

---

## ✅ Summary

| Feature                | Old System                 | New Multi-Device System           |
| ---------------------- | -------------------------- | --------------------------------- |
| Login multiple devices | ❌ Overwrites last session | ✅ Each gets unique refresh token |
| Refresh token          | ✅ Works globally          | ✅ Works per device               |
| Logout this device     | ✅ (global)                | ✅ (specific device only)         |
| Logout all devices     | ✅                         | ✅ Separate endpoint              |
| Token rotation         | ✅                         | ✅ per-device rotation            |

---

## 🚀 TL;DR

✅ **Add `refreshTokens: string[]`** to your model
✅ **Push** token on login
✅ **Rotate** token on refresh
✅ **$pull** token on logout (this device)
✅ **Clear all** tokens on logout-all

Now your authentication system is:

- Multi-device capable
- Secure (token rotation)
- Consistent with best JWT practices
- Scalable for web + mobile apps

---
