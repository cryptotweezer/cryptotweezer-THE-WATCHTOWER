```bash
# 1. SQL Injection (EXT_SQLI)
# Nota: Requiere URL encoding de espacios (%20)
curl -H "X-CID: CID-494-S" "http://192.168.8.111:3000/search?q='%20OR%201=1--"

# 2. XSS (EXT_XSS)
# Nota: Requiere URL encoding de < > (%3C, %3E)
curl -H "X-CID: CID-494-S" "http://192.168.8.111:3000/page?input=%3Cscript%3Ealert(1)%3C/script%3E"

# 3. Path Traversal (EXT_PATH_TRAVERSAL) -> DESERT STORM UNLOCK
curl -H "X-CID: CID-494-S" "http://192.168.8.111:3000/files?path=../../../../etc/passwd"
```

---
# 1. X-CID header (ya funcionaba)
curl -H "X-CID: CID-900-I" https://the-watchtower.vercel.app/admin

# 2. Query parameter (URL-encode el ' como %27)
curl "https://the-watchtower.vercel.app/?cid=CID-900-I&id=1%27%20OR%201%3D1--"

# 3. Cookie (ya funcionaba)
curl -b "watchtower_cid=CID-900-I" https://the-watchtower.vercel.app/etc/passwd

# 4. User-Agent — AHORA FUNCIONA + detecta nikto como EXT_SCANNER
curl -A "CID-900-I nikto/2.5" https://the-watchtower.vercel.app/

# 5. Referer — AHORA FUNCIONA
curl -H "Referer: CID-900-I" https://the-watchtower.vercel.app/

---

# Honeypot Operations — Flow Test Guide (Step-by-Step)

> **Para**: Testing manual E2E de Operations Overlord & Rolling Thunder
> **Pre-requisito**: Necesitas una sesion con **Desert Storm COMPLETE** (3+ tecnicas externas detectadas). Si no la tienes, usa los comandos Kali CID de arriba primero.
> **Ambiente**: Funciona en `localhost:3000` (dev) y produccion (Vercel)

---

## ANTES DE EMPEZAR

1. Abre el **War Room** (`/war-room`) — necesitas estar autenticado via Clerk
2. En el panel izquierdo, mira la seccion **Operations** debajo de tu Identity Card:
   ```
   DESERT STORM    [COMPLETE]  <-- deberia estar verde
   OVERLORD        [LOCKED]    <-- deberia estar gris
   ROLLING THUNDER [LOCKED]    <-- deberia estar gris
   ```
3. Anota tu porcentaje actual de **Threat Level** abajo a la izquierda

---

## FASE 1: OPERATION OVERLORD — "La Trampa del Formulario de Contacto"

### Paso 1: Navega a CONTACT DEV

- En la barra lateral izquierda, haz clic en **CONTACT DEV**
- Veras un formulario estilo terminal: "Secure Comms Channel"
- Campos visibles: Callsign, Comms Channel (email), Subject, Message

### Paso 2: Abre DevTools

- Presiona `F12` (o `Ctrl+Shift+I` en Windows / `Cmd+Option+I` en Mac)
- Ve a la pestana **Elements** (en Chrome/Edge) o **Inspector** (en Firefox)

### Paso 3: Encuentra los Campos Ocultos

- Usa `Ctrl+F` en el panel de Elements y busca `debug_mode`
- Encontraras TRES campos hidden:
  ```html
  <input type="hidden" name="debug_mode" value="false">
  <input type="hidden" name="redirect_path" value="/dashboard/internal">
  <input type="hidden" name="integrity_token" value="...string larga...">
  ```

### Paso 4: Modifica un Campo Oculto

- Haz doble clic en el `value="false"` del campo `debug_mode`
- Cambialo a `value="true"`
- (Tambien puedes cambiar `redirect_path` para mas impacto, pero uno es suficiente)

### Paso 5: Llena y Envia el Formulario

- Vuelve al formulario y llena TODOS los campos visibles:
  - **Callsign**: cualquier cosa (ej: `TestHacker`)
  - **Comms Channel**: cualquier email (ej: `test@test.com`)
  - **Subject**: cualquier cosa (ej: `Testing`)
  - **Message**: cualquier cosa (ej: `Hello`)
- Haz clic en **[ TRANSMIT ]**

### Paso 6: Observa la Trampa Activarse

1. Veras: **"TRANSMISSION RECEIVED"** con un checkmark verde (se ve normal!)
2. Espera ~2 segundos...
3. La pantalla hace **glitch** — lineas rojas, parpadeo
4. Aparece un **CRASH SCREEN**:
   - `[FATAL] UNHANDLED EXCEPTION IN SECURECOMMSHANDLER`
   - Lineas de variables de entorno falsas aparecen (efecto maquina de escribir)
   - Veras API keys falsas, credenciales de base de datos, etc.
   - **TU fingerprint** esta embebido en los passwords falsos!

### Paso 7: Encuentra la Pista (Breadcrumb)

- En el crash dump, busca esta linea (resaltada en ambar/amarillo):
  ```
  [ERROR] GET /api/__debug/session?token=overlord failed: Connection reset by peer
  ```
- **Recuerda esta URL**: `/api/__debug/session?token=overlord` — la necesitaras para la Fase 2

### Paso 8: Verifica que Overlord se Completo

- Espera ~10 segundos para que el sync poll actualice
- Haz clic en tu alias en el panel izquierdo para volver al **Subject Dossier**
- Revisa la seccion Operations:
  ```
  DESERT STORM    [COMPLETE]  <-- verde
  OVERLORD        [COMPLETE]  <-- AHORA VERDE!
  ROLLING THUNDER [LOCKED]    <-- todavia gris
  ```
- Tu **Threat Level** debio subir (cap ahora es 80%)
- El **Sentinel** habra enviado un mensaje en el chat de la derecha sobre la "protocol deviation"

---

## FASE 2: OPERATION ROLLING THUNDER — "El Endpoint de Debug"

### Paso 9: Visita el Endpoint de Debug

- Abre una nueva pestana del navegador
- Navega a: `http://localhost:3000/api/__debug/session?token=overlord`
  (o tu URL de Vercel + `/api/__debug/session?token=overlord`)
- Deberias ver una **respuesta 403**:
  ```json
  {
    "error": "INVALID_SESSION_TOKEN",
    "hint": "Session requires elevated privileges",
    "details": "Maintenance interface locked. Token alone is insufficient for access."
  }
  ```
- Este es el paso de **descubrimiento** — te dice que el token solo no es suficiente

### Paso 10: Fuzzea el Endpoint

Ahora necesitas "hackear" el endpoint. Cualquiera de estos metodos funciona:

**Opcion A — Agrega parametros extra a la URL (mas facil):**
```
/api/__debug/session?token=overlord&role=admin
```
o
```
/api/__debug/session?token=overlord&debug=1&force=true
```
Simplemente pega esa URL en tu navegador y presiona Enter.

**Opcion B — Usa un metodo HTTP diferente (desde la consola del navegador):**
Abre DevTools (F12), ve a la pestana Console, y pega:
```javascript
fetch('/api/__debug/session?token=overlord', { method: 'POST' })
  .then(r => r.json()).then(console.log)
```

**Opcion C — Agrega headers personalizados (desde la consola del navegador):**
```javascript
fetch('/api/__debug/session?token=overlord', {
  headers: { 'X-Admin-Token': 'anything' }
}).then(r => r.json()).then(console.log)
```

- Deberias ver una **respuesta 200**:
  ```json
  {
    "status": "MAINTENANCE_SESSION_GRANTED",
    "ui_unlock": true,
    "session_id": "maint_abc12345_1739...",
    "message": "Debug interface access granted. Elevated privileges active."
  }
  ```

### Paso 11: Vuelve al War Room

- Regresa a la pestana del War Room (`/war-room`)
- Espera ~10 segundos para que el sync poll detecte el nuevo evento `ROLLING_THUNDER`
- En la barra lateral izquierda, deberia aparecer un NUEVO boton (ambar, pulsando):
  ```
  CONTACT DEV
  LAUNCH DEBUG CONSOLE    <-- NUEVO! Color ambar, pulsando
  FORENSIC WIPE
  ```

> **Nota**: Si no aparece despues de 15 segundos, refresca la pagina (`F5`).

---

## FASE 3: OPERATION ROLLING THUNDER — "El Terminal Falso"

### Paso 12: Lanza la Debug Console

- Haz clic en **LAUNCH DEBUG CONSOLE**
- Aparece un terminal negro con texto verde y efecto CRT de scanlines:
  ```
  +----------------------------------------------------------+
  |  WATCHTOWER MAINTENANCE CONSOLE v2.4.1                    |
  |  Session: ELEVATED | Mode: MAINTENANCE                    |
  |  WARNING: All actions are logged to audit.log             |
  +----------------------------------------------------------+

  Type 'help' for available commands.

  root@watchtower-prod:~#
  ```

### Paso 13: Explora el Terminal (con cuidado!)

Escribe estos comandos uno por uno (presiona Enter despues de cada uno):

1. `help` — muestra los comandos disponibles
2. `whoami` — devuelve `root` (el cebo!)
3. `status` — muestra info del sistema falso con TU CID siendo rastreado

> **ADVERTENCIA IMPORTANTE**: La trampa final se activa despues de **4 comandos totales** O cuando escribes un comando peligroso. Si quieres explorar mas, ten en cuenta que el 4to comando activara la trampa automaticamente!

### Paso 14: Activa la Trampa Final (Kill Switch)

Despues de explorar, escribe cualquier comando "peligroso":
- `cat /etc/passwd` (exfiltracion de datos)
- `rm -rf /` (destruccion)
- `export DB_PASS=secret` (robo de datos)
- O simplemente escribe un 4to comando de cualquier tipo (deteccion de persistencia)

### Paso 15: Observa la Revelacion Final

1. El terminal muestra: **"Processing..."** con una barra de progreso
2. La barra se llena hasta **73%** y luego se **detiene**
3. Aparece: `STALL DETECTED - Buffer overflow at 0x7fff5fbffa73`
4. La pantalla **COLAPSA** — animacion de glitch rojo, `[CRITICAL FAILURE]`
5. Despues comienza la **REVELACION** (efecto maquina de escribir, linea por linea):
   ```
   ### SYSTEM BREACH DETECTED ###

   Maintenance session? There is no maintenance mode.

   You found the door because I drew it for you.
   The breadcrumb in the crash dump. The hint in the 403.
   Every step was observed. Every command catalogued.

   This terminal does not exist.
   This server does not exist.
   You are interacting with a construct.

   Your session has been permanently flagged.
   Operation Rolling Thunder - COMPLETE.
   ```

### Paso 16: Verifica que Todo se Completo

- Navega de vuelta a tu **Subject Dossier** (haz clic en tu alias)
- Revisa la seccion Operations:
  ```
  DESERT STORM    [COMPLETE]  <-- verde
  OVERLORD        [COMPLETE]  <-- verde
  ROLLING THUNDER [COMPLETE]  <-- AHORA VERDE!
  ```
- Tu **Threat Level** deberia estar en ~80-85% (cap ahora es 100%)
- El **Sentinel Chat** a la derecha deberia tener un mensaje dramatico sobre Rolling Thunder

---

## CHECKLIST DE VERIFICACION

Despues de completar todas las fases, verifica:

- [ ] **OVERLORD** muestra `[COMPLETE]` en verde en el Subject Dossier
- [ ] **ROLLING THUNDER** muestra `[COMPLETE]` en verde en el Subject Dossier
- [ ] **Threat Level** aumento (deberia estar ~80-85%)
- [ ] **LAUNCH DEBUG CONSOLE** aparecio en la barra lateral despues de fuzzear el endpoint
- [ ] **Sentinel Chat** reconocio tanto Overlord como Rolling Thunder
- [ ] **Event Log** (panel central, Subject Dossier) muestra entradas OVERLORD y ROLLING_THUNDER
- [ ] El crash screen mostro tu fingerprint embebido en credenciales falsas
- [ ] El terminal de debug mostro tu CID en los comandos `status` y `users`

---

## TROUBLESHOOTING

| Problema | Causa | Solucion |
|----------|-------|----------|
| Operations no se actualizan a verde | Delay del sync polling | Espera 10-15 segundos, o refresca la pagina |
| LAUNCH DEBUG CONSOLE no aparece | Event log no contiene ROLLING_THUNDER aun | Espera el sync poll, o refresca la pagina |
| Debug endpoint devuelve 404 | Falta `?token=overlord` | Asegurate que la URL incluye `?token=overlord` |
| Debug endpoint devuelve 401 | No hay cookie de sesion | Asegurate de estar logueado y haber visitado el War Room antes |
| Form submission no muestra crash | No se modificaron campos ocultos | Revisa DevTools — el valor de `debug_mode` debe estar cambiado de "false" |
| Terminal no responde al teclear | Problema de focus | Haz clic en cualquier parte del area negra del terminal para enfocar el input oculto |
| Sentinel no habla de honeypots | triggerSentinel llega pero sin contexto | Despues de Rolling Thunder, ve al chat y pregunta "What just happened?" |

---

## MATEMATICAS DEL RISK SCORE

| Evento | Impacto | Total Acumulado (ejemplo) | Cap |
|--------|---------|--------------------------|-----|
| Pre-honeypot (Desert Storm completo) | - | ~45% | 60 |
| Overlord: hidden field tamper | +5 | ~50% | 80 |
| Overlord: integrity token mismatch | +5 | ~55% | 80 |
| Rolling Thunder: endpoint discovery | +5 | ~60% | 80 |
| Rolling Thunder: endpoint fuzzing | +8 | ~68% | 80 |
| Rolling Thunder: exfiltracion (kill switch) | +15 | **~83%** | 100 |

> **Nota**: El score exacto depende de los eventos acumulados antes de empezar. El maximo teorico es 100%, pero un recorrido tipico por las 3 operaciones aterriza alrededor de **80-85%**.
