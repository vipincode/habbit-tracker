## ✅ `Request` Type Parameters (from `@types/express`)

The Express `Request` type has **four generic parameters** in this exact order:

```ts
Request<
  P = core.ParamsDictionary,  // 1️⃣ Route params (e.g. /user/:id → { id: string })
  ResBody = any,              // 2️⃣ Response body type (what you send back)
  ReqBody = any,              // 3️⃣ Request body type (what client sends)
  ReqQuery = ParsedQs         // 4️⃣ Query params (?page=1 → { page: string })
>
```

---

## 📘 Example Breakdown

Let’s take this route:

```ts
app.post("/users/:id", (req, res) => {
  // ...
});
```

If you want to strongly type everything:

```ts
import { Request, Response } from "express";
import { IUser } from "../models/User";

interface Params {
  id: string;
}

interface Query {
  includePosts?: string;
}

type CreateUserRequest = Request<Params, any, IUser, Query>;
```

That means:

| Generic Position | Purpose       | Example Value               | Description                      |
| ---------------- | ------------- | --------------------------- | -------------------------------- |
| `P`              | Route params  | `{ id: string }`            | from `/users/:id`                |
| `ResBody`        | Response body | `any`                       | type of `res.json(...)` you send |
| `ReqBody`        | Request body  | `IUser`                     | type of incoming `req.body`      |
| `ReqQuery`       | Query string  | `{ includePosts?: string }` | from URL query                   |

---

## ✅ Example in Use

```ts
const createUser = async (
  req: Request<{}, {}, IUser>, // ⬅️ no route params, no query params
  res: Response
) => {
  const user = req.body; // ✅ fully typed as IUser
  // ...
};
```

Another with params and query:

```ts
const getUser = async (
  req: Request<{ id: string }, {}, {}, { includePosts?: string }>,
  res: Response
) => {
  const { id } = req.params; // string
  const { includePosts } = req.query; // string | undefined
};
```

---

## ⚡️ Summary

| Index | Parameter  | Description   | Example               |
| ----- | ---------- | ------------- | --------------------- |
| 1     | `P`        | Path params   | `{ id: string }`      |
| 2     | `ResBody`  | Response body | `any`                 |
| 3     | `ReqBody`  | Request body  | `IUser`               |
| 4     | `ReqQuery` | Query params  | `{ search?: string }` |

---

### ✅ Common Shorthand

If you just want to type the request body (no params/query):

```ts
Request<{}, {}, IUser>;
```

If you want params + body:

```ts
Request<{ id: string }, {}, IUser>;
```

If you want all 4:

```ts
Request<{ id: string }, { success: boolean }, IUser, { includePosts?: string }>;
```
