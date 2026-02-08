🏛️ WAR-ROOM.MD: THE GLOBAL COMMAND CENTER (GCC) BIBLE
1. FILOSOFÍA Y ESTÉTICA (THE VIBE)
Identidad: El War Room es la extensión forense del Sentinel. Estética CRT/Terminal, fondo #000000, líneas de escaneo y tipografía monospace.

Layout Táctico: 3 columnas fijas (SPA), sin scroll, 100% de ocupación visual.

Header: THE WATCHTOWER // GLOBAL COMMAND CENTER (GCC).

2. REGLAS DE ORO (LECCIONES DE LA SESIÓN ANTERIOR)
REGLA 1: La DB es la Única Verdad (SSoT). El Sentinel no debe tener "cerebro de pez". Prohibido inicializar el score en 0 si el usuario ya existe. Antes de cualquier acción, se realiza un Hydration Step desde Neon.

REGLA 2: Guerra de Middlewares. Para evitar el error 404, la lógica de Arcjet, Clerk y Sentinel debe vivir en un único archivo de control (según la exigencia del compilador, usar proxy.ts o middleware.ts sin duplicidad).

REGLA 3: Sincronización Atómica. Cada evento de riesgo se actualiza en tiempo real en la UI (Optimistic UI) pero se persiste inmediatamente en Neon vía Server Actions.

REGLA 4: Nada de nombres genéricos. No existe el "User Dossier". Usaremos nombres técnicos: SUBJECT_METADATA_STREAM, IDENTITY_PROVENANCE, etc.

3. NAVEGACIÓN Y VISTAS (MODULAR)
Sidebar (Izquierda): Texto puro.

[ALIAS_DINÁMICO] -> Abre la metadata del sujeto.

GLOBAL INTELLIGENCE -> Mapa y telemetría mundial.

CONTACT DEV -> El Honeypot (The Success Trap).

Sentinel Chat: Ventana flotante omnipresente. El Sentinel te sigue a todas las vistas.

4. LAS 4 OPERACIONES ESPECIALES (HONEYPOTS)
Las ranuras tácticas en el dossier se activan por detección de patrones:

DEEP DRILL: Inyección SQL (Detectada en el formulario de contacto).

DARKSIDE: Vectores XSS.

MIDNIGHT HAMMER: Fuerza bruta detectada por Arcjet.

SILENT SCANNER: Detección de herramientas (User-Agent de Kali, Nmap, Burp).

5. ROADMAP DE IMPLEMENTACIÓN ATÓMICA (PASO A PASO)
BLOQUE A: Cimientos y Persistencia (Prioridad Máxima)

[ ] Tarea A.1: Unique Middleware. Fusionar Clerk y Arcjet en un solo archivo de control para eliminar errores 404.

[ ] Tarea A.2: DB Hydration. Refactorizar SentinelContext para que el riskScore y el CID se recuperen de Neon al montar la app.

[ ] Tarea A.3: Clerk-Neon Handshake. Vincular el user_id de Clerk con el registro criminal del usuario.

BLOQUE B: Shell Visual y Sidebar

[ ] Tarea B.1: Grid Layout. Crear el esqueleto de 3 columnas en /war-room.

[ ] Tarea B.2: Sidebar Dinámica. Implementar la navegación por texto con el Alias editable (EDIT_ALIAS >).

BLOQUE C: Inteligencia y Engaño

[ ] Tarea C.1: Ghost Map. Mapa de contorno blanco con pulsos azules en ataques.

[ ] Tarea C.2: The Success Trap. Formulario de contacto que devuelve JSON falso ante ataques de inyección.

🛡️ NOTA PARA ANTIGRAVITY:
No intentes realizar múltiples tareas de diferentes bloques simultáneamente. La prioridad es la Tarea A.1 y A.2. El sistema debe ser estable y persistente antes de construir la interfaz visual.