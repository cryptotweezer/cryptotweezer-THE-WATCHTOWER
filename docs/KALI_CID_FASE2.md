# PLAN DE DESARROLLO: KALI CID FASE 2

> **Objetivo**: Implementar la sincronización en tiempo real entre la actividad externa (Kali Linux) y la UI del Defensor (Web App), además de refinar la experiencia del atacante en la terminal con una narrativa más inmersiva.

## 1. Visión General
Esta fase se centra en cerrar el ciclo de feedback. Actualmente, los ataques externos son "invisibles" para el defensor hasta que refresca la página. Queremos que el Sentinel reaccione en vivo, burlándose del atacante y mostrando alertas rojas instantáneas. Por otro lado, la terminal del atacante recibirá un "lavado de cara" para ocultar métricas de juego y parecer más un sistema de defensa real.

---

## 2. Arquitectura de Cambios

### A. Sincronización en Tiempo Real (Backend -> Frontend)
Dado que los ataques ocurren fuera del contexto del navegador, el frontend no tiene forma de saber que hubo un ataque sin preguntar. Implementaremos un mecanismo de **Polling Eficiente**.

#### [NUEVO] Endpoint: `/api/sentinel/sync`
- **Método**: `GET`
- **Frecuencia**: Cada 4-5 segundos (solo si el usuario está autenticado).
- **Respuesta JSON**:
  ```json
  {
    "latestEvent": {
      "id": "uuid-del-evento",
      "type": "EXT_SQLI",
      "timestamp": "2026-02-11T...",
      "payload": "' OR 1=1"
    },
    "riskScore": 66,
    "riskCap": 80,
    "operations": {
      "desertStorm": true
    }
  }
  ```

### B. Cerebro del Sentinel (Frontend Logic)
El corazón de la reactividad estará en `SentinelContext.tsx`.

1.  **Polling Loop**: Un `useInterval` consultará `/api/sentinel/sync`.
2.  **Detector de Cambios**:
    - Si `riskScore` cambia -> Actualizar UI (Barra de progreso roja).
    - Si `operations.desertStorm` pasa de `false` a `true` -> Disparar efecto de desbloqueo (Texto verde Matrix).
3.  **Trigger de Narrativa**:
    - Si `latestEvent.id` es nuevo y es tipo `EXT_`:
        - Invocar a la AI del Sentinel: `triggerSentinel("EXT_ATTACK_DETECTED")`.
        - **Prompt**: "Acabo de detectar un ataque externo [Técnica] desde [IP]. Búrlate del atacante (Alias: [Alias]). Menciona si Desert Storm está activa."

### C. Experiencia del Atacante (Terminal ASCII)
Refactorización de `/api/sentinel/external/route.ts` para ser más críptico e intimidante.

1.  **ASCII Banner**: Cabecera "THE WATCHTOWER" en arte ASCII.
2.  **Ocultación de Métricas**:
    - Eliminar: `Risk Score: 22% -> 27%` (El atacante no debe saber su puntaje exacto).
    - Eliminar: `Unique Techniques: 1/3` (No revelar condiciones de victoria explícitas).
3.  **Estado de Operación**:
    - Reemplazar contadores con estado narrativo:
        - Nivel 1: `OPERATION DESERT STORM: INITIATED`
        - Nivel 2: `OPERATION DESERT STORM: IN PROGRESS`
        - Nivel 3: `OPERATION DESERT STORM: UNLOCKED`
4.  **Mensajes Expandidos**:
    - Respuestas de 2-3 párrafos generadas específicamente para cada técnica, con alto contenido de "lore" y sarcasmo.

---

## 3. Plan de Ejecución Paso a Paso

### Paso 1: Backend & Sync (Cimientos)
- [ ] Crear `src/app/api/sentinel/sync/route.ts`.
- [ ] Implementar lógica de consulta a DB (último evento + estado de sesión).

### Paso 2: Frontend Reactivity (Ojos del Defensor)
- [ ] Modificar `src/contexts/SentinelContext.tsx`.
- [ ] Agregar hook de polling `useInterval`.
- [ ] Conectar actualizaciones de estado (RiskScore, RiskCap).
- [ ] Implementar trigger para eventos externos (`EXT_*`).

### Paso 3: Terminal Experience (Cara del Sentinel al Enemigo)
- [ ] Modificar `src/app/api/sentinel/external/route.ts`.
- [ ] Integrar banner ASCII.
- [ ] Ajustar lógica de respuesta (ocultar métricas, nuevo formato de status).
- [ ] Redactar los nuevos mensajes largos (2-3 párrafos) para cada técnica.

### Paso 4: Verificación Integral
- [ ] **Prueba de Fuego**: Lanzar ataque desde Kali y ver:
    1.  Terminal: Banner nuevo + Mensaje largo.
    2.  App (War Room): Alerta inmediata del Sentinel + Subida de riesgo visual.

---

## 4. Notas para la IA Desarrolladora
- **Prioridad**: La inmersión es clave. No romper el personaje.
- **Performance**: El endpoint `/sync` debe ser muy ligero (solo lectura de índices).
- **Seguridad**: Validar siempre que quien consulta `/sync` es el dueño de la sesión (Fingerprint/Clerk ID).
