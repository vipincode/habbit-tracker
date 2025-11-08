## 🧩 1. How the Backend Handles Expiry

On your server, you set the expiration when creating the OTP:

```ts
user.twoFactorCodeExpires = new Date(Date.now() + 3 * 60 * 1000); // 3 minutes
```

So, from the moment the server sends the OTP, it will expire exactly 3 minutes later.

---

## 🧭 2. How the Frontend Knows the Timer Start

When your backend responds to the `/login` or `/2fa/send` request (the one that sends the OTP),
you include the **expiration timestamp** in the JSON response.

### Example Response

```json
{
  "success": true,
  "message": "2FA code sent to your email.",
  "expiresAt": "2025-11-08T14:30:00.000Z"
}
```

Then your frontend can display a timer that counts down to that exact UTC timestamp.

---

## 🧠 3. Example React Logic for Countdown Timer

Here’s a clean, production-ready React component using hooks.

```tsx
import React, { useEffect, useState } from "react";

interface OtpTimerProps {
  expiresAt: string; // ISO timestamp from backend
  onExpire: () => void;
}

const OtpTimer: React.FC<OtpTimerProps> = ({ expiresAt, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState<number>(
    Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000))
  );

  useEffect(() => {
    if (timeLeft <= 0) {
      onExpire();
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, onExpire]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="text-gray-700 font-medium text-sm">
      {timeLeft > 0 ? (
        <span>
          Code expires in{" "}
          <strong>
            {minutes}:{seconds.toString().padStart(2, "0")}
          </strong>
        </span>
      ) : (
        <span className="text-red-500">Code expired</span>
      )}
    </div>
  );
};

export default OtpTimer;
```

---

## 🧱 4. How You’d Use It in Your 2FA Page

Example (Next.js or React):

```tsx
import { useState } from "react";
import OtpTimer from "./OtpTimer";

export default function VerifyOtpPage() {
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [otp, setOtp] = useState("");

  // Simulated backend response
  const sendOtp = async () => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "test@example.com", password: "secret" }),
    });
    const data = await res.json();
    setExpiresAt(data.expiresAt); // from backend
  };

  const handleExpire = () => {
    alert("Code expired! Please request a new one.");
  };

  return (
    <div className="p-4 space-y-4">
      {!expiresAt ? (
        <button onClick={sendOtp} className="bg-blue-500 text-white px-4 py-2 rounded">
          Send OTP
        </button>
      ) : (
        <>
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Enter 6-digit code"
            className="border p-2 rounded w-full"
          />
          <OtpTimer expiresAt={expiresAt} onExpire={handleExpire} />
        </>
      )}
    </div>
  );
}
```

✅ This will show:

```
Code expires in 2:59
```

and count down to `0:00`, then display “Code expired”.

---

## 🧩 5. UX Enhancements

✅ **Auto-disable the “Verify” button** when the timer expires.
✅ **Show a “Resend Code” button** after expiration (only if cooldown allows).
✅ **Sync backend time** if needed — use server’s UTC timestamp (`expiresAt`) to avoid local clock differences.
✅ Optional — Use an animated progress bar or radial countdown (for mobile-friendly UI).

---

## 🧠 6. Handling Edge Cases

| Issue                     | Fix                                           |
| ------------------------- | --------------------------------------------- |
| User’s local clock is off | Always use backend `expiresAt` timestamp      |
| User refreshes page       | Save `expiresAt` in `localStorage`            |
| Slow email delivery       | Use 3–5 minute expiry buffer                  |
| User clicks "Resend"      | Backend should respect cooldown (e.g., 1 min) |

Example to persist timer across reloads:

```ts
localStorage.setItem("otpExpiresAt", expiresAt);
```

---

## ✅ Backend + Frontend Coordination Summary

| Part         | Responsibility                                                    |
| ------------ | ----------------------------------------------------------------- |
| **Backend**  | Generates OTP + sends email + responds with `expiresAt` timestamp |
| **Frontend** | Displays countdown clock + disables verification after expiry     |
| **UX goal**  | Smooth, transparent, and safe OTP experience                      |

---

## 🔒 Bonus Tip

For _extra realism_, you can return both:

```json
{
  "expiresAt": "2025-11-08T14:30:00.000Z",
  "cooldown": 60
}
```

Then show a **“Resend available in 1:00”** timer right after expiry.
