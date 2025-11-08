let’s make your **Active Sessions** dashboard fully dynamic by adding **auto-refresh every 60 seconds**, so the "Expires in..." countdown updates in real time — just like professional dashboards (e.g. Google Account, GitHub, Slack).

We’ll use **React Query’s `refetchInterval`** feature, which automatically re-fetches data every set interval.

---

## 🧩 1. Update the `useSessions` Hook

### 📄 `hooks/useSessions.ts`

We’ll add a `refetchInterval: 60000` (60 seconds) option to auto-refresh the session list.

```ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSessions, logoutSession, logoutAllSessions } from "@/lib/api/auth";
import toast from "react-hot-toast";

export const useSessions = () => {
  const queryClient = useQueryClient();

  const {
    data: sessions,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["sessions"],
    queryFn: getSessions,
    refetchInterval: 60000, // 🧩 auto-refresh every 60s
    refetchOnWindowFocus: true, // also refresh when user comes back to tab
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
    refetch, // expose manual refetch if needed
  };
};
```

✅ React Query will automatically call your `/api/auth/sessions` endpoint every 60 seconds
✅ Also refreshes when the user returns to the browser tab (for better UX)

---

## 🧩 2. (Optional) — Add a Manual Refresh Button

If you want users to manually trigger refresh (like a “↻ Refresh” icon), just add a button.

### 📄 `components/ActiveSessions.tsx` (minor update)

Add this inside your `<CardHeader>`:

```tsx
import { RotateCcw } from "lucide-react";

<CardHeader className="flex justify-between items-center">
  <div className="flex items-center gap-2">
    <CardTitle className="text-lg font-semibold">Active Sessions</CardTitle>
    <Button variant="ghost" size="icon" onClick={() => refetch()} title="Refresh sessions">
      <RotateCcw className="w-4 h-4" />
    </Button>
  </div>
  <Button variant="destructive" size="sm" onClick={() => logoutAll()}>
    Logout All
  </Button>
</CardHeader>;
```

✅ Users can now manually refresh instantly.
✅ But the dashboard still auto-refreshes every 60 seconds.

---

## 🧠 3. How It Works

| Event                     | Behavior                           |
| ------------------------- | ---------------------------------- |
| Page open                 | Fetches sessions immediately       |
| User switches back to tab | Auto-refresh                       |
| Every 60 seconds          | Auto-refresh                       |
| Manual “↻” click          | Manual refresh                     |
| Logout any device         | Invalidates + re-fetches instantly |

---

## 🧩 4. Optional — Show “Last updated” Timestamp

Add a small text line under your header to show when it last refreshed:

```tsx
<p className="text-xs text-muted-foreground">Last updated: {new Date().toLocaleTimeString()}</p>
```

If you want to make it dynamic, store it in a `useState` that updates on each refetch.

---

## ✅ Example Final UI

```
Active Sessions   [↻ Refresh]               [Logout All]
──────────────────────────────────────────────
🖥️ Chrome on Windows 10
IP: 127.0.0.1 • Logged in: Nov 8, 2025, 5:45 PM
🕓 Expires in 6 days
[ Current ]

📱 iPhone 17.3 Safari
IP: 192.168.1.45 • Logged in: Nov 7, 2025, 9:21 AM
🕓 Expires in 1 day
[ Logout ]
──────────────────────────────────────────────
Last updated: 5:46 PM
```

---

## ✅ 5. Summary of Improvements

| Feature               | Status                            |
| --------------------- | --------------------------------- |
| Auto-refresh sessions | ✅ Every 60s via React Query      |
| Refresh on tab focus  | ✅ Enabled                        |
| Manual refresh button | ✅ Optional add                   |
| Live expiry countdown | ✅ With `date-fns`                |
| Re-fetch after logout | ✅ Instant via cache invalidation |

---

## 💡 TL;DR

✅ Add `refetchInterval: 60000` to `useQuery`
✅ Sessions auto-refresh every 60 seconds
✅ Users always see accurate “Expires in…” countdown
✅ No manual reloads needed

---
