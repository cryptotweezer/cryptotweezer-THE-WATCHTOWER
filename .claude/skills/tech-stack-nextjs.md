---
description: Next.js 16+ coding standards and patterns.
---

# ⚛️ Next.js 16+ Standards

Required patterns for this Next.js 16.1.3+ project.

## Core Rules
1.  **Server Components Default**: Use Server Components by default. Only add `'use client'` when you absolutely need interactivity (hooks, event listeners).
2.  **Server Actions**: Use Server Actions for all data mutations. Do not use API routes unless necessary for external webhooks.
3.  **Async Params**: In Next.js 15/16+, `params` and `searchParams` in pages/layouts are **Promises**. You must `await` them.
    *   *Correct*: `const { slug } = await params;`
    *   *Incorrect*: `const { slug } = params;`

## Styling
1.  **Tailwind CSS**: Use utility classes.
2.  **Shadcn UI**: Use the existing UI components in `src/components/ui`.
3.  **No Generic Styles**: Avoid writing raw CSS modules or global styles unless absolutely unique.

## Security
1.  **Zero Trust**: Validate all inputs in Server Actions using Zod.
2.  **Arcjet WAF**: Ensure Arcjet protection is respected (do not bypass middleware).
