Let’s go step by step and see **why `userId` is `undefined`**, even though your refresh token should include the user’s ID 👇

---

## 🧩 The Problem

You wrote this in your refresh controller:

```ts
const decoded = await verifyRefreshToken(cookieToken);
const userId = decoded.id as string;
```

And `userId` is coming out as `undefined`.

---

## 🧠 Why It Happens

The problem is that when you **sign your JWT**, you never actually include `id` inside the payload.

### Here’s your current `signRefreshToken` function:

```ts
export const signRefreshToken = async (payload: JwtPayload) => {
  return new SignJWT({ role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.id) // ✅ you put user ID in "sub"
    .setIssuedAt()
    .setExpirationTime(ENV.REFRESH_TOKEN_EXPIRES_IN || "7d")
    .sign(refreshSecretKey);
};
```

→ You’re storing the user ID in the **JWT subject (`sub`)**,
not as a field named `"id"` in the payload.

So when you later verify the token:

```ts
const { payload } = await jwtVerify(token, refreshSecretKey);
return payload as JWTPayload;
```

The returned `payload` looks something like this:

```js
{
  role: "user",
  iat: 1731046210,
  exp: 1731651010
  // ❌ no "id" key here
  // ✅ but there is a "sub" property in the outer JWT (accessible as payload.sub)
}
```

That’s why `decoded.id` is `undefined`.

---

## ✅ The Fix

You have **two good options**, depending on how you prefer to structure your tokens.

---

### **Option 1 (Recommended): Use `payload.sub`**

Since `sub` (subject) is the standard JWT claim for user identity,
you can just read it like this:

```ts
const decoded = await verifyRefreshToken(cookieToken);
const userId = decoded.sub as string; // ✅ fixed
```

This is perfectly standard and semantically correct.

---

### **Option 2: Explicitly include `id` in payload**

If you prefer to keep using `decoded.id`, modify your `signRefreshToken` and `signAccessToken` functions to include the `id` in the payload explicitly.

```ts
export const signRefreshToken = async (payload: JwtPayload) => {
  return new SignJWT({ id: payload.id, role: payload.role }) // ✅ add id here
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(ENV.REFRESH_TOKEN_EXPIRES_IN || "7d")
    .sign(refreshSecretKey);
};
```

Then your existing code works unchanged:

```ts
const decoded = await verifyRefreshToken(cookieToken);
const userId = decoded.id as string; // ✅ now defined
```

---

## 🧩 TL;DR Summary

| Issue                     | Cause                                                | Fix                                            |
| ------------------------- | ---------------------------------------------------- | ---------------------------------------------- |
| `userId` is `undefined`   | You put `id` in `sub` claim, not payload             | Use `decoded.sub` instead                      |
| Want to keep `decoded.id` | You need to add `id` field explicitly to JWT payload | Add `id` to `SignJWT({ id: payload.id, ... })` |

---

## ✅ Best Practice Recommendation

Use the standard JWT field `.sub` for user identity.
It’s cleaner and aligns with RFC 7519 (the JWT spec).

So your **refresh controller** should look like this:

```ts
const decoded = await verifyRefreshToken(cookieToken);
const userId = decoded.sub as string; // ✅ correct
```

---

## ✅ Example Logged Output

If you console.log the decoded payload, you’ll see:

```ts
console.log(decoded);
// Output:
{
  role: "user",
  sub: "670f3e351577634f14b24ea3",
  iat: 1731046210,
  exp: 1731651010
}
```

So `decoded.sub` is exactly your user ID.

---

### ✅ Final Recommendation

✔ Use `sub` consistently for user ID
✔ Update your refresh controller to `const userId = decoded.sub as string;`
✔ Keep your JWT clean and standards-compliant

---
