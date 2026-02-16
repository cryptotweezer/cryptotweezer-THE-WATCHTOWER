import { useState, useRef, useEffect, useCallback } from "react";

const TECHNIQUES = {
    INSPECTION: "FORENSIC_INSPECTION_ACTIVITY",
    SURFACE: "UI_SURFACE_ANALYSIS",
    EXFIL: "DATA_EXFILTRATION_ATTEMPT",
    CONTEXT: "CONTEXT_SWITCH_ANOMALY",
    ROUTING: "ROUTING_PROBE_HEURISTICS",
    HANDSHAKE: "System Handshake",
    PROTOCOL: "PROTOCOL_VIOLATION",
    INJECTION: "MEMORY_INJECTION_ATTEMPT",
    WARNING: "SECURITY_WARNING_PROTOCOL",
    // Ghost Sensor Sub-Categories
    DOM: "HEURISTIC_DOM",
    DRAG: "HEURISTIC_DRAG",
    FUZZ: "HEURISTIC_FUZZ"
};

// V40: RISK DEBUGGER
const LOG_RISK = (action: string, details: Record<string, unknown>) => {
    console.log(`[RISK_ENGINE] ${action}:`, details);
};


interface SentinelManagerProps {
    identity: {
        alias: string;
        fingerprint: string | null;
        cid?: string | null;
        riskScore: number;
        ip: string | null;
    };
    invokePath?: string;
}

export default function useSentinelManager({ identity, invokePath }: SentinelManagerProps) {
    // 1. STABLE IDENTITY ANCHOR
    const stableFingerprint = identity.fingerprint;

    // STATE
    const [accessGranted, setAccessGranted] = useState(false);
    const [history, setHistory] = useState<string[]>([]);
    const [eventLog, setEventLog] = useState<string[]>([]);
    const [streamText, setStreamText] = useState("");
    const [currentRiskScore, setCurrentRiskScore] = useState(0);
    const [sessionTechniques, setSessionTechniques] = useState<string[]>([]);
    const [cid, setCid] = useState<string>("");

    // REFS
    const isStreamingRef = useRef(false);
    const knownTechniquesRef = useRef<string[]>([]);
    const riskScoreRef = useRef(0);
    const isSystemReadyRef = useRef(false);
    const hasInitialized = useRef(false);

    // V34: AbortController for Stream Stability
    const abortControllerRef = useRef<AbortController | null>(null);

    // V33: Strict Mode Latch to prevent double-counting in Dev
    const processedPathRef = useRef<string | null>(null);

    // 2. SENTINEL TRIGGER (The Reaction)
    // 2. SENTINEL TRIGGER (The Reaction)
    // 2. SENTINEL TRIGGER (The Reaction)
    const triggerSentinel = useCallback(async (prompt: string, eventType: string, skipRisk: boolean = false) => {

        // V36 FIX: UNIQUE GUARD MUST BE FIRST.
        // Reason: If a "Known" event comes in, it must NOT abort an "Active" event.
        // It should just be ignored immediately.

        // EXCEPTIONS: Handshake (Once per Boot), Warnings (Logic Driven), Routing (Path Dependent), Identity Reveal (Sacred)
        const EXCEPTIONS = [TECHNIQUES.HANDSHAKE, TECHNIQUES.WARNING, TECHNIQUES.ROUTING, "IDENTITY_REVEAL_PROTOCOL"];
        if (!EXCEPTIONS.includes(eventType)) {
            if (knownTechniquesRef.current.includes(eventType)) return;
            // Note: We push to knownTechniquesRef AFTER successful start or here?
            // If we push here, we commit to it. 
            // Let's keep the push here to prevent rapid-fire duplicates from passing.
            knownTechniquesRef.current.push(eventType);
        }

        // V36: PRIORITY QUEUE LOGIC (Fixing "Silence" Race Conditions)
        // Scenario: User opens DevTools (Forensic) -> Browser loses focus (Focus Loss).
        // Old Logic: Focus Loss aborts Forensic. Forensic is burned. Focus Loss might be burned. Result: Silence.
        // New Logic: Low Priority events do NOT abort active streams. They are dropped if busy.

        const LOW_PRIORITY = [
            TECHNIQUES.CONTEXT,
            "FOCUS_LOSS_ANOMALY",
            TECHNIQUES.SURFACE
        ];

        if (abortControllerRef.current) {
            // 1. If incoming is Low Priority and we are busy, DROP IT.
            // (Even if it is NEW, if we are busy with High Prio, we drop it to save the High Prio).
            if (LOW_PRIORITY.includes(eventType)) {
                // If we dropped it, we should probably remove it from 'known' so it can try again later?
                // Or "Resistance is futile" means even if dropped it counts?
                // User said "First time... message". If we drop it, no message.
                // So maybe we should pop it back?
                // Let's leave it simple for now: If dropped, it's burnt. "You were too slow".
                return;
            }

            // 2. If incoming is Normal/High, ABORT the previous (Unless it's the Reveal).
            if (eventType !== "IDENTITY_REVEAL_PROTOCOL") {
                abortControllerRef.current.abort();
                abortControllerRef.current = null;
            }
        }

        // Initialize new controller for this request
        const controller = new AbortController();
        abortControllerRef.current = controller;
        isStreamingRef.current = true; // Lock UI immediately

        // Persistence (Atomic)
        try {
            const currentStored = JSON.parse(localStorage.getItem("sentinel_techniques") || "[]");
            const updated = Array.from(new Set([...currentStored, eventType]));
            localStorage.setItem("sentinel_techniques", JSON.stringify(updated));
            setSessionTechniques(updated as string[]);
        } catch (e: unknown) { console.error("Storage Sync Error:", e); }

        // Event Log
        const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
        let displayEvent = eventType;

        // DISPLAY MAP: Clean up technical events for the UI log
        if (eventType === "IDENTITY_REVEAL_PROTOCOL") {
            displayEvent = "TAGGED: SCRIPT-KIDDIE";
        } else if (eventType === TECHNIQUES.ROUTING || eventType === TECHNIQUES.WARNING) {
            const routePath = invokePath ? invokePath : "UNKNOWN"; // Use invokePath directly
            displayEvent = `${eventType} -> ${routePath}`;
        }

        const logEntry = `> [${timestamp}] DETECTED: [${displayEvent}]`;

        setEventLog(prev => {
            const newLog = [logEntry, ...prev].slice(0, 10);
            localStorage.setItem("sentinel_event_log", JSON.stringify(newLog));
            return newLog;
        });

        // Risk Scoring
        if (!skipRisk) {
            setCurrentRiskScore(currentScore => {
                let impact = 0;
                // V41: INFAMY THERMOMETER WEIGHTS (No Tiers, Pure Accumulation)
                switch (eventType) {
                    case TECHNIQUES.INSPECTION: impact = 5; break;  // Tech: +5%
                    case TECHNIQUES.SURFACE: impact = 2; break;     // Tech: +2%
                    case TECHNIQUES.EXFIL: impact = 2; break;       // Tech: +2%
                    case TECHNIQUES.CONTEXT: impact = 2; break;     // Tech: +2%
                    case "FOCUS_LOSS_ANOMALY": impact = 2; break;   // Tech: +2%
                    case TECHNIQUES.ROUTING: impact = 5; break;     // Tech: +5%

                    // Heuristics (Aggressive)
                    case TECHNIQUES.DOM: impact = 10; break;        // Heuristic: +10%
                    case TECHNIQUES.DRAG: impact = 10; break;       // Heuristic: +10%
                    case TECHNIQUES.FUZZ: impact = 5; break;        // Heuristic: +5%

                    // Critical
                    case TECHNIQUES.INJECTION: impact = 20; break;
                    default: impact = 0;
                }

                // Standard Exception Logic (Routing is no longer an exception for scoring, it adds +5%)
                if (EXCEPTIONS.includes(eventType) && eventType !== TECHNIQUES.ROUTING) return currentScore;

                let newScore = currentScore + impact;

                // Global cap: 90% max (Rolling Thunder unlocks the ceiling)
                newScore = Math.min(newScore, 90);

                LOG_RISK("INFAMY_UPDATE", { event: eventType, current: currentScore, impact, new: newScore });

                localStorage.setItem("sentinel_risk_score", newScore.toString());
                riskScoreRef.current = newScore;
                return newScore;
            });
        }

        if (prompt === "SILENCE") return;

        isStreamingRef.current = true;
        setStreamText("");

        // CRITICAL IDENTITY GUARD: No Fingerprint = No Event.
        // We strictly forbid "GHOST_OPERATOR" or anonymous events.
        const activeFingerprint = stableFingerprint || identity.fingerprint;

        if (!activeFingerprint || activeFingerprint === "unknown") {
            console.warn("Sentinel Trigger Aborted: No Identity Available yet.");
            return;
        }

        try {
            const response = await fetch('/api/sentinel', {
                method: 'POST',
                headers: { 'x-cid': cid.replace(/(CID-)+/g, "CID-") },
                signal: controller.signal, // Attach Abort Signal
                body: JSON.stringify({
                    prompt,
                    eventType,
                    fingerprint: activeFingerprint, // STRICT IDENTITY
                    ipAddress: identity.ip,
                    alias: identity.alias || "Unknown User",
                    location: "Australia/Sydney",
                    threatLevel: identity.riskScore > 50 ? "High" : "Low",
                    riskScore: riskScoreRef.current
                })
            });

            if (!response.body) throw new Error("No response body");

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let accumulated = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                accumulated += chunk;
                setStreamText((prev) => prev + chunk);
            }

            let cleanText = accumulated;
            // UNIVERSAL TAG CLEANER: Remove any [TYPE: VALUE] tag from the end of the message (Aggressive).
            const tagMatch = accumulated.match(/\[TECHNIQUE:\s*(.*?)\]/);

            if (tagMatch) {
                // V38: TRUE NAMING PROTOCOL (Log Transformation)
                const trueTechniqueName = tagMatch[1];
                cleanText = accumulated.replace(tagMatch[0], "").trim();

                // RESTRICT TO HEURISTICS ONLY
                const isHeuristic = eventType.startsWith("HEURISTIC_");

                if (trueTechniqueName !== "INVENTED_NAME" && isHeuristic) {
                    setEventLog(prev => {
                        const newLog = [...prev];
                        // Replace the MOST RECENT log (index 0) if it matches the generic technical name
                        // Or just force update index 0 because we are in the same flow.
                        if (newLog.length > 0) {
                            const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
                            newLog[0] = `> [${timestamp}] DETECTED: [${trueTechniqueName}]`; // Rewrite History
                        }
                        localStorage.setItem("sentinel_event_log", JSON.stringify(newLog));
                        return newLog;
                    });
                }
            } else {
                const genericTag = accumulated.match(/\[.*?:.*?\]\s*$/);
                if (genericTag) cleanText = accumulated.replace(genericTag[0], "").trim();
            }

            setStreamText("");
            setHistory(prev => {
                const newHistory = [cleanText, ...prev].slice(0, 3);
                localStorage.setItem("sentinel_chat_history", JSON.stringify(newHistory));
                return newHistory;
            });

        } catch (err: unknown) {
            if (err instanceof Error && err.name === 'AbortError') {
                console.log("Sentinel Stream Aborted (New Trigger Priority)");
                return; // Silent exit
            }
            console.error("Sentinel Downlink Failed:", err);
            setStreamText("");
        } finally {
            // Only unlock if we are the current active controller (avoids race conditions)
            if (abortControllerRef.current === controller) {
                isStreamingRef.current = false;
                abortControllerRef.current = null;
            }
        }

    }, [stableFingerprint, cid, identity, invokePath]);

    // 3. INITIALIZATION & ROUTING
    useEffect(() => {
        // --- RESTORE STATE ---
        const storedAccess = localStorage.getItem("watchtower_access");
        if (storedAccess === "granted") setAccessGranted(true);

        const storedHistory = localStorage.getItem("sentinel_chat_history");
        const storedEventLog = localStorage.getItem("sentinel_event_log");
        const storedTechniques = localStorage.getItem("sentinel_techniques");
        const storedRisk = localStorage.getItem("sentinel_risk_score");

        if (storedHistory) setHistory(JSON.parse(storedHistory).filter((msg: string) => !msg.includes("DETECTED:")));
        if (storedEventLog) setEventLog(JSON.parse(storedEventLog));
        if (storedTechniques) {
            const parsed = JSON.parse(storedTechniques);
            setSessionTechniques(parsed);
            knownTechniquesRef.current = parsed;
        }
        if (storedRisk) {
            const score = Number(storedRisk);
            setCurrentRiskScore(score);
            riskScoreRef.current = score;
        }

        // CID Logic (Strict Source of Truth: SERVER ONLY)
        // We do NOT generate random CIDs here. We wait for the DB Handshake.
        if (identity.cid && identity.cid !== "unknown") {
            setCid(identity.cid);
        }

        // --- POISON ---
        if (typeof window !== "undefined" && !Object.prototype.hasOwnProperty.call(window, '_VGT_DEBUG_')) {
            Object.defineProperty(window, '_VGT_DEBUG_', {
                get: function () {
                    console.warn(">> SECURITY BREACH DETECTED: ILLEGAL MEMORY ACCESS <<");
                    return "ACCESS DENIED. TRACE STARTED.";
                },
                configurable: false
            });
        }

        // --- ROUTING LOGIC (PRIORITY ZERO - Before Handshake) ---
        if (invokePath) {
            // NOISE FILTER: Ignore system paths
            const isSystemPath =
                invokePath.includes(".well-known") ||
                invokePath.includes("favicon") ||
                invokePath.includes("_next/static");

            const isSuspicious = invokePath !== "/" && invokePath !== "/unknown" && !isSystemPath;

            // "The system must no longer award points for individual routing attempts... tracks UNIQUE routes."
            // "Only when the user reaches 3 different routes... trigger Strike".

            if (isSuspicious && processedPathRef.current !== invokePath) {
                processedPathRef.current = invokePath; // Latch immediately

                // Protocol of 3: Persistence
                const storedPaths = JSON.parse(localStorage.getItem("sentinel_invoked_paths") || "[]");

                // If this path is NEW, add it.
                if (!storedPaths.includes(invokePath)) {
                    const newPaths = [...storedPaths, invokePath];
                    localStorage.setItem("sentinel_invoked_paths", JSON.stringify(newPaths));

                    const uniqueCount = newPaths.length;

                    if (uniqueCount === 3) {
                        triggerSentinel(
                            "SECURITY ALERT: HOSTILE ROUTING PATTERN (TRIPLICATE).",
                            TECHNIQUES.ROUTING,
                            false // STRIKE: This is the 11% Penalty
                        );
                    } else if (uniqueCount < 3) {
                        // 1st & 2nd probes are logged but scored as 0 (Warnings)
                        triggerSentinel(
                            `Routing Probe: ${invokePath}`,
                            TECHNIQUES.ROUTING,
                            true // SKIP RISK
                        );
                    }
                    // STRIKE 4+ -> SILENCE. (No API Trigger)
                } else {
                    // Path already visited. Ignore.
                }
            }
        }

        // --- ATOMIC HANDSHAKE & SESSION MEMORY ---
        if (!hasInitialized.current) {
            hasInitialized.current = true;

            // V29: Check for Active Session to prevent "Amnesia"
            const isSessionActive = sessionStorage.getItem("sentinel_session_active");

            if (isSessionActive) {
                // SESSION RECOVERY: Skip Handshake, System is Ready.
                isSystemReadyRef.current = true;
            } else {
                // FRESH BOOT: Perform Handshake.
                setTimeout(() => {
                    triggerSentinel("System Initialization", TECHNIQUES.HANDSHAKE);
                    isSystemReadyRef.current = true;
                    sessionStorage.setItem("sentinel_session_active", "true");
                }, 0);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [invokePath, triggerSentinel]); // Empty deps for mount mostly, but triggerSentinel is stable.

    const handleAccess = () => {
        localStorage.setItem("watchtower_access", "granted");
        setAccessGranted(true);
    };

    return {
        state: {
            accessGranted,
            history,
            eventLog,
            streamText,
            currentRiskScore,
            sessionTechniques,
            cid
        },
        actions: {
            handleAccess,
            triggerSentinel
        },
        refs: {
            isSystemReadyRef,
            knownTechniquesRef,
            riskScoreRef
        }
    };
}
