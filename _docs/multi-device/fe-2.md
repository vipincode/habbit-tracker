let’s now enhance your **Active Sessions dashboard** to display **session expiration info** — just like Google or GitHub do (“Expires in 2 days”).

We’ll calculate this from the refresh token’s creation time + expiration duration (usually `7d`), and display a countdown in your UI.

---

## 🧩 1. Backend — Include `expiresAt` in Session Data

In your `/api/auth/sessions` controller, modify the response to include `expiresAt` for each session.

### 📄 `controllers/auth.controller.ts`

```ts
import ms from "ms"; // npm install ms

export const getActiveSessions = async (req: Request, res: Response) => {
  const cookieToken = req.cookies?.refreshToken;
  if (!cookieToken) throw CustomError.Unauthorized("Missing refresh token");

  const decoded = await verifyRefreshToken(cookieToken);
  const user = await User.findById(decoded.userId).select("refreshTokens");

  if (!user) throw CustomError.NotFound("User not found");

  // Refresh token expiration (e.g. "7d")
  const refreshTTL = ENV.REFRESH_TOKEN_EXPIRES_IN || "7d";
  const ttlMs = ms(refreshTTL);

  const sessions = user.refreshTokens?.map((session) => {
    const expiresAt = new Date(session.createdAt.getTime() + ttlMs);
    return {
      device: session.device,
      ip: session.ip,
      loggedInAt: session.createdAt,
      expiresAt,
      isCurrent: session.token === cookieToken,
      token: session.token,
    };
  });

  return res.status(200).json({
    success: true,
    sessions,
  });
};
```

✅ This now returns each session with an `expiresAt` field based on the refresh token’s lifespan.

---

## 🧩 2. Frontend — Update React Query + Component

### 📄 `hooks/useSessions.ts`

_(no change needed — it already fetches all session fields)_

---

### 📄 `components/ActiveSessions.tsx` (Updated)

We’ll show `Expires in X days` using **date-fns**’s `formatDistanceToNow()`.

```tsx
"use client";

import { useSessions } from "@/hooks/useSessions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, MonitorSmartphone, Power, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function ActiveSessions() {
  const { sessions, isLoading, logout, logoutAll } = useSessions();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!sessions?.length) {
    return <p className="text-center text-muted-foreground">No active sessions</p>;
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader className="flex justify-between items-center">
        <CardTitle className="text-lg font-semibold">Active Sessions</CardTitle>
        <Button variant="destructive" size="sm" onClick={() => logoutAll()}>
          Logout All
        </Button>
      </CardHeader>

      <CardContent>
        <ul className="space-y-3">
          {sessions.map((session: any, idx: number) => {
            const expiresIn = formatDistanceToNow(new Date(session.expiresAt), {
              addSuffix: true,
            });

            return (
              <li
                key={idx}
                className={`flex justify-between items-center p-4 border rounded-xl ${
                  session.isCurrent ? "border-blue-500" : "border-muted"
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <MonitorSmartphone className="w-4 h-4 text-muted-foreground" />
                    <p className="font-medium text-sm">{session.device}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    IP: {session.ip} • Logged in: {new Date(session.loggedInAt).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    Expires {expiresIn}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {session.isCurrent && (
                    <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-md">
                      Current
                    </span>
                  )}
                  {!session.isCurrent && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => logout(session.token)}
                      className="flex items-center gap-1"
                    >
                      <Power className="w-4 h-4" /> Logout
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
```

---

## 🧠 3. Example UI

```
Active Sessions
──────────────────────────────────────────────
🖥️ Mozilla/5.0 (Windows NT 10.0; Win64)
IP: 127.0.0.1 • Logged in: Nov 8, 2025, 5:45 PM
🕓 Expires in 6 days
[ Current ]

📱 Mozilla/5.0 (iPhone; CPU iPhone OS 17_3)
IP: 192.168.1.45 • Logged in: Nov 7, 2025, 9:21 AM
🕓 Expires in 1 day
[ Logout ]
──────────────────────────────────────────────
[ Logout All ]
```

---

## ✅ 4. Summary of Enhancements

| Feature        | Before                 | After                                       |
| -------------- | ---------------------- | ------------------------------------------- |
| Session info   | Device, IP, login time | + Expiration time                           |
| UX clarity     | ❌                     | ✅ Shows countdown (“Expires in 6 days”)    |
| Implementation | static                 | dynamic based on `REFRESH_TOKEN_EXPIRES_IN` |
| Dependencies   | none                   | `ms`, `date-fns`                            |

---

## 🧩 5. Dependencies to Install

Run this in your Next.js project:

```bash
npm install date-fns ms
```

---

## 💡 TL;DR

✅ Backend calculates `expiresAt` using `ms("7d")`
✅ Frontend formats it dynamically (`formatDistanceToNow`)
✅ Users see how long each session stays valid
✅ Matches behavior of major apps like Google or GitHub

---
