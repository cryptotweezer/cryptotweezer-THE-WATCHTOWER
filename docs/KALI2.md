# KALI CID Phase 2 Refinement — Plan Final de Implementacion

> **Creado**: 2026-02-11
> **Base**: Analisis de `KALI_CID_FASE2.md` (plan usuario) + auditoria completa del codigo
> **Scope**: 3 features del Roadmap (Testing Guide linea 610+)
> **Metodologia**: Pasos granulares, verificables, con log de progreso

---

## PARTE 1: EVALUACION DEL PLAN ORIGINAL (KALI_CID_FASE2.md)

### Lo que esta bien
- **Polling es la decision correcta** — No hay infraestructura WebSocket, Edge runtime no lo soporta bien, y 4-5s de latencia es aceptable para este caso de uso.
- **Separacion en 3 bloques** (Backend sync, Frontend reactivity, Terminal ASCII) es logica.
- **Validacion de identidad en el sync endpoint** es critica y esta bien identificada.

### Lo que necesita ajustes

| Punto del plan original | Problema | Solucion |
|---|---|---|
| `latestEvent` singular en sync | Si llegan 3 ataques entre polls, solo veriamos 1 | Devolver array de eventos con cursor `since` |
| Llamar `triggerSentinel("EXT_ATTACK_DETECTED")` | Esto pasa por `/api/sentinel` que hace scoring + logging en DB. Duplicaria el evento ya logueado por `/api/sentinel/external` | Agregar bypass en `/api/sentinel` para `EXT_ATTACK_INTERCEPTED`: skip DB logging y scoring, solo generar narrativa |
| Polling siempre activo para autenticados | Desperdicia requests para usuarios sin CID (no pueden recibir ataques externos) | Solo hacer polling cuando `state.cid` es valido (risk >= 20%) |
| Sin mencion de pausa al ocultar tab | Polling innecesario si el usuario no esta mirando | Pausar con `document.visibilitychange` |
| 4 pasos de ejecucion | Muy grueso para debugging seguro (leccion de Phase 1) | Desglosado en ~15 sub-pasos con verificacion individual |
| No detalla como inyectar el Sentinel message en el chat | El War Room tiene su propio sistema de chat (`chatMessages` state local) que captura `state.history` | Usar `triggerSentinel()` existente — el War Room ya captura cambios en `state.history` automaticamente via useEffect (linea 107-117 de WarRoomShell) |
| Sin mencion del Home page | El Home tambien deberia mostrar alertas de ataques externos | El polling corre en `SentinelContext` (global), beneficia ambas paginas |

### Conclusion
El plan original tiene la estrategia correcta pero necesita mas granularidad y algunos ajustes tecnicos. Este documento es la version refinada.

---

## PARTE 2: DECISIONES DE ARQUITECTURA

### D1: Polling vs SSE vs WebSocket
**Decision: Polling cada 5 segundos**
- Edge runtime no soporta WebSockets nativamente
- SSE requiere conexion persistente (complicacion con Vercel serverless)
- 5 segundos de latencia es aceptable para "casi tiempo real"
- Polling es simple, debuggeable, y resistente a reconexiones

### D2: Como generar la narrativa del Sentinel para el defensor
**Decision: Usar `triggerSentinel()` existente con event type especial**
- Event type: `EXT_ATTACK_INTERCEPTED`
- Se agrega a `NON_UNIQUE_EVENTS` (para permitir multiples triggers)
- `skipRisk: true` — el scoring ya se hizo en `/api/sentinel/external`
- En `/api/sentinel/route.ts`, se agrega bypass para este event type: skip DB logging y score update, solo generar respuesta GPT-4o
- El system prompt recibe un nuevo SCENARIO con instrucciones para 2-3 parrafos desde perspectiva del defensor

**Por que no un endpoint nuevo?**: Reutilizar la infraestructura existente minimiza archivos nuevos y bugs. El streaming ya funciona, `state.history` ya se captura en War Room y Home.

### D3: Donde vive el estado de operations para real-time updates
**Decision: Agregar `operations` al state de SentinelContext**
- Actualmente: `operations` se pasa como prop separado a WarRoomShell desde el server component
- Problema: server props no se actualizan sin page refresh
- Solucion: SentinelContext trackea operations. Se hidrata desde server en mount, se actualiza desde polling
- WarRoomShell lee de context en vez de (o ademas de) las props

### D4: Sync endpoint authentication
**Decision: Usar cookie `watchtower_node_id` directamente**
- La cookie es set por middleware, persiste 1 ano
- El endpoint parsea la cookie desde el header `cookie` del request (compatible Edge runtime)
- NO se acepta fingerprint como query parameter (evita que alguien espie otra sesion)

### D5: Multiples ataques entre polls
**Decision: Actualizar estado con todos, trigger Sentinel solo una vez**
- Si el sync devuelve 3 nuevos eventos EXT_*, todos se agregan al eventLog
- Solo el mas reciente dispara `triggerSentinel()` (para evitar 3 llamadas GPT-4o)
- El risk score se actualiza al valor actual de la DB (ya acumulado)

### D6: Orden de implementacion
```
FASE A (Terminal ASCII)  → Aislado, 0 dependencias, testeable con curl
FASE B (Sync Backend)    → Crea el endpoint de sync
FASE C (Frontend Polling) → Conecta polling + state updates
FASE D (Sentinel Narrative) → Genera respuesta del Sentinel para el defensor
FASE E (UI Polish)        → Colores, animaciones, detalles visuales
FASE F (Testing)          → Integracion completa
```

---

## PARTE 3: IMPLEMENTACION — FASE A (Terminal ASCII Refinements)

> **Scope**: Solo toca `src/app/api/sentinel/external/route.ts`
> **Riesgo**: BAJO — cambios aislados, no afectan al frontend
> **Testeo**: `curl` directo al endpoint

---

### A1: Crear constante ASCII Banner "THE WATCHTOWER"
**Archivo**: `src/app/api/sentinel/external/route.ts`
**Cambio**: Agregar constante `WATCHTOWER_BANNER` al inicio del archivo (despues de imports)

```
 _____ _   _ _____  __        ___  _____ ____ _   _ _____ _____        _______ ____
|_   _| | | | ____| \ \      / / \|_   _/ ___| | | |_   _/ _ \ \      / / ____|  _ \
  | | | |_| |  _|    \ \ /\ / / _ \ | || |   | |_| | | || | | \ \ /\ / /|  _| | |_) |
  | | |  _  | |___    \ V  V / ___ \| || |___|  _  | | || |_| |\ V  V / | |___|  _ <
  |_| |_| |_|_____|    \_/\_/_/   \_\_| \____|_| |_| |_| \___/  \_/\_/  |_____|_| \_\
```

**Verificacion**:
- [ ] `pnpm build` pasa
- [ ] No se usa aun (solo constante)

**Notas de desarrollo**:
> _(escribir aqui al completar)_

---

### A2: Refactorizar `buildAsciiResponse` — Eliminar metricas numericas
**Archivo**: `src/app/api/sentinel/external/route.ts`
**Cambio**: Modificar la funcion `buildAsciiResponse` para:
- ELIMINAR linea `Risk Score: ${data.oldScore}% -> ${data.newScore}%`
- ELIMINAR linea `Unique External Techniques: ${data.externalCount}/3`
- AGREGAR campo `alias` al parametro `data`
- AGREGAR linea `Subject: ${data.alias}` (el alias del atacante)
- Actualizar la interfaz del parametro para reflejar los campos eliminados/agregados

**Verificacion**:
- [ ] `pnpm build` pasa
- [ ] `curl` muestra response sin Risk Score ni Technique count
- [ ] `curl` muestra alias del atacante

**Notas de desarrollo**:
> _(escribir aqui al completar)_

---

### A3: Agregar status narrativo de Operation Desert Storm
**Archivo**: `src/app/api/sentinel/external/route.ts`
**Cambio**: En `buildAsciiResponse`, reemplazar el `milestone` simple con status narrativo basado en `externalCount`:

```
externalCount === 1 → "OPERATION DESERT STORM: INITIATED"
externalCount === 2 → "OPERATION DESERT STORM: IN PROGRESS (66%)"
externalCount >= 3  → "OPERATION DESERT STORM: UNLOCKED"
```

Modificar en la funcion POST tambien la logica de `milestone` para usar estos nuevos textos.

**Verificacion**:
- [ ] `pnpm build` pasa
- [ ] 1er ataque: response muestra `INITIATED`
- [ ] 2do ataque: response muestra `IN PROGRESS (66%)`
- [ ] 3er ataque: response muestra `UNLOCKED`

**Notas de desarrollo**:
> _(escribir aqui al completar)_

---

### A4: Expandir mensajes a 2-3 parrafos por tecnica
**Archivo**: `src/app/api/sentinel/external/route.ts`
**Cambio**: Reescribir `SENTINEL_LINES` para que cada tecnica tenga mensajes de 2-3 parrafos. Cada mensaje debe:
- Parrafo 1: Describir que se detecto con sarcasmo tecnico
- Parrafo 2: Burlarse del atacante usando su alias
- Parrafo 3 (opcional): Referencia a operaciones o advertencia

El parametro `alias` debe ser interpolado en los mensajes. Cambiar `getSentinelMessage(technique)` a `getSentinelMessage(technique, alias)`.

**Verificacion**:
- [ ] `pnpm build` pasa
- [ ] `curl` muestra mensajes largos (2-3 parrafos)
- [ ] El alias del atacante aparece en el mensaje
- [ ] Cada tecnica tiene al menos 2 variaciones

**Notas de desarrollo**:
> _(escribir aqui al completar)_

---

### A5: Integrar banner en la respuesta final
**Archivo**: `src/app/api/sentinel/external/route.ts`
**Cambio**: En la funcion `POST` (y `GET`), prepend el `WATCHTOWER_BANNER` antes del ASCII box:

```typescript
const fullResponse = WATCHTOWER_BANNER + "\n\n" + ascii;
return new Response(fullResponse, { ... });
```

**Verificacion**:
- [ ] `pnpm build` pasa
- [ ] `curl` muestra banner completo + caja ASCII
- [ ] La caja ASCII tiene: CID, Technique, Subject alias, Status narrativo, Mensaje largo
- [ ] NO tiene: Risk Score numerico, Technique count

**Notas de desarrollo**:
> _(escribir aqui al completar)_

---

## PARTE 4: IMPLEMENTACION — FASE B (Sync Endpoint Backend)

> **Scope**: Crear endpoint `/api/sentinel/sync` + hacer publico en middleware
> **Riesgo**: BAJO — endpoint nuevo, no modifica logica existente

---

### B1: Crear `/api/sentinel/sync/route.ts`
**Archivo**: `src/app/api/sentinel/sync/route.ts` [NUEVO]
**Runtime**: Edge

**Logica**:
1. Parsear cookie `watchtower_node_id` del header `cookie` del request
2. Si no hay cookie → return 401
3. Parsear query param `since` (ISO timestamp)
4. Query `userSessions` por fingerprint → obtener riskScore, operations, counts
5. Si `since` existe, query `securityEvents` WHERE fingerprint = X AND timestamp > since, ORDER BY timestamp DESC, LIMIT 10
6. Construir risk cap dinamico desde operations

**Response JSON**:
```json
{
    "events": [
        {
            "id": "uuid",
            "eventType": "EXT_SQLI",
            "timestamp": "2026-02-11T...",
            "payload": "' OR 1=1",
            "riskScoreImpact": 5,
            "route": "/search"
        }
    ],
    "riskScore": 55,
    "riskCap": 60,
    "operations": {
        "desertStorm": true,
        "overlord": false,
        "rollingThunder": false
    },
    "uniqueTechniqueCount": 5,
    "externalTechniqueCount": 3
}
```

**Headers de response**: `Cache-Control: no-store` (evitar cache del polling)

**Verificacion**:
- [ ] `pnpm build` pasa
- [ ] `curl` al endpoint con cookie valida devuelve JSON correcto
- [ ] `curl` sin cookie devuelve 401
- [ ] Con `?since=...` devuelve solo eventos posteriores

**Notas de desarrollo**:
> _(escribir aqui al completar)_

---

### B2: Agregar `/api/sentinel/sync` a rutas publicas en middleware
**Archivo**: `src/middleware.ts`
**Cambio**: Agregar `"/api/sentinel/sync"` al array de `isPublicRoute`

```typescript
const isPublicRoute = createRouteMatcher([
    // ... existing routes ...
    "/api/sentinel/sync",   // ← NUEVO
]);
```

**Verificacion**:
- [ ] `pnpm build` pasa
- [ ] El endpoint responde sin requerir auth de Clerk
- [ ] Todas las rutas existentes siguen funcionando

**Notas de desarrollo**:
> _(escribir aqui al completar)_

---

## PARTE 5: IMPLEMENTACION — FASE C (Frontend Polling + State Sync)

> **Scope**: Modificar `SentinelContext.tsx` para polling + state updates
> **Riesgo**: MEDIO — toca el state global del frontend
> **Nota**: Esta fase se divide en sub-pasos porque SentinelContext es critico

---

### C1: Agregar state de operations y lastSyncTime a SentinelContext
**Archivo**: `src/contexts/SentinelContext.tsx`
**Cambio**:
1. Agregar al interface `SentinelState`:
   ```typescript
   operations: {
       desertStorm: boolean;
       overlord: boolean;
       rollingThunder: boolean;
   };
   ```
2. Agregar state:
   ```typescript
   const [operations, setOperations] = useState({ desertStorm: false, overlord: false, rollingThunder: false });
   ```
3. Agregar ref:
   ```typescript
   const lastSyncTimeRef = useRef<string | null>(null);
   ```
4. Incluir `operations` en el value del context

**NO agregar polling todavia** — solo preparar el state.

**Verificacion**:
- [ ] `pnpm build` pasa
- [ ] App funciona normal (operations state no se usa aun)

**Notas de desarrollo**:
> _(escribir aqui al completar)_

---

### C2: Hidratar operations desde server en `hydrateFromServer`
**Archivo**: `src/contexts/SentinelContext.tsx`
**Cambio**: Agregar `operations` al `IdentityData` interface (opcional field) y hidratarlas en `hydrateFromServer`:

```typescript
// En IdentityData interface:
operations?: {
    desertStorm: boolean;
    overlord: boolean;
    rollingThunder: boolean;
};
```

En `hydrateFromServer`:
```typescript
if (serverIdentity.operations) {
    setOperations(serverIdentity.operations);
}
```

**Archivos adicionales a modificar**:
- `src/app/page.tsx`: Agregar `operations` al objeto identity (calcular desde session)
- `src/app/war-room/page.tsx`: Ya tiene operations por separado, agregar tambien al identity

**Verificacion**:
- [ ] `pnpm build` pasa
- [ ] SentinelContext.operations se hidrata correctamente al cargar

**Notas de desarrollo**:
> _(escribir aqui al completar)_

---

### C3: Implementar polling loop
**Archivo**: `src/contexts/SentinelContext.tsx`
**Cambio**: Agregar `useEffect` con `setInterval` para polling:

```typescript
useEffect(() => {
    // Guards: solo poll si hay identidad, CID valido, y pestaña visible
    if (!isHydrated) return;
    if (!cid || !cid.startsWith("CID-")) return;

    let isVisible = true;

    const handleVisibility = () => {
        isVisible = !document.hidden;
    };
    document.addEventListener("visibilitychange", handleVisibility);

    const poll = async () => {
        if (!isVisible) return;
        if (isStreamingRef.current) return; // No poll during active streaming

        try {
            const since = lastSyncTimeRef.current || new Date(Date.now() - 30000).toISOString();
            const res = await fetch(`/api/sentinel/sync?since=${encodeURIComponent(since)}`);
            if (!res.ok) return;

            const data = await res.json();
            lastSyncTimeRef.current = new Date().toISOString();

            // Update risk score if changed
            if (data.riskScore !== riskScoreRef.current) {
                setCurrentRiskScore(data.riskScore);
                riskScoreRef.current = data.riskScore;
                localStorage.setItem("sentinel_risk_score", data.riskScore.toString());
            }

            // Update operations if changed
            setOperations(data.operations);

            // Update unique technique count
            if (typeof data.uniqueTechniqueCount === "number") {
                setUniqueTechniqueCount(data.uniqueTechniqueCount);
            }

            // Process new events — handled in C4
        } catch (err) {
            console.error("[SYNC] Poll failed:", err);
        }
    };

    const interval = setInterval(poll, 5000);

    return () => {
        clearInterval(interval);
        document.removeEventListener("visibilitychange", handleVisibility);
    };
}, [isHydrated, cid]);
```

**Verificacion**:
- [ ] `pnpm build` pasa
- [ ] Abrir app, verificar en Network tab que se hace polling cada 5s
- [ ] Ocultar tab → polling se pausa
- [ ] Cambiar risk score manualmente en Neon → se refleja en UI sin refresh

**Notas de desarrollo**:
> _(escribir aqui al completar)_

---

### C4: Procesar nuevos eventos del sync (eventLog + trigger Sentinel)
**Archivo**: `src/contexts/SentinelContext.tsx`
**Cambio**: Dentro del callback `poll` (paso C3), despues de actualizar score y operations, procesar nuevos eventos:

```typescript
// Process new EXT_* events
if (data.events && data.events.length > 0) {
    const extEvents = data.events.filter(
        (e: { eventType: string }) => e.eventType.startsWith("EXT_")
    );

    if (extEvents.length > 0) {
        // Add ALL new events to the event log
        const newLogEntries = data.events.map((e: { timestamp: string; eventType: string }) => {
            const time = new Date(e.timestamp).toLocaleTimeString("en-US", { hour12: false });
            return `> [${time}] DETECTED: [${e.eventType}]`;
        });

        setEventLog(prev => {
            const merged = [...newLogEntries, ...prev];
            localStorage.setItem("sentinel_event_log", JSON.stringify(merged));
            return merged;
        });

        // Trigger Sentinel narrative for the MOST RECENT external event only
        const latest = extEvents[0]; // Already sorted DESC
        const attackPrompt = [
            `EXTERNAL ATTACK INTERCEPTED.`,
            `Technique: ${latest.eventType}.`,
            `Payload signature: "${(latest.payload || "classified").substring(0, 100)}".`,
            `Route targeted: ${latest.route || "perimeter"}.`,
            `Impact: +${latest.riskScoreImpact} risk points.`,
            `Address the defender. Mock the attacker's attempt. Be detailed (2-3 paragraphs).`
        ].join(" ");

        triggerSentinel(attackPrompt, "EXT_ATTACK_INTERCEPTED", true);
    }
}
```

**Prerequisito**: El event type `EXT_ATTACK_INTERCEPTED` debe estar en `NON_UNIQUE_EVENTS` (paso D1).

**Verificacion**:
- [ ] `pnpm build` pasa
- [ ] Enviar ataque curl → esperar 5s → log aparece en UI
- [ ] Sentinel genera respuesta narrativa en el chat

**Notas de desarrollo**:
> _(escribir aqui al completar)_

---

### C5: Exponer operations desde SentinelContext para WarRoomShell
**Archivo**: `src/contexts/SentinelContext.tsx`
**Cambio**: Agregar `operations` al SentinelState interface y al value del context (si no se hizo ya en C1).

**Archivo**: `src/components/war-room/WarRoomShell.tsx`
**Cambio**: Leer operations desde context ademas de las props, usando las del context como prioridad (se actualizan en real-time):

```typescript
const contextOperations = state.operations;
const effectiveOperations = contextOperations || operations; // context wins
```

Usar `effectiveOperations` en el render del Subject Dossier.

**Verificacion**:
- [ ] `pnpm build` pasa
- [ ] War Room muestra operations correctamente
- [ ] Desbloquear Desert Storm via curl → el status cambia de [LOCKED] a [COMPLETE] sin refresh

**Notas de desarrollo**:
> _(escribir aqui al completar)_

---

## PARTE 6: IMPLEMENTACION — FASE D (Sentinel Narrative para el Defensor)

> **Scope**: Modificar `/api/sentinel/route.ts` para manejar `EXT_ATTACK_INTERCEPTED`
> **Riesgo**: MEDIO — modifica el cerebro del Sentinel

---

### D1: Agregar `EXT_ATTACK_INTERCEPTED` a listas de bypass
**Archivo**: `src/contexts/SentinelContext.tsx`
**Cambio**: Agregar `"EXT_ATTACK_INTERCEPTED"` al array `NON_UNIQUE_EVENTS`:

```typescript
const NON_UNIQUE_EVENTS = [
    TECHNIQUES.HANDSHAKE,
    TECHNIQUES.WARNING,
    TECHNIQUES.ROUTING,
    "IDENTITY_REVEAL_PROTOCOL",
    "TAGGED: SCRIPT-KIDDIE",
    "EXT_ATTACK_INTERCEPTED",   // ← NUEVO: permite multiples triggers
];
```

**Verificacion**:
- [ ] `pnpm build` pasa
- [ ] `triggerSentinel` con este event type no se bloquea por dedup

**Notas de desarrollo**:
> _(escribir aqui al completar)_

---

### D2: Bypass DB logging y scoring en `/api/sentinel/route.ts`
**Archivo**: `src/app/api/sentinel/route.ts`
**Cambio**: Agregar checks para `EXT_ATTACK_INTERCEPTED`:

1. **Skip score calculation** — agregar al inicio del scoring block:
```typescript
// Skip scoring for notification-only events (already scored by /api/sentinel/external)
const isNotificationOnly = eventType === "EXT_ATTACK_INTERCEPTED";
if (isNotificationOnly) {
    impact = 0;
}
```

2. **Skip DB upsert** — envolver el score update block:
```typescript
if (!isNotificationOnly) {
    // ... existing score update upsert ...
}
```

3. **Skip onFinish logging** — en el callback `onFinish`:
```typescript
onFinish: async ({ text }) => {
    if (eventType === "EXT_ATTACK_INTERCEPTED") return; // Already logged by external API
    // ... existing logging code ...
}
```

**Verificacion**:
- [ ] `pnpm build` pasa
- [ ] Trigger `EXT_ATTACK_INTERCEPTED` → NO crea evento duplicado en DB
- [ ] Trigger `EXT_ATTACK_INTERCEPTED` → NO modifica risk score
- [ ] Eventos normales siguen funcionando (FORENSIC_INSPECTION_ACTIVITY, etc.)

**Notas de desarrollo**:
> _(escribir aqui al completar)_

---

### D3: Agregar SCENARIO en system prompt para ataques externos
**Archivo**: `src/app/api/sentinel/route.ts`
**Cambio**: Agregar nuevo escenario en el system prompt (dentro de `DYNAMIC LOGIC STRUCTURE`):

```
[SCENARIO 5: EXTERNAL ATTACK INTERCEPTED] (eventType === 'EXT_ATTACK_INTERCEPTED')
- CONTEXT: An external attacker just hit The Watchtower from outside the browser using a tool (curl, sqlmap, etc.).
- OUTPUT: EXACTLY 2-3 PARAGRAPHS.
- PERSPECTIVE: You are addressing the DEFENDER (the user watching the War Room), NOT the attacker.
- CONTENT:
  - Para 1: Announce the interception with dramatic flair. Mention the specific technique detected.
  - Para 2: Mock the attacker's sophistication (or lack thereof). Reference their CID if available.
  - Para 3 (optional): If an Operation was just unlocked or is close, reference it. Otherwise, comment on the platform's vigilance.
- TONE: Sarcastic superiority directed at the absent attacker, reassuring dominance for the defender.
- MANDATORY: Do NOT mention technical API details, endpoints, or header formats.
- MANDATORY: Address the defender as a fellow operator, not as a suspect.
- NO [TECHNIQUE: ...] tag at the end (this is a notification, not a detection).
```

**Verificacion**:
- [ ] `pnpm build` pasa
- [ ] Trigger `EXT_ATTACK_INTERCEPTED` → Sentinel genera respuesta de 2-3 parrafos
- [ ] La respuesta se dirige al defensor, no al atacante
- [ ] La respuesta menciona la tecnica detectada

**Notas de desarrollo**:
> _(escribir aqui al completar)_

---

## PARTE 7: IMPLEMENTACION — FASE E (UI Polish)

> **Scope**: Detalles visuales para completar la experiencia inmersiva
> **Riesgo**: BAJO — solo CSS/JSX

---

### E1: Colorear eventos EXT_* en rojo en el event log
**Archivo**: `src/components/war-room/WarRoomShell.tsx`
**Cambio**: En el render del event log (linea ~590-603), agregar deteccion de eventos externos:

```typescript
const isExternal = log.includes("EXT_");
<p className={`${
    idx === 0
        ? (isExternal ? "text-red-500 font-bold animate-pulse" : "text-white")
        : (isExternal ? "text-red-700" : "text-neutral-600")
} leading-relaxed`}>
```

**Verificacion**:
- [ ] `pnpm build` pasa
- [ ] Eventos EXT_* aparecen en rojo en el event log
- [ ] El evento mas reciente tiene animacion pulse si es externo

**Notas de desarrollo**:
> _(escribir aqui al completar)_

---

### E2: Colorear eventos EXT_* en HomeTerminal (si aplica)
**Archivo**: Revisar `src/components/watchtower/HomeTerminal.tsx`
**Cambio**: Aplicar la misma logica de coloreado en el event log del Home si existe un listado visible.

> **Nota**: Este paso depende de como HomeTerminal renderiza los logs. Revisar el componente antes de implementar.

**Verificacion**:
- [ ] `pnpm build` pasa
- [ ] Home page muestra eventos EXT_* diferenciados visualmente (si aplica)

**Notas de desarrollo**:
> _(escribir aqui al completar)_

---

### E3: Efecto visual al desbloquear Desert Storm en real-time
**Archivo**: `src/components/war-room/WarRoomShell.tsx`
**Cambio**: Agregar deteccion de transicion `[LOCKED]` → `[COMPLETE]` para Desert Storm:

```typescript
const prevOpsRef = useRef(effectiveOperations);
useEffect(() => {
    if (!prevOpsRef.current) return;
    // Desert Storm just unlocked
    if (!prevOpsRef.current.desertStorm && effectiveOperations?.desertStorm) {
        // Flash effect or notification (CSS animation)
    }
    prevOpsRef.current = effectiveOperations;
}, [effectiveOperations]);
```

El efecto puede ser un CSS transition (border green glow) o un log entry especial.

**Verificacion**:
- [ ] `pnpm build` pasa
- [ ] Desbloquear Desert Storm via curl → efecto visual inmediato

**Notas de desarrollo**:
> _(escribir aqui al completar)_

---

## PARTE 8: IMPLEMENTACION — FASE F (Testing Integral)

> **Scope**: Verificacion end-to-end sin cambios de codigo
> **Riesgo**: NINGUNO

---

### F1: Test de Terminal ASCII refinada
- [ ] `curl` con CID valido → Banner ASCII visible
- [ ] Response sin metricas numericas (no Risk Score, no X/3)
- [ ] 1er ataque muestra `OPERATION DESERT STORM: INITIATED`
- [ ] 3er ataque muestra `OPERATION DESERT STORM: UNLOCKED`
- [ ] Mensaje de 2-3 parrafos con alias del atacante
- [ ] Ataques duplicados → `X-Sentinel-Duplicate: true`, score no cambia

### F2: Test de Sync en tiempo real
- [ ] Abrir War Room en browser
- [ ] Enviar ataque desde curl (otra terminal)
- [ ] En < 10 segundos: log rojo aparece en War Room
- [ ] Risk score se actualiza sin refresh
- [ ] Desert Storm cambia de [LOCKED] a [COMPLETE] sin refresh

### F3: Test de Sentinel Narrative
- [ ] Despues del ataque, el Sentinel habla en el chat del War Room
- [ ] Mensaje de 2-3 parrafos, perspectiva del defensor
- [ ] Menciona la tecnica detectada
- [ ] Tono sarcastico, no generico

### F4: Test en Home page
- [ ] Abrir Home (/) con sesion activa (CID valido)
- [ ] Enviar ataque desde curl
- [ ] Sentinel reacciona en el chat del Home tambien
- [ ] Event log se actualiza

### F5: Test de edge cases
- [ ] Tab oculta → polling se pausa (verificar en Network tab)
- [ ] 3 ataques rapidos → solo 1 trigger del Sentinel (no 3)
- [ ] Risk score no excede el cap (40% sin ops, 60% con DS)
- [ ] Home ↔ War Room navegacion preserva todo el estado
- [ ] Refresh en cualquier pagina → estado persiste

### F6: Build limpio
- [ ] `pnpm lint` sin warnings
- [ ] `pnpm build` sin errores
- [ ] Neon DB muestra datos correctos

---

## PARTE 9: MATRIZ DE ARCHIVOS

| Paso | Archivo | Accion | Riesgo |
|------|---------|--------|--------|
| **A1-A5** | `src/app/api/sentinel/external/route.ts` | Modificar | BAJO |
| **B1** | `src/app/api/sentinel/sync/route.ts` | CREAR | BAJO |
| **B2** | `src/middleware.ts` | Modificar (1 linea) | BAJO |
| **C1** | `src/contexts/SentinelContext.tsx` | Modificar (state) | MEDIO |
| **C2** | `src/contexts/SentinelContext.tsx` | Modificar (hydrate) | MEDIO |
| **C2** | `src/app/page.tsx` | Modificar (identity) | BAJO |
| **C2** | `src/app/war-room/page.tsx` | Modificar (identity) | BAJO |
| **C3** | `src/contexts/SentinelContext.tsx` | Modificar (polling) | MEDIO |
| **C4** | `src/contexts/SentinelContext.tsx` | Modificar (events) | MEDIO |
| **C5** | `src/components/war-room/WarRoomShell.tsx` | Modificar (operations) | BAJO |
| **D1** | `src/contexts/SentinelContext.tsx` | Modificar (1 linea) | BAJO |
| **D2** | `src/app/api/sentinel/route.ts` | Modificar (bypass) | MEDIO |
| **D3** | `src/app/api/sentinel/route.ts` | Modificar (prompt) | BAJO |
| **E1** | `src/components/war-room/WarRoomShell.tsx` | Modificar (CSS) | BAJO |
| **E2** | `src/components/watchtower/HomeTerminal.tsx` | Modificar (CSS) | BAJO |
| **E3** | `src/components/war-room/WarRoomShell.tsx` | Modificar (effect) | BAJO |

**Total archivos nuevos**: 1 (`sync/route.ts`)
**Total archivos modificados**: 6
**Max archivos por paso**: 3 (paso C2)

---

## PARTE 10: REGLAS CRITICAS

1. **`pnpm build` despues de CADA paso** — no acumular cambios sin verificar
2. **Nunca hacer polling si no hay CID** — sin CID no hay ataques externos posibles
3. **Solo UN trigger de Sentinel por poll** — evitar cascada de llamadas GPT-4o
4. **`EXT_ATTACK_INTERCEPTED` NO debe tocar la DB** — ya se logueo en `/api/sentinel/external`
5. **El cookie es la identidad del sync** — no aceptar fingerprint como query param
6. **Pausar polling cuando tab oculta** — no desperdiciar requests
7. **Operations en SentinelContext como state** — no depender solo de server props para real-time
8. **Probar Home ↔ War Room** despues de cualquier cambio a SentinelContext
9. **`lastSyncTimeRef` inicializa con null** — el primer poll usa un since de 30s atras
10. **Los mensajes expandidos del ASCII deben usar word-wrap** — la funcion ya existe, usarla

---

## PARTE 11: ORDEN DE EJECUCION (RESUMEN)

```
FASE A — Terminal ASCII (aislado, sin deps):
  A1  Banner constante                          [2 min]
  A2  Eliminar metricas + agregar alias         [5 min]
  A3  Status narrativo de operaciones           [5 min]
  A4  Mensajes expandidos 2-3 parrafos          [10 min]
  A5  Integrar banner en response               [3 min]
  ── BUILD + CURL TEST ──

FASE B — Sync Backend:
  B1  Crear /api/sentinel/sync                  [15 min]
  B2  Agregar ruta publica en middleware         [2 min]
  ── BUILD + CURL TEST ──

FASE C — Frontend Polling:
  C1  State de operations + lastSyncTime        [5 min]
  C2  Hidratar operations en hydrateFromServer  [10 min]
  C3  Polling loop con visibilidad              [15 min]
  C4  Procesar eventos + trigger Sentinel       [10 min]
  C5  WarRoomShell lee operations del context   [5 min]
  ── BUILD + MANUAL TEST (curl attack → UI update) ──

FASE D — Sentinel Narrative:
  D1  NON_UNIQUE_EVENTS update                  [2 min]
  D2  Bypass DB en /api/sentinel                [10 min]
  D3  System prompt SCENARIO 5                  [10 min]
  ── BUILD + NARRATIVE TEST ──

FASE E — UI Polish:
  E1  Colores EXT_* en War Room log             [5 min]
  E2  Colores EXT_* en Home log                 [5 min]
  E3  Efecto visual Desert Storm unlock         [10 min]
  ── BUILD + VISUAL TEST ──

FASE F — Testing Integral:
  F1-F6  Tests completos                        [20 min]
  ── LINT + BUILD ──
```

---

## LOG DE DESARROLLO

> Esta seccion se actualiza durante la implementacion. Cada paso completado se documenta aqui.

### Sesion 1: 2026-02-11
**Estado**: FASES A-E COMPLETADAS — FASE F (Testing) EN PROGRESO

**FASE A (Terminal ASCII Refinements)** — COMPLETADA
- A1: Banner ASCII `WATCHTOWER_BANNER` constante creada en `external/route.ts`
- A2: Eliminadas lineas de Risk Score y Technique count de `buildAsciiResponse`. Agregado campo `alias` (Subject)
- A3: Funcion `getOperationStatus(externalCount, desertStormUnlocked)` — retorna status narrativo (INITIATED / IN PROGRESS / UNLOCKED)
- A4: `SENTINEL_LINES` reescrito con patron `((alias: string) => string)[]` — 8 categorias de tecnicas, cada una con 2-3 variaciones de 2-3 parrafos con interpolacion de alias
- A5: Banner prepended a response: `WATCHTOWER_BANNER + "\n" + ascii`
- Build: PASS (0 errors, 0 warnings)

**FASE B (Sync Endpoint Backend)** — COMPLETADA
- B1: Creado `src/app/api/sentinel/sync/route.ts` — GET endpoint Edge runtime, cookie-based auth (`watchtower_node_id`), cursor-based events query (`since` param), retorna riskScore/riskCap/operations/counts/events. Cache-Control: no-store
- B2: Agregado `"/api/sentinel/sync"` al array `isPublicRoute` en middleware.ts
- Build: PASS

**FASE C (Frontend Polling + State Sync)** — COMPLETADA
- C1: Agregado `OperationsState` interface, `operations` state, `lastSyncTimeRef` a SentinelContext
- C2: `operations` agregado a `IdentityData` interface. Hidratacion en `hydrateFromServer`. Pasado desde `page.tsx` y `war-room/page.tsx`
- C3: Polling useEffect con interval 5s, guards (CID valido, isHydrated, no streaming), visibility pause via `document.visibilitychange`
- C4: Procesamiento de eventos EXT_* — todos se agregan al eventLog, solo el mas reciente dispara `triggerSentinel()` con prompt de defensor
- C5: WarRoomShell lee operations de context (real-time) con fallback a server props via IIFE pattern
- D1 (adelantado): `"EXT_ATTACK_INTERCEPTED"` agregado a `NON_UNIQUE_EVENTS`
- Build: PASS

**FASE D (Sentinel Narrative)** — COMPLETADA
- D2: `isNotificationOnly` flag para `EXT_ATTACK_INTERCEPTED` — bypass DB upsert, score update, y onFinish logging en `/api/sentinel/route.ts`
- D3: SCENARIO 5 agregado al system prompt — perspectiva defensor, 2-3 parrafos, sin tag [TECHNIQUE:]
- Build: PASS

**FASE E (UI Polish)** — COMPLETADA
- E1: Eventos EXT_* en rojo en WarRoomShell event log (animate-pulse para el mas reciente)
- E2: Eventos EXT_* en rojo en HomeTerminal event log (font-bold)
- E3: Diferido — efecto visual de Desert Storm unlock no implementado como paso separado (la actualizacion de operations en tiempo real ya muestra la transicion)
- Build: PASS

**Archivos creados**: `src/app/api/sentinel/sync/route.ts`
**Archivos modificados**: `external/route.ts`, `middleware.ts`, `SentinelContext.tsx`, `page.tsx`, `war-room/page.tsx`, `WarRoomShell.tsx`, `sentinel/route.ts`, `HomeTerminal.tsx`
**Builds totales**: 5/5 PASS — zero errors, zero warnings

---

### Sesion 2: 2026-02-11 (Post-Testing Bugfixes)
**Estado**: 4 BUGS ENCONTRADOS EN TESTING → CORREGIDOS

**Bug 1: Logs no aparecen en real-time** (solo al refrescar pagina)
- **Root cause**: Sync endpoint usaba `sql` template literal raw para comparacion de timestamps. Neon/Drizzle no serializa correctamente `Date` en `sql` template → events query retornaba siempre vacio. Operations funcionaban porque vienen de `userSessions` (sin filtro de timestamp).
- **Fix**: Reemplazado `sql\`..timestamp > ..Date\`` con `gt(securityEvents.timestamp, new Date(since))` de drizzle-orm
- **Archivo**: `src/app/api/sentinel/sync/route.ts`

**Bug 2: Sentinel mudo en la app** (no generaba narrativa al detectar ataque externo)
- **Root cause**: Consecuencia directa del Bug 1. Sin eventos del sync, `extEvents` siempre estaba vacio, `triggerSentinel()` nunca se llamaba.
- **Fix adicional**: Cursor del polling ahora usa timestamp del evento mas reciente del SERVER (no del client `new Date()`) para evitar clock skew.
- **Archivo**: `src/contexts/SentinelContext.tsx` (polling cursor logic)

**Bug 3: CONTEXT_SWITCH_ANOMALY aparecia en rojo**
- **Root cause**: `log.includes("EXT_")` matcheaba "CONT**EXT**_SWITCH_ANOMALY" como falso positivo.
- **Fix**: Cambiado a `log.includes("DETECTED: [EXT_")` — patron mas especifico que solo matchea event types que empiezan con EXT_.
- **Archivos**: `WarRoomShell.tsx`, `HomeTerminal.tsx`

**Bug 4: Mensaje de terminal identico entre usuarios**
- **Root cause**: `SENTINEL_LINES` usaba templates estaticos con interpolacion de alias. Misma tecnica → mismo texto exacto entre usuarios diferentes.
- **Fix**: Eliminado `SENTINEL_LINES` completamente. Reemplazado con `generateSentinelMessage()` que usa `generateText()` del AI SDK con GPT-4o (`temperature: 0.9`). Cada respuesta es generada en tiempo real, 100% unica. Fallback estatico si AI falla.
- **Archivo**: `src/app/api/sentinel/external/route.ts`
- **Nota**: AI SDK v6 usa `maxOutputTokens` (no `maxTokens`)

**Builds**: lint PASS, build PASS

---

### Sesion 2b: 2026-02-11 (Post-Testing — Connection Exhaustion Fix)
**Estado**: BUG CRITICO EN PRODUCCION → CORREGIDO

**Bug 5: Neon connection pool exhaustion — app se cae**
- **Sintoma**: Despues de unos minutos, TODOS los endpoints fallan con `NeonDbError: fetch failed` / `ETIMEDOUT`. No solo sync — tambien global-intel, chat, war-room page, session.ts.
- **Root cause**: Polling cada 5s (2 queries por poll) + queries de pagina + global-intel + chat saturan el pool de conexiones de Neon (free tier). Las conexiones ETIMEDOUT se acumulan y bloquean todo.
- **Fix 1**: Sync endpoint envuelto en `try/catch` — retorna 503 en vez de crashear con stack trace
- **Fix 2**: Polling con **backoff exponencial** — si un poll falla, el intervalo se duplica (10s → 20s → 40s → cap 60s). Se resetea al tener exito o cuando el usuario vuelve al tab.
- **Fix 3**: Intervalo base subido de **5s → 10s** — reduce presion constante sobre Neon
- **Archivos**: `sync/route.ts` (try/catch 503), `SentinelContext.tsx` (adaptive setTimeout loop reemplaza setInterval fijo)
- **Patron**: `setTimeout` recursivo con backoff reemplaza `setInterval` — permite variar el intervalo dinamicamente

**Builds**: lint PASS, build PASS

---
