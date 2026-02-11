# Kali CID — Manual Testing Guide (Beginner-Friendly)

> **Date**: 2026-02-11
> **Scope**: Operation Desert Storm (only operation with unlock logic)
> **Status**: Overlord & Rolling Thunder have DB columns but NO unlock conditions yet (pending honeypot design)

---

## ANTES DE EMPEZAR — Que necesitas saber

### Que estamos testeando?

The Watchtower detecta ataques enviados desde herramientas externas (como Kali Linux). El atacante usa su **CID** (Criminal ID) como firma para que el sistema sepa quien esta atacando. Cada ataque unico sube el risk score +5 puntos. Al acumular **3 tecnicas unicas**, se desbloquea **Operation Desert Storm** (+20 bonus).

### Que es un CID?

Es un identificador como `CID-442-X` que se le asigna a cada usuario cuando su risk score llega a 20%. Es como tu "nombre clave criminal" dentro de la plataforma.

### Que es curl?

`curl` es una herramienta de linea de comandos que viene pre-instalada en Kali Linux. Sirve para enviar peticiones HTTP a cualquier servidor — como si fueras un navegador pero desde la terminal. Es la forma mas basica de enviar ataques simulados.

---

# TUTORIAL A: Testing contra LOCALHOST (http://localhost:3000)

> Usa esto cuando tienes el servidor de desarrollo corriendo en tu maquina Windows y Kali Linux esta en la misma red (ej: Kali en una VM o WSL).

---

## Paso 1: Conseguir tu CID desde el navegador

**Esto se hace ANTES de tocar Kali.** Necesitas un CID asignado.

1. Abre un navegador (Chrome, Firefox) en tu maquina Windows
2. Ve a `http://localhost:3000`
3. Completa el **Gatekeeper handshake** (presiona ENTER en la terminal)
4. Ahora necesitas subir tu risk score a **20%** para que se te asigne un CID. Haz lo siguiente:
   - Presiona `F12` para abrir DevTools (esto dispara `FORENSIC_INSPECTION_ACTIVITY`)
   - Haz click derecho en la pagina (dispara `UI_SURFACE_ANALYSIS`)
   - Haz click en la pagina y luego click fuera de la ventana (dispara `FOCUS_LOSS_ANOMALY`)
   - Selecciona texto y presiona `Ctrl+C` (dispara `DATA_EXFILTRATION_ATTEMPT`)
   - Repite estas acciones varias veces hasta llegar a 20%
5. Cuando llegues a 20%, el Sentinel te revelara tu **CID** (ejemplo: `CID-442-X`)
6. **Anota tu CID** — lo necesitaras para todos los comandos de Kali

> **Alternativa rapida**: Si ya tienes una sesion, puedes buscar tu CID directamente en la base de datos Neon:
> ```sql
> SELECT alias, cid, risk_score FROM user_sessions WHERE cid IS NOT NULL;
> ```

---

## Paso 2: Identificar la IP de tu maquina Windows

Kali necesita saber la IP de tu maquina donde corre el servidor Next.js.

**En Windows** (PowerShell o CMD):
```
ipconfig
```

Busca tu adaptador de red y anota la **IPv4 Address**. Ejemplo: `192.168.1.100`

> **Si Kali esta en WSL**: usa `localhost` o `127.0.0.1` directamente.
> **Si Kali esta en una VM (VirtualBox/VMware)**: la VM necesita estar en modo **Bridge** o **Host-Only** para ver tu maquina. Usa la IP que obtuviste con `ipconfig`.

---

## Paso 3: Abrir terminal en Kali Linux

1. Inicia Kali Linux (VM, dual boot, o WSL)
2. Abre una terminal:
   - **Kali Desktop**: Click derecho en el escritorio > "Open Terminal Here"
   - **O**: Menu de aplicaciones > Terminal Emulator
   - **WSL**: Abre "Kali Linux" desde el menu de Windows

---

## Paso 4: Verificar que Kali puede ver tu servidor

Antes de atacar, verifica que Kali puede conectarse a tu servidor:

```bash
# Reemplaza 192.168.1.100 con tu IP real
# Si usas WSL, prueba con localhost
curl -s -o /dev/null -w "%{http_code}" http://192.168.1.100:3000/
```

**Resultado esperado**: `200`

Si ves `000` o `connection refused`:
- Verifica que el servidor Next.js esta corriendo (`pnpm dev` en Windows)
- Verifica la IP
- Verifica que el firewall de Windows no bloquea el puerto 3000

---

## Paso 5: Tu primer ataque — SQL Injection

Ahora si, vamos a enviar el primer ataque. Reemplaza `TU-CID` con tu CID real y `TU-IP` con la IP de tu maquina Windows:

```bash
curl -H "X-CID: TU-CID" "http://TU-IP:3000/search?q=' OR 1=1--"
```

**Ejemplo real** (si tu CID es `CID-442-X` y tu IP es `192.168.1.100`):

```bash
curl -H "X-CID: CID-442-X" "http://192.168.1.100:3000/search?q=' OR 1=1--"
```

**Que deberia pasar**:
- La terminal muestra una caja ASCII con la respuesta del Sentinel
- Dice `Technique: EXT_SQLI`
- El risk score subio +5

```
┌─────────────────────────────────────────────────────────────┐
│  SENTINEL RESPONSE — EXTERNAL ATTACK CLASSIFIED            │
├─────────────────────────────────────────────────────────────┤
│  CID: CID-442-X                                            │
│  Technique: EXT_SQLI                                        │
│  Risk Score: 20% → 25%                                      │
│  Unique External Techniques: 1/3                            │
│                                                             │
│  SQL injection from beyond the perimeter. Your CID is       │
│  burned into every query you send.                          │
└─────────────────────────────────────────────────────────────┘
```

> **No ves nada?** Usa `-v` para ver detalles: `curl -v -H "X-CID: CID-442-X" "http://..."`
> **Ves "CID not found"?** Tu CID no existe en la DB. Vuelve al Paso 1.
> **Ves HTML en vez de ASCII?** El middleware no intercepto. Usa el Metodo Directo (Paso 8).

---

## Paso 6: Segundo ataque — XSS

```bash
curl -H "X-CID: CID-442-X" "http://192.168.1.100:3000/page?input=<script>alert(1)</script>"
```

**Resultado**: `Technique: EXT_XSS`, score sube +5 mas (ej: 25% → 30%)

---

## Paso 7: Tercer ataque — Path Traversal (Desbloquea Desert Storm!)

```bash
curl -H "X-CID: CID-442-X" "http://192.168.1.100:3000/files?path=../../../../etc/passwd"
```

**Resultado**: Este es el 3er ataque unico, asi que **Operation Desert Storm** se desbloquea automaticamente:
- Score sube +5 (tecnica) + 20 (bonus Desert Storm) = +25
- La respuesta muestra: `★ OPERATION DESERT STORM — UNLOCKED (+20% bonus)`
- Tu risk cap sube de 40% a 60%

```
┌─────────────────────────────────────────────────────────────┐
│  SENTINEL RESPONSE — EXTERNAL ATTACK CLASSIFIED            │
├─────────────────────────────────────────────────────────────┤
│  CID: CID-442-X                                            │
│  Technique: EXT_PATH_TRAVERSAL                              │
│  Risk Score: 30% → 55%                                      │
│  Unique External Techniques: 3/3                            │
│                                                             │
│  ★ OPERATION DESERT STORM — UNLOCKED (+20% bonus)          │
│                                                             │
│  Directory traversal from the outside. Every ../ is a       │
│  breadcrumb we follow.                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Paso 8: Metodo Directo (si el middleware no funciona en local)

A veces en desarrollo local el middleware no intercepta bien las peticiones. En ese caso, puedes enviar ataques directamente a la API sin pasar por el middleware:

```bash
# SQL Injection (directo)
curl -X POST "http://192.168.1.100:3000/api/sentinel/external" \
  -H "x-sentinel-cid: CID-442-X" \
  -H "x-sentinel-technique: EXT_SQLI" \
  -H "x-sentinel-payload: ' OR 1=1--" \
  -H "x-sentinel-confidence: 0.85"

# XSS (directo)
curl -X POST "http://192.168.1.100:3000/api/sentinel/external" \
  -H "x-sentinel-cid: CID-442-X" \
  -H "x-sentinel-technique: EXT_XSS" \
  -H "x-sentinel-payload: <script>alert(1)</script>" \
  -H "x-sentinel-confidence: 0.80"

# Path Traversal (directo)
curl -X POST "http://192.168.1.100:3000/api/sentinel/external" \
  -H "x-sentinel-cid: CID-442-X" \
  -H "x-sentinel-technique: EXT_PATH_TRAVERSAL" \
  -H "x-sentinel-payload: ../../../../etc/passwd" \
  -H "x-sentinel-confidence: 0.90"
```

> **La diferencia**: El metodo directo tu le dices al API exactamente que tecnica es. El metodo via middleware deja que el clasificador detecte automaticamente la tecnica desde el payload.

---

## Paso 9: Verificar en el War Room

1. Vuelve al navegador en Windows
2. Ve a `http://localhost:3000/war-room` (necesitas estar logueado con Clerk)
3. En el **Subject Dossier** (panel izquierdo), verifica:
   - `OPERATION DESERT STORM` dice `[COMPLETE]` en verde
   - `OPERATION OVERLORD` dice `[LOCKED]` en gris
   - `OPERATION ROLLING THUNDER` dice `[LOCKED]` en gris
4. El risk score refleja los puntos ganados
5. En el chat, preguntale al Sentinel: "what's my CID?" — deberia compartirlo y hacer hints sobre herramientas externas

---

# TUTORIAL B: Testing contra PRODUCCION (https://the-watchtower.vercel.app)

> Usa esto para testear el deploy real en Vercel. No necesitas servidor local.

---

## Paso 1: Conseguir tu CID desde el navegador

1. Abre un navegador y ve a **https://the-watchtower.vercel.app**
2. Completa el Gatekeeper handshake
3. Sube tu risk score a 20% usando las mismas tecnicas del Tutorial A, Paso 1:
   - `F12` (DevTools), click derecho, blur, Ctrl+C sobre texto seleccionado, etc.
4. Anota tu **CID** cuando el Sentinel lo revele

---

## Paso 2: Abrir terminal en Kali Linux

1. Inicia Kali Linux
2. Abre una terminal (click derecho > "Open Terminal Here" o Menu > Terminal)

---

## Paso 3: Verificar conexion a internet

```bash
curl -s -o /dev/null -w "%{http_code}" https://the-watchtower.vercel.app/
```

**Resultado esperado**: `200`

Si ves `000`: no hay conexion a internet. Verifica tu red en Kali.

---

## Paso 4: Ataque 1 — SQL Injection

```bash
curl -H "X-CID: TU-CID" "https://the-watchtower.vercel.app/search?q=' OR 1=1--"
```

**Ejemplo** (si tu CID es `CID-442-X`):

```bash
curl -H "X-CID: CID-442-X" "https://the-watchtower.vercel.app/search?q=' OR 1=1--"
```

Deberias ver la caja ASCII con `Technique: EXT_SQLI` y score +5.

---

## Paso 5: Ataque 2 — XSS

```bash
curl -H "X-CID: CID-442-X" "https://the-watchtower.vercel.app/page?input=<script>alert(1)</script>"
```

Score +5. `Technique: EXT_XSS`.

---

## Paso 6: Ataque 3 — Path Traversal (Desert Storm!)

```bash
curl -H "X-CID: CID-442-X" "https://the-watchtower.vercel.app/files?path=../../../../etc/passwd"
```

**Desert Storm se desbloquea!** Score +25 (5 + 20 bonus).

---

## Paso 7: Ataques adicionales (opcionales)

Puedes seguir enviando tecnicas adicionales. Cada nueva tecnica suma +5 pero el score ahora tiene un cap de 60% (post-Desert Storm):

```bash
# Ataque 4 — Command Injection
curl -H "X-CID: CID-442-X" "https://the-watchtower.vercel.app/ping?host=127.0.0.1; cat /etc/passwd"

# Ataque 5 — SSRF
curl -H "X-CID: CID-442-X" "https://the-watchtower.vercel.app/proxy?url=http://169.254.169.254/latest/meta-data"

# Ataque 6 — LFI
curl -H "X-CID: CID-442-X" "https://the-watchtower.vercel.app/page?view=php://filter/convert.base64-encode/resource=config"

# Ataque 7 — Header Injection
curl -H "X-CID: CID-442-X" -H "X-Payload: test%0d%0aSet-Cookie: hacked=true" "https://the-watchtower.vercel.app/api/log"
```

---

## Paso 8: Metodo Directo para Produccion

Si por alguna razon el middleware no intercepta (la respuesta es HTML en vez de ASCII):

```bash
# SQL Injection directo
curl -X POST "https://the-watchtower.vercel.app/api/sentinel/external" \
  -H "x-sentinel-cid: CID-442-X" \
  -H "x-sentinel-technique: EXT_SQLI" \
  -H "x-sentinel-payload: ' OR 1=1--" \
  -H "x-sentinel-confidence: 0.85"

# XSS directo
curl -X POST "https://the-watchtower.vercel.app/api/sentinel/external" \
  -H "x-sentinel-cid: CID-442-X" \
  -H "x-sentinel-technique: EXT_XSS" \
  -H "x-sentinel-payload: <script>alert(1)</script>" \
  -H "x-sentinel-confidence: 0.80"

# Path Traversal directo
curl -X POST "https://the-watchtower.vercel.app/api/sentinel/external" \
  -H "x-sentinel-cid: CID-442-X" \
  -H "x-sentinel-technique: EXT_PATH_TRAVERSAL" \
  -H "x-sentinel-payload: ../../../../etc/passwd" \
  -H "x-sentinel-confidence: 0.90"
```

---

## Paso 9: Verificar en el War Room (Produccion)

1. Ve a **https://the-watchtower.vercel.app/war-room** (necesitas login con Clerk)
2. Verifica Subject Dossier: Desert Storm en `[COMPLETE]`, los otros en `[LOCKED]`
3. Chat con Sentinel para validar el CID intelligence

---

# TUTORIAL C: Usando herramientas avanzadas de Kali

> Estas son herramientas reales de pentesting. Vienen pre-instaladas en Kali o se instalan facilmente.

---

## sqlmap — SQL Injection automatizado

### Que es?
`sqlmap` es una herramienta que automatiza la deteccion y explotacion de SQL injection. Envara muchas peticiones con diferentes payloads SQLI.

### Como instalarlo (si no esta)
```bash
sudo apt update && sudo apt install sqlmap -y
```

### Como usarlo contra The Watchtower
```bash
# Contra localhost
sqlmap -u "http://192.168.1.100:3000/search?q=test" \
  --headers="X-CID: CID-442-X" \
  --level=1 --risk=1 --batch

# Contra produccion
sqlmap -u "https://the-watchtower.vercel.app/search?q=test" \
  --headers="X-CID: CID-442-X" \
  --level=1 --risk=1 --batch
```

**Explicacion de flags**:
- `-u` = URL objetivo con un parametro inyectable (`q=test`)
- `--headers` = agrega tu CID como header
- `--level=1` = nivel de pruebas (1=basico, 5=agresivo). Usa 1 para empezar
- `--risk=1` = riesgo de los payloads (1=seguro, 3=agresivo). Usa 1 para empezar
- `--batch` = responde "si" automaticamente a todas las preguntas (no interactivo)

> **Nota**: sqlmap envia cientos de peticiones pero solo el PRIMER payload SQLI que matchee contara como tecnica unica. Las repeticiones son deduplicadas.

---

## nikto — Scanner de vulnerabilidades web

### Que es?
`nikto` escanea servidores web buscando archivos peligrosos, configuraciones inseguras, y vulnerabilidades conocidas. Envia muchos path traversal y LFI automaticamente.

### Como instalarlo (si no esta)
```bash
sudo apt update && sudo apt install nikto -y
```

### Como usarlo
```bash
# Contra localhost
nikto -h http://192.168.1.100:3000 -H "X-CID: CID-442-X"

# Contra produccion
nikto -h https://the-watchtower.vercel.app -H "X-CID: CID-442-X"
```

**Explicacion de flags**:
- `-h` = host/URL objetivo
- `-H` = header personalizado (tu CID)

> **Resultado esperado**: nikto puede disparar `EXT_PATH_TRAVERSAL` y `EXT_LFI` automaticamente por los paths que escanea.

---

## wfuzz — Fuzzer de parametros

### Que es?
`wfuzz` envia muchas peticiones reemplazando una palabra clave (`FUZZ`) con palabras de un diccionario. Es util para encontrar inyecciones.

### Como instalarlo (si no esta)
```bash
sudo apt update && sudo apt install wfuzz -y
```

### Como usarlo
```bash
# Fuzzing con payloads SQLI contra localhost
wfuzz -H "X-CID: CID-442-X" \
  -w /usr/share/wordlists/wfuzz/Injections/SQL.txt \
  --hc 404 \
  "http://192.168.1.100:3000/search?q=FUZZ"

# Fuzzing con payloads XSS contra produccion
wfuzz -H "X-CID: CID-442-X" \
  -w /usr/share/wordlists/wfuzz/Injections/XSS.txt \
  --hc 404 \
  "https://the-watchtower.vercel.app/search?q=FUZZ"
```

**Explicacion de flags**:
- `-H` = header con tu CID
- `-w` = wordlist (diccionario de payloads). Kali trae varios en `/usr/share/wordlists/`
- `--hc 404` = ocultar respuestas 404 (reducir ruido)
- `FUZZ` = la palabra que wfuzz reemplaza con cada linea del diccionario

> **Si no existe la wordlist**: `sudo apt install wordlists -y` para instalar los diccionarios.

---

## nmap — Scanner de puertos (bonus)

### Que es?
`nmap` escanea puertos abiertos de un servidor. No dispara tecnicas directamente en The Watchtower (no envia payloads con CID), pero es util para reconocimiento.

### Como usarlo
```bash
# Escaneo basico contra localhost
nmap -sV 192.168.1.100 -p 3000

# Escaneo contra produccion (solo puerto 443)
nmap -sV the-watchtower.vercel.app -p 443
```

> **Nota**: nmap NO envara tu CID, asi que no disparara tecnicas en The Watchtower. Es solo para reconocimiento de puertos.

---

# REFERENCIA RAPIDA

## Las 5 formas de enviar tu CID

| # | Metodo | Ejemplo |
|---|--------|---------|
| 1 | Header X-CID | `-H "X-CID: CID-442-X"` |
| 2 | Header X-Sentinel-CID | `-H "X-Sentinel-CID: CID-442-X"` |
| 3 | Query parameter | `?cid=CID-442-X` |
| 4 | Authorization | `-H "Authorization: CID CID-442-X"` |
| 5 | Cookie | `-b "watchtower_cid=CID-442-X"` |

## Las 7 tecnicas detectadas

| # | Tecnica | Payload ejemplo | Score |
|---|---------|-----------------|-------|
| 1 | EXT_SQLI | `' OR 1=1--` | +5 |
| 2 | EXT_XSS | `<script>alert(1)</script>` | +5 |
| 3 | EXT_PATH_TRAVERSAL | `../../../../etc/passwd` | +5 |
| 4 | EXT_CMD_INJECTION | `; cat /etc/passwd` | +5 |
| 5 | EXT_SSRF | `http://169.254.169.254/metadata` | +5 |
| 6 | EXT_LFI | `php://filter/resource=config` | +5 |
| 7 | EXT_HEADER_INJECTION | `%0d%0aSet-Cookie: x=y` | +5 |

## Hoja de ruta de scoring

```
Inicio (ya tienes CID):          ~20%
+ 1er ataque unico:              ~25%  (EXT_SQLI)
+ 2do ataque unico:              ~30%  (EXT_XSS)
+ 3er ataque unico:              ~55%  (EXT_PATH_TRAVERSAL + Desert Storm +20)
+ 4to ataque unico:              ~60%  (CAP — necesitas Overlord para pasar 60%)
+ ataques duplicados:              0   (deduplicados, no suman)
```

## Operaciones

| Operacion | Condicion | Risk Cap | Estado |
|-----------|-----------|----------|--------|
| (ninguna) | Default | 40% | Activo |
| Desert Storm | 3 tecnicas externas unicas | 60% | Implementado |
| Overlord | ??? (honeypot pendiente) | 80% | Solo columna DB |
| Rolling Thunder | ??? (honeypot pendiente) | 100% | Solo columna DB |

---

# VERIFICACION Y TROUBLESHOOTING

## Checklist post-testing

### Despues de cada ataque:
- [ ] La terminal muestra la caja ASCII con CID y tecnica correctos
- [ ] El risk score subio +5 (o 0 si es duplicado)
- [ ] Para ver headers de respuesta usa `curl -v`: busca `X-Sentinel-Score` y `X-Sentinel-Duplicate`

### Despues de Desert Storm:
- [ ] La caja ASCII muestra `★ OPERATION DESERT STORM — UNLOCKED`
- [ ] Score salto +25 (5 tecnica + 20 bonus)
- [ ] En el War Room > Subject Dossier: Desert Storm en `[COMPLETE]` verde
- [ ] Overlord y Rolling Thunder en `[LOCKED]` gris
- [ ] Risk cap ahora es 60% (era 40%)

### Test de deduplicacion:
- [ ] Envia el mismo ataque 2 veces (ej: SQLI dos veces)
- [ ] La segunda vez: `X-Sentinel-Duplicate: true` y score NO cambia

### Verificacion en DB (Neon):
```sql
-- Ver tu sesion
SELECT alias, cid, risk_score, external_technique_count,
       operation_desert_storm, unique_technique_count
FROM user_sessions
WHERE cid = 'CID-442-X';

-- Ver eventos externos
SELECT event_type, payload, risk_score_impact, timestamp
FROM security_events
WHERE fingerprint = (SELECT fingerprint FROM user_sessions WHERE cid = 'CID-442-X')
  AND event_type LIKE 'EXT_%'
ORDER BY timestamp DESC;
```

---

## Errores comunes

| Error | Causa | Solucion |
|-------|-------|----------|
| `CID not found` (404) | Tu CID no existe en la DB | Visita la web, llega a 20% risk, y anota el CID |
| `Invalid or missing CID` (400) | Formato incorrecto | Formato: `CID-XXX-Y` (3 digitos + 1 letra/digito). Ej: `CID-442-X` |
| Respuesta HTML en vez de ASCII | El middleware no intercepto | Usa el Metodo Directo (POST a `/api/sentinel/external`) |
| `connection refused` | Servidor no accesible | Verifica IP, puerto 3000, firewall, que `pnpm dev` esta corriendo |
| Score no cambia | Tecnica duplicada o cap alcanzado | Usa una tecnica diferente. Verifica cap (40% sin ops, 60% con DS) |
| `curl: command not found` | curl no instalado en Kali | `sudo apt update && sudo apt install curl -y` |
| Timeout / no respuesta | Problema de red | Prueba `ping TU-IP` primero. En produccion verifica internet |

---

# REGISTRO DE PRUEBAS (TEST LOG)

## Sesión: 2026-02-11
**Estado**: EXITOSO
**Objetivo**: Validar detección de Kali CID y desbloqueo de Operation Desert Storm.

### Resultados Verificados:
1. **Conectividad**:
   - Kali -> Windows Host (`192.168.8.111`): **OK**
   - **Fix**: Se requirió añadir soporte `GET` en `/api/sentinel/external` (error 405 inicial).

2. **Secuencia de Ataque (CID-494-S)**:
   - [x] **SQL Injection**: Detectado. Score 31% → 36%. Response ASCII recibido.
   - [x] **XSS**: Detectado. Score 36% → 41%. Detección correcta.
   - [x] **Path Traversal**: Detectado. Score 41% → 66%. **Operation Desert Storm UNLOCKED**.

3. **Verificación Visual (War Room)**:
   - Operation Desert Storm muestra estado `[COMPLETE]` en verde.
   - Risk Cap aumentó correctamente (permitiendo subir >40%).

4. **Observaciones**:
   - **Sentinel Chat (App)**: No emite respuesta/notificación en el chat de la UI cuando ocurre un ataque externo. Solo hay feedback en la terminal del atacante (ASCII) y logs en backend.
   - **App Logs**: Visibles en consola (`DETECTED: [EXT_PATH_TRAVERSAL]`).

### Comandos Utilizados (Verified Payloads):

Estos son los comandos exactos que funcionaron contra `192.168.8.111:3000` (requieren que el CID exista y tenga >20% risk):

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

# ROADMAP: PRÓXIMAS IMPLEMENTACIONES (PHASE 2 REFINEMENT)

> **Objetivo**: Esta sección describe los ajustes funcionales requeridos para mejorar la experiencia "Defensor vs Atacante". Cualquier IA que trabaje en el proyecto debe leer esto antes de tocar el código.

## 1. Feedback en Vivo del Sentinel (App Side)

Actualmente, el Sentinel responde al atacante (Terminal) pero ignora el ataque en la interfaz del defensor (Web App). Se requiere que el Sentinel "cobre vida" en la App cuando ocurre un ataque externo.

**El "Qué" (Requerimientos Funcionales):**
*   **Reactividad**: El Sentinel debe detectar ataques `EXT_*` en tiempo real (o casi real) y reaccionar en el chat de la War Room / Home sin necesidad de recargar la página.
*   **Persona & Tono**:
    *   **NO** usar plantillas genéricas tipo "Alerta de seguridad detectada".
    *   **SÍ** usar la personalidad del Sentinel: sarcástico, omnisciente, burlón superior.
    *   Debe dirigirse al usuario (defensor) comentando sobre el intento patético del atacante.
*   **Longitud Extendida (Solo Ataques Externos)**:
    *   A diferencia de los mensajes cortos habituales, las intercepciones de herramientas externas (Kali/Curl) deben ser **más detalladas**.
    *   **Extensión**: Entre **2 y 3 párrafos cortos**. Máximo 3.
    *   Esto permite explicar la técnica, burlarse del intento y reforzar la vigilancia en un solo mensaje narrativo.
*   **Contenido Dinámico**:
    *   Mencionar la técnica específica detectada (ej: "Están intentando inyectar SQL barato...").
    *   Hacer referencia a "Operation Desert Storm" si el ataque está relacionado o si se acaba de desbloquear.
    *   Burlarse de la falta de sofisticación del atacante ("Script kiddie detectado").
*   **Variabilidad**: Evitar muletillas repetitivas. Cada intercepción debe sentirse como un comentario único de una IA consciente que observa el tráfico.

## 2. Sincronización de Estado en Tiempo Real (No Refresh)
Actualmente, los efectos del ataque (logs rojos, aumento de Risk Score, desbloqueo de Operaciones) solo se ven al refrescar la página. Esto rompe la inmersión de "monitoreo en vivo".

**El "Qué" (Requerimientos Funcionales):**
*   **Logs Violentos**: El log del ataque (`DETECTED: [EXT_SQLI]`) debe aparecer instantáneamente en la consola/HUD del defensor.
*   **Score Updates**: El porcentaje de riesgo y el Risk Cap deben actualizarse en vivo (ej: saltar de 40% a 66% automáticamente).
*   **Operations Status**: Si un ataque desbloquea "Desert Storm", el estado en el *Subject Dossier* debe cambiar de `[LOCKED]` a `[COMPLETE]` (verde) en tiempo real ante los ojos del usuario.

## 3. Ajustes de Respuesta en Terminal (Kali)
La respuesta ASCII actual revela demasiadas métricas internas. Se requiere un enfoque más narrativo y opaco ("Security by Obscurity").

**Cambios Requeridos:**
*   **Eliminar Métricas Numéricas**:
    *   Quitar `Risk Score: X% → Y%`.
    *   Quitar `Unique External Techniques: X/3` (No revelar la condición de victoria).
*   **Status de Operación (Desert Storm)**:
    *   En lugar de contadores, mostrar el estado de la operación:
        *   Técnica 1: `OPERATION DESERT STORM: INITIATED`
        *   Técnica 2: `OPERATION DESERT STORM: IN PROGRESS (66%)`
        *   Técnica 3: `OPERATION DESERT STORM: UNLOCKED`
*   **Mensaje Expandido**:
    *   El mensaje al pie de la caja ASCII debe ser un párrafo más largo (no una línea simple).
    *   Debe dirigirse al **Alias** del atacante.
    *   Explicar con sarcasmo que el intento ha sido registrado.
*   **ASCII Banner (Branding)**:
    *   Encima de la caja de respuesta, imprimir "THE WATCHTOWER" en arte ASCII grande y legible.
    *   Esto refuerza la identidad visual de la plataforma en la terminal del atacante.








