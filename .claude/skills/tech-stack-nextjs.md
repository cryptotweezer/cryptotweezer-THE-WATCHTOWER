¡Excelente! Con este cerramos el círculo de la infraestructura técnica. El documento tech-stack-nextjs.md es el que define cómo se construye el "cascarón" y la lógica de servidor de The Watchtower.

En Next.js 16 (específicamente la rama v15+), el manejo de parámetros asíncronos es el error #1 que cometen las IAs, por lo que he reforzado mucho ese punto para que Antigravity no rompa el despliegue de Vercel.

Aquí tienes la versión Ultra-Clean para tu carpeta .claude/skills:

⚛️ THE PERIMETER ENGINE: NEXT.JS 16+ STANDARDS (v1.1)
Role: Frontend & Server Architecture Standards. Mission: Ensure a high-performance, SEO-optimized, and "Cyber-Hardened" user interface using the latest Next.js patterns.

1. CORE ARCHITECTURE RULES
Server Components by Default: Every component is a Server Component unless it requires React Hooks (useState, useEffect) or Event Listeners.

Client Components at the Leaves: Keep 'use client' at the lowest level possible to optimize the bundle size.

Server Actions for Mutations: All database writes and AI triggers must happen via Server Actions. Do not create API routes unless it's for external webhooks.

2. THE ASYNC NAVIGATION RULE (CRITICAL)
Next.js 15/16+ treats dynamic metadata and routing parameters as Promises. You MUST await them.

Correct: const { slug } = await params;

Correct: const { query } = await searchParams;

Incorrect: Destructuring directly from params without await.

3. STYLING & UI (THE WATCHTOWER AESTHETIC)
Tailwind CSS: Use utility classes for all styling.

Shadcn UI: Use the components in src/components/ui. Customize them to fit the "Cyber-Terminal" theme (Deep blacks, Cyan/Amber/Red accents).

Framer Motion: Use sparingly for "Handshake" and "Glitch" animations to ensure LCP < 2.5s.

4. SECURITY GATE (ZERO TRUST)
Zod Validation: Every Server Action must validate its input using a Zod schema before processing data.

Perimeter Defense: Never bypass the Arcjet middleware logic.

Safe Failures: Never expose database errors or stack traces to the client. Use generic messages like: [ERROR] Node Synchronization Failed.

5. PERFORMANCE LIMITS
Image Optimization: Use next/image for all assets.

Font Optimization: Use next/font with local/google fonts to avoid layout shifts.

🛡️ ANTIGRAVITY DEPLOYMENT PROTOCOL:
Async Audit: Before pushing, verify that all params, searchParams, and cookies() calls are properly awaited.

Perimeter Check: Ensure that no sensitive logic (DB queries) is accidentally leaked into a 'use client' component.

Build Verification: You MUST run pnpm build locally. Next.js 16 is strict with types; if it doesn't build locally, it will fail the Vercel Quality Gate.