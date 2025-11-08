let’s build a **modern “Active Sessions” dashboard** in React (Next.js App Router + React Query + ShadCN UI).

You’ll get a clean UI showing:
✅ Logged-in devices (browser + IP)
✅ When each session was created
✅ Which one is “current”
✅ “Logout this device” and “Logout all” buttons

Let’s go step-by-step 👇

---

## 🧩 1. Your Backend Endpoints (Recap)

You should already have these Express routes:

| Method | Route                  | Description                 |
| ------ | ---------------------- | --------------------------- |
| `GET`  | `/api/auth/sessions`   | Returns all active sessions |
| `POST` | `/api/auth/logout`     | Logs out current device     |
| `POST` | `/api/auth/logout-all` | Logs out all devices        |

---

## 🧩 2. Create Frontend API Helpers

### 📄 `lib/api/auth.ts`

```ts
import axios from "axios";

export const getSessions = async () => {
  const { data } = await axios.get("/api/auth/sessions", { withCredentials: true });
  return data.sessions;
};

export const logoutSession = async (token: string) => {
  const { data } = await axios.post("/api/auth/logout", { token }, { withCredentials: true });
  return data;
};

export const logoutAllSessions = async () => {
  const { data } = await axios.post("/api/auth/logout-all", {}, { withCredentials: true });
  return data;
};
```

✅ `withCredentials: true` ensures cookies are included in every request.

---

## 🧩 3. Create the React Query Hooks

### 📄 `hooks/useSessions.ts`

```ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSessions, logoutSession, logoutAllSessions } from "@/lib/api/auth";
import toast from "react-hot-toast";

export const useSessions = () => {
  const queryClient = useQueryClient();

  const { data: sessions, isLoading } = useQuery({
    queryKey: ["sessions"],
    queryFn: getSessions,
  });

  const logoutMutation = useMutation({
    mutationFn: logoutSession,
    onSuccess: () => {
      toast.success("Logged out from this device");
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });

  const logoutAllMutation = useMutation({
    mutationFn: logoutAllSessions,
    onSuccess: () => {
      toast.success("Logged out from all devices");
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });

  return {
    sessions,
    isLoading,
    logout: logoutMutation.mutate,
    logoutAll: logoutAllMutation.mutate,
  };
};
```

---

## 🧩 4. Create the “Active Sessions” Component

### 📄 `components/ActiveSessions.tsx`

```tsx
"use client";

import { useSessions } from "@/hooks/useSessions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, MonitorSmartphone, Power } from "lucide-react";

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
          {sessions.map((session: any, idx: number) => (
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
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
```

✅ Highlights:

- “Current session” badge
- “Logout this device” for others
- “Logout All” button on top
- Responsive + minimal ShadCN UI styling

---

## 🧩 5. Add Toast Notifications

Make sure you’ve configured **react-hot-toast** globally (if not already):

### 📄 `app/layout.tsx`

```tsx
import { Toaster } from "react-hot-toast";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
```

---

## 🧩 6. Use It in a Page

### 📄 `app/dashboard/sessions/page.tsx`

```tsx
import ActiveSessions from "@/components/ActiveSessions";

export default function SessionsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Manage Active Sessions</h1>
      <ActiveSessions />
    </div>
  );
}
```

---

## 🧠 Example UI Output

```
Active Sessions
-----------------------------------------
🖥️ Mozilla/5.0 (Windows NT 10.0)
IP: 127.0.0.1 • Logged in: Nov 8, 2025, 5:45 PM
[ Current ]

📱 Mozilla/5.0 (iPhone; CPU iPhone OS 17_3)
IP: 192.168.1.45 • Logged in: Nov 7, 2025, 9:21 AM
[ Logout ]
-----------------------------------------
[ Logout All ]
```

---

## ✅ Summary

| Feature              | Status                         |
| -------------------- | ------------------------------ |
| Fetch sessions list  | ✅ React Query (`useSessions`) |
| Logout single device | ✅ Works via `/logout`         |
| Logout all           | ✅ Works via `/logout-all`     |
| UI feedback          | ✅ Toast messages              |
| Modern UI            | ✅ ShadCN + Lucide icons       |

---

## 🧠 TL;DR

✅ Backend → returns session metadata
✅ Frontend → uses React Query for live sync
✅ Clean dashboard → shows devices, IP, times
✅ Works perfectly with your JWT + cookies system
