**How header set, what is process, how it work can you explain it**

---

## ⚙️ Overview

Your JWT system has **two tokens**:

| Token             | Purpose                                        | Lifetime              | Stored in                           |
| ----------------- | ---------------------------------------------- | --------------------- | ----------------------------------- |
| **Access Token**  | Used in every API call to authenticate user    | Short (e.g., 15 mins) | Sent in `Authorization` header      |
| **Refresh Token** | Used to get a new access token when it expires | Long (e.g., 7 days)   | Stored securely in HTTP-only cookie |

---

## 🧩 Step 1 — Login Controller (Token Creation)

In your login controller:

```ts
const payload = {
  id: user._id.toString(),
  email: user.email,
  username: user.username,
  role: user.role,
};
```

This `payload` is what will be encoded inside your JWT — it’s **the actual data** that lives inside the token.

---

### 🔐 Access Token

```ts
const accessToken = await signAccessToken(payload);
```

The function:

```ts
export const signAccessToken = async (payload: JwtPayload) => {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.id)
    .setIssuedAt()
    .setExpirationTime(ENV.ACCESS_TOKEN_EXPIRES_IN || "15m")
    .sign(accessSecretKey);
};
```

This creates a **digitally signed** JWT string.

A JWT has 3 parts:

```
xxxxx.yyyyy.zzzzz
```

| Part          | Description              | Example Content                                                         |
| ------------- | ------------------------ | ----------------------------------------------------------------------- |
| **Header**    | Metadata about the token | `{ "alg": "HS256", "typ": "JWT" }`                                      |
| **Payload**   | Your actual data         | `{ "id": "64ff...", "email": "...", "role": "user", "sub": "64ff..." }` |
| **Signature** | Cryptographic proof      | Created using your secret key                                           |

So, after signing, you get a token like this:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.
eyJpZCI6IjY0ZmYiLCJlbWFpbCI6ImFsaWNlQGV4YW1wbGUuY29tIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3MzY4MDA0NDgsImV4cCI6MTczNjgwMTM0OCwic3ViIjoiNjRmZiJ9.
mXyRXYfO3cX98h2Kc64cQj-fCkKcbQcbpJ6dxzRhMMk
```

That string is the **JWT access token**.

---

### 🍪 Refresh Token

You also create a refresh token similarly:

```ts
const refreshToken = await signRefreshToken(payload);
```

This has the same payload, but longer expiry (e.g., `7d`)
and is signed with a **different secret key**.

You store this token:

- In the **database** (to validate later)
- As an **HTTP-only cookie** on the client:

```ts
res.cookie("refreshToken", refreshToken, cookieOptions());
```

This prevents JavaScript from reading it (defends against XSS).

---

## 🧠 Step 2 — Client Receives Tokens

Your backend responds:

```json
{
  "success": true,
  "message": "Welcome back, Alice!",
  "user": {
    "id": "64ff...",
    "name": "Alice",
    "email": "alice@example.com",
    "role": "user"
  },
  "accessToken": "<JWT_STRING>"
}
```

✅ The frontend:

- Stores `accessToken` in memory or secure storage (not localStorage if possible).
- Automatically gets `refreshToken` in the cookie.

---

## 🚀 Step 3 — Client Sends Token in Header

When the frontend calls a protected route (like `/api/habits`),
it sends the access token like this:

```
GET /api/habits HTTP/1.1
Host: your-api.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

This is called a **Bearer Token Authorization Header**.

---

## 🧩 Step 4 — `protect` Middleware (Token Verification)

Your middleware extracts and verifies it:

```ts
if (req.headers.authorization?.startsWith("Bearer ")) {
  token = req.headers.authorization.split(" ")[1];
}
```

Then it verifies:

```ts
const decoded = await verifyAccessToken(token);
```

### Inside `verifyAccessToken()`:

```ts
export const verifyAccessToken = async (token: string) => {
  const { payload } = await jwtVerify(token, accessSecretKey);
  return payload as JWTPayload;
};
```

Here’s what happens:

1. `jwtVerify` splits the token into header, payload, and signature.
2. It checks that:
   - The signature is valid (`HS256` algorithm, same secret key).
   - The token hasn’t expired (`exp` > current time).

3. If valid → returns the decoded payload:

```js
{
  id: "64ff...",
  email: "alice@example.com",
  username: "alice",
  role: "user",
  sub: "64ff...",
  iat: 1736800448,
  exp: 1736801348
}
```

---

## 🔗 Step 5 — Attach to Request

Middleware attaches that payload to `req.user`:

```ts
req.user = {
  id: decoded.id,
  email: decoded.email,
  username: decoded.username,
  role: decoded.role,
};
```

Now any route handler can access it:

```ts
const userId = req.user.id; // logged-in user's ID
```

No database query required — it’s _decoded directly from the token_.

---

## 🔄 Step 6 — Expired Access Token → Refresh Flow

If the token is expired:

```ts
if (error instanceof jose.errors.JWTExpired) {
  return next(CustomError.Unauthorized("Access token expired. Please refresh."));
}
```

Frontend detects this and calls:

```
POST /api/auth/refresh
```

That endpoint:

- Reads the `refreshToken` from cookies
- Verifies it (`verifyRefreshToken`)
- Issues new `accessToken` and `refreshToken`
- Updates DB and cookies

✅ This ensures:

- Users don’t need to log in again
- Short-lived access tokens protect against replay attacks

---

## 🧠 In Summary

| Stage | Component                                           | Description                              |
| ----- | --------------------------------------------------- | ---------------------------------------- |
| 1️⃣    | `signAccessToken(payload)`                          | Signs short-lived JWT with secret key    |
| 2️⃣    | `res.cookie("refreshToken")`                        | Stores refresh token securely            |
| 3️⃣    | Frontend sets `Authorization: Bearer <accessToken>` | Sends access token in every request      |
| 4️⃣    | `verifyAccessToken()`                               | Verifies and decodes token on backend    |
| 5️⃣    | `req.user = decoded`                                | Attaches user info for controllers       |
| 6️⃣    | `verifyRefreshToken()`                              | Rotates tokens when access token expires |

---

## 🔐 Visualization

```text
[ User Login ] → generates payload
   ↓
[ signAccessToken(payload) ]
   ↓
{ header, payload, signature }  ← JWT created
   ↓
[ Client stores accessToken ]
   ↓
[ Sends Bearer token with request ]
   ↓
[ protect middleware ]
   ↓
jwtVerify(token, secret)
   ↓
req.user = decoded payload
   ↓
Controller executes as authenticated user
```

---

### ✅ TL;DR — “How it Works”

- The **header** defines how the JWT is signed.
- The **payload** contains your custom data (id, role, etc.).
- The **signature** guarantees authenticity (nobody can forge it without your secret).
- The **Bearer header** carries the token between frontend ↔ backend.
- The **middleware** verifies the token and makes the user info available via `req.user`.
