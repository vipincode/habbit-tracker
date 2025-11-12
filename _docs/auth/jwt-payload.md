**Question:** Look this these values where comes from
Actually I want to know how this work

```terminal
   req.user = {
      id: decoded.id,
      email: decoded.email,
      username: decoded.username,
      role: decoded.role,
    } as JwtPayload;
```

---

## 🧩 The Short Answer

These values come from the **JWT (JSON Web Token)** that your server creates during **login** —
specifically from the **payload you include when signing the token**.

---

## 🧠 Let’s walk through the full lifecycle step-by-step

---

### **1️⃣ User logs in**

In your login controller:

```ts
const payload = {
  id: user._id.toString(),
  email: user.email,
  username: user.username,
  role: user.role,
};

const accessToken = await signAccessToken(payload);
```

Here you’re literally **defining what data** will be encoded inside the JWT.

✅ So your payload looks like:

```json
{
  "id": "654b3f1c2a...",
  "email": "alice@example.com",
  "username": "alice",
  "role": "user"
}
```

---

### **2️⃣ The JWT is created (`signAccessToken`)**

In your `utils/jwt.ts`:

```ts
export const signAccessToken = async (payload: JwtPayload) => {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(accessSecret);
};
```

Here’s what happens internally:

| Step | What happens                                                              |
| ---- | ------------------------------------------------------------------------- |
| 1️⃣   | The payload (`id`, `email`, `username`, `role`) is attached to the token. |
| 2️⃣   | A header is added (algorithm info).                                       |
| 3️⃣   | The whole thing is signed with your secret (`accessSecret`).              |

✅ Result:
The token might look like this:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.
eyJpZCI6IjY1NGIzZjFjMmEiLCJlbWFpbCI6ImFsaWNlQGV4YW1wbGUuY29tIiwidXNlcm5hbWUiOiJhbGljZSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzM2NzY1MzYwLCJleHAiOjE3MzY3NjYyNjB9.
jH6bCehFb6r8zRll1W7PDr1UFehU0VDVq...
```

This is what’s sent to the **client** (frontend).

---

### **3️⃣ Client sends token with each request**

Frontend stores this token (e.g. in memory or localStorage)
and sends it in the Authorization header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### **4️⃣ The backend receives the token**

In your middleware `protect`:

```ts
if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
  token = req.headers.authorization.split(" ")[1];
}
```

You extract that raw token string from the request.

---

### **5️⃣ The token is verified**

```ts
const decoded = await verifyAccessToken(token);
```

And in your `verifyAccessToken()` function:

```ts
const { payload } = await jwtVerify(token, accessSecret);
const decoded = payload as JwtPayload;
```

✅ The `jwtVerify()` function:

- Checks the token’s signature using your secret key.
- If valid, **returns the decoded payload** (the same one you encoded during login).

So now:

```ts
decoded = {
  id: "654b3f1c2a...",
  email: "alice@example.com",
  username: "alice",
  role: "user",
  iat: 1736765360,
  exp: 1736766260,
};
```

---

### **6️⃣ You attach it to the request object**

```ts
req.user = {
  id: decoded.id,
  email: decoded.email,
  username: decoded.username,
  role: decoded.role,
} as JwtPayload;
```

✅ This means:

- You’re taking those decoded fields and assigning them to `req.user`.
- Every controller that runs **after this middleware** can now safely access:

  ```ts
  req.user.id;
  req.user.email;
  req.user.role;
  ```

---

### **7️⃣ Example Usage**

In your habit controller:

```ts
const userId = req.user.id;
const habit = await Habit.create({
  userId,
  name,
  description,
  frequency,
  targetCount,
});
```

Now `userId` comes directly from the authenticated user’s token.

✅ No client tampering
✅ Guaranteed to match the logged-in user
✅ Fully type-safe with your `JwtPayload` interface

---

## 🔁 In Summary

| Step  | Description                           | Example Data                              |
| ----- | ------------------------------------- | ----------------------------------------- |
| **1** | User logs in → Backend builds payload | `{ id, email, username, role }`           |
| **2** | Backend signs JWT with secret         | `SignJWT(payload).sign(secret)`           |
| **3** | Client gets token, stores it          | `"Bearer <token>"`                        |
| **4** | Client sends token in headers         | `Authorization: Bearer ...`               |
| **5** | Backend verifies token                | `jwtVerify(token, secret)`                |
| **6** | Payload is extracted                  | `decoded = { id, email, username, role }` |
| **7** | Middleware sets `req.user`            | Used in all protected routes              |

---

### 🔒 Why This Design Is Perfect

✅ **Stateless** → You don’t have to query the DB for every request.
✅ **Tamper-proof** → Signed by your server, can’t be faked.
✅ **Fast** → Auth check is just one cryptographic verify.
✅ **Extendable** → You can add more fields (e.g., `organizationId`, `permissions`) to the token easily.

---

### 🧠 Visualization

```text
[ User Login ]
     ↓
  Build payload (id, email, username, role)
     ↓
  ┌───────────────┐
  │  SignJWT()    │
  │  (creates JWT)│
  └───────────────┘
     ↓
  Client stores token
     ↓
[ Authenticated Request ]
     ↓
  Middleware verifyAccessToken()
     ↓
  payload → { id, email, username, role }
     ↓
  req.user = payload
     ↓
[ Controller uses req.user.id ]
```

---

**inspect the decoded JWT manually** (e.g. using `jwt.io` or `console.log(decoded)` inside your `verifyAccessToken`) so you can actually _see_ those fields in action?
