---
description: Drizzle ORM and Database standards.
---

# 🗄️ Drizzle ORM Guidelines

## Stack
*   **Database**: Neon Postgres
*   **ORM**: Drizzle ORM

## Rules
1.  **Schema First**: Define all tables in `src/db/schema.ts` (or relevant location).
2.  **Type Safety**: Use Drizzle's type inference. Do not manually type query results effectively if Drizzle can do it for you.
3.  **No Raw SQL**: logical queries should be built using the Drizzle query builder (`db.select()...`). Avoid `sql` template tags unless performing complex aggregations logic not supported by the builder.
4.  **Migrations**: Changes to schema require generating a migration: `pnpm drizzle-kit generate` (or project equivalent command).

## Example Pattern
```typescript
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getUser(id: number) {
  const result = await db.query.users.findFirst({
    where: eq(users.id, id),
  });
  return result;
}
```
