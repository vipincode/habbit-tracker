You’re about to add **token metadata tracking** so you can:
✅ List active sessions per user (device, IP, login time)
✅ Allow logout from a specific device
✅ Increase visibility + security (like “Active sessions” in Google or GitHub)

Let’s go step-by-step 👇

---

## 🧩 1. Update Your Mongoose Schema

Instead of storing only strings in `refreshTokens: string[]`,
we’ll store **objects** with metadata:

### 📄 `models/User.ts`

```ts
import mongoose, { Schema, Document } from "mongoose";

interface RefreshTokenEntry {
  token: string;
  device?: string;
  ip?: string;
  createdAt: Date;
}

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  username: string;
  role: string;
  isVerified: boolean;
  verificationToken?: string | null;
  verificationTokenExpires?: Date | null;
  refreshTokens?: RefreshTokenEntry[];
}

const refreshTokenSchema = new Schema<RefreshTokenEntry>(
  {
    token: { type: String, required: true },
    device: { type: String },
    ip: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

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
    refreshTokens: { type: [refreshTokenSchema], default: [] }, // ✅ array of token objects
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>("User", userSchema);
```

✅ Each refresh token now has:

- `token`: the JWT string
- `device`: optional device info
- `ip`: client IP address
- `createdAt`: login time

---

## 🧩 2. Update Login Controller

We’ll capture device + IP and store them along with the refresh token.

```ts
export const login = async (
  req: Request<{}, {}, LoginUserInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) throw CustomError.BadRequest("Invalid credentials");

    if (!user.isVerified) throw CustomError.Forbidden("Please verify your email before logging in");

    const isMatch = await comparePasswords(password, user.password);
    if (!isMatch) throw CustomError.BadRequest("Invalid credentials");

    const payload = {
      userId: user._id.toString(),
      email: user.email,
      username: user.username,
      role: user.role,
    };

    const accessToken = await signAccessToken(payload);
    const refreshToken = await signRefreshToken(payload);

    // 🧩 Capture device and IP info
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "Unknown IP";
    const device = req.headers["user-agent"] || "Unknown Device";

    // Add metadata token entry
    user.refreshTokens?.push({
      token: refreshToken,
      device,
      ip: Array.isArray(ip) ? ip[0] : ip,
      createdAt: new Date(),
    });

    await user.save({ validateBeforeSave: false });

    res.cookie("refreshToken", refreshToken, cookieOptions());

    res.status(200).json({
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

✅ Each login stores:

- Token
- Device info (browser, OS)
- IP address
- Created date

---

## 🧩 3. Update Refresh Controller

Now you need to find + rotate token **by matching the token field** inside the array.

```ts
export const refresh = async (req: Request, res: Response) => {
  try {
    const cookieToken = req.cookies?.refreshToken;
    if (!cookieToken) throw CustomError.Unauthorized("Missing refresh token");

    const decoded = await verifyRefreshToken(cookieToken);
    const userId = decoded.userId;

    const user = await User.findById(userId);
    if (!user) throw CustomError.Forbidden("User not found");

    const existingToken = user.refreshTokens?.find((entry) => entry.token === cookieToken);
    if (!existingToken) throw CustomError.Forbidden("Invalid or expired refresh token");

    // Create new tokens
    const payload = {
      userId: user._id.toString(),
      email: user.email,
      username: user.username,
      role: user.role,
    };

    const newAccessToken = await signAccessToken(payload);
    const newRefreshToken = await signRefreshToken(payload);

    // 🧩 Rotate token: replace the current entry
    existingToken.token = newRefreshToken;
    existingToken.createdAt = new Date();

    await user.save({ validateBeforeSave: false });

    res.cookie("refreshToken", newRefreshToken, cookieOptions());

    return res.status(200).json({
      success: true,
      message: "Access token refreshed successfully",
      accessToken: newAccessToken,
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(403).json({ message: "Token invalid or expired" });
  }
};
```

✅ Preserves the same device’s token while rotating it safely.

---

## 🧩 4. Logout (current device only)

We’ll `$pull` only the matching token object from the `refreshTokens` array.

```ts
export const logout = async (req: Request, res: Response) => {
  const cookieToken = req.cookies?.refreshToken;
  if (cookieToken) {
    await User.findOneAndUpdate(
      { "refreshTokens.token": cookieToken },
      { $pull: { refreshTokens: { token: cookieToken } } }, // ✅ remove only one session
      { new: true }
    );
  }

  res.clearCookie("refreshToken", { ...cookieOptions(), maxAge: 0 });

  return res.status(200).json({
    success: true,
    message: "Logged out from this device successfully",
  });
};
```

✅ Logs out the current device only.

---

## 🧩 5. Logout All Devices

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

✅ Clears all active tokens at once.

---

## 🧩 6. Optional — “Active Sessions” API

You can now easily show users all their logged-in sessions (browser, IP, time):

```ts
export const getActiveSessions = async (req: Request, res: Response) => {
  const cookieToken = req.cookies?.refreshToken;
  if (!cookieToken) throw CustomError.Unauthorized("Missing refresh token");

  const decoded = await verifyRefreshToken(cookieToken);
  const user = await User.findById(decoded.userId).select("refreshTokens");

  if (!user) throw CustomError.NotFound("User not found");

  return res.status(200).json({
    success: true,
    sessions: user.refreshTokens?.map((session) => ({
      device: session.device,
      ip: session.ip,
      loggedInAt: session.createdAt,
      isCurrent: session.token === cookieToken,
    })),
  });
};
```

✅ Frontend can use this for a “Manage Sessions” page.

---

## ✅ Example “Active Sessions” Response

```json
{
  "success": true,
  "sessions": [
    {
      "device": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      "ip": "127.0.0.1",
      "loggedInAt": "2025-11-08T17:15:32.123Z",
      "isCurrent": true
    },
    {
      "device": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_3_1)",
      "ip": "192.168.1.45",
      "loggedInAt": "2025-11-07T09:21:45.567Z",
      "isCurrent": false
    }
  ]
}
```

---

## 🧠 Summary

| Feature              | Before        | After                       |
| -------------------- | ------------- | --------------------------- |
| Store refresh token  | Single string | Array with metadata objects |
| Track IP & device    | ❌ No         | ✅ Yes                      |
| Rotate per device    | ❌ No         | ✅ Yes                      |
| Logout one device    | ❌ No         | ✅ Yes                      |
| Logout all devices   | ✅ Yes        | ✅ Yes                      |
| Show active sessions | ❌ No         | ✅ Yes                      |

---

✅ **You now have a professional-grade token system**, like what large apps (Google, Slack, GitHub) use:

- Each device → unique refresh token
- Metadata for device/IP tracking
- Secure rotation
- Full logout control

---
