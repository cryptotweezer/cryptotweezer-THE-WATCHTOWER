import { useState, useRef, useEffect, useCallback } from "react";
import useStableIdentity from "@/hooks/useStableIdentity";

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
};

interface SentinelManagerProps {
    identity: {
        alias: string;
        fingerprint: string | null;
        riskScore: number;
        ip: string | null;
    };
    invokePath?: string;
}

export default function useSentinelManager({ identity, invokePath }: SentinelManagerProps) {
    // 1. STABLE IDENTITY ANCHOR
    const stableFingerprint = useStableIdentity(identity.fingerprint);

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

    // V33: Strict Mode Latch to prevent double-counting in Dev
    const processedPathRef = useRef<string | null>(null);

    // 2. SENTINEL TRIGGER (The Reaction)
    const triggerSentinel = useCallback(async (prompt: string, eventType: string, skipRisk: boolean = false) => {
        if (isStreamingRef.current) return;

        // Unique Technique Guard
        // EXCEPTIONS: Handshake (Once per Boot), Warnings (Logic Driven), Routing (Path Dependent)
        const EXCEPTIONS = [TECHNIQUES.HANDSHAKE, TECHNIQUES.WARNING, TECHNIQUES.ROUTING];
        if (!EXCEPTIONS.includes(eventType)) {
            if (knownTechniquesRef.current.includes(eventType)) return;
            knownTechniquesRef.current.push(eventType);
        }

        // Persistence (Atomic)
        try {
            const currentStored = JSON.parse(localStorage.getItem("sentinel_techniques") || "[]");
            const updated = Array.from(new Set([...currentStored, eventType]));
            localStorage.setItem("sentinel_techniques", JSON.stringify(updated));
            setSessionTechniques(updated as string[]);
        } catch (e) { console.error("Storage Sync Error:", e); }

        // Event Log
        const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
        const routePath = (eventType === TECHNIQUES.ROUTING || eventType === TECHNIQUES.WARNING) && invokePath ? invokePath : "";
        const displayEvent = routePath ? `${eventType} -> ${routePath}` : eventType;
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
                switch (eventType) {
                    case TECHNIQUES.INSPECTION: impact = 5; break;
                    case TECHNIQUES.SURFACE: impact = 2; break;
                    case TECHNIQUES.EXFIL: impact = 1; break;
                    case TECHNIQUES.CONTEXT: impact = 1; break;
                    case "FOCUS_LOSS_ANOMALY": impact = 1; break;
                    case TECHNIQUES.ROUTING: impact = 10; break;
                    case TECHNIQUES.INJECTION: impact = 20; break;
                    default: impact = 0;
                }

                // Standard Exception Logic
                if (EXCEPTIONS.includes(eventType) && eventType !== TECHNIQUES.ROUTING) return currentScore;

                let newScore = currentScore + impact;

                // V33: Global 20% Hard Cap for Browser & Routine Events
                const CAPPED_EVENTS = [
                    TECHNIQUES.INSPECTION,
                    TECHNIQUES.SURFACE,
                    TECHNIQUES.EXFIL,
                    TECHNIQUES.CONTEXT,
                    "FOCUS_LOSS_ANOMALY",
                    TECHNIQUES.ROUTING // Routing is now capped at 20 max for the category
                ];

                if (CAPPED_EVENTS.includes(eventType)) {
                    // Rule: If the new score exceeds 20 for these events, clamp it.
                    // But if it was already > 20 (e.g. Injection), we don't reduce it, just add 0.
                    if (currentScore < 20) {
                        newScore = Math.min(newScore, 20);
                    } else if (currentScore >= 20) {
                        // If we are already at or above 20, these events cannot add more risk.
                        newScore = currentScore;
                    }
                }

                newScore = Math.min(newScore, 100);
                localStorage.setItem("sentinel_risk_score", newScore.toString());
                riskScoreRef.current = newScore;
                return newScore;
            });
        }

        if (prompt === "SILENCE") return;

        isStreamingRef.current = true;
        setStreamText("");

        try {
            const response = await fetch('/api/sentinel', {
                method: 'POST',
                headers: { 'x-cid': cid.replace(/(CID-)+/g, "CID-") },
                body: JSON.stringify({
                    prompt,
                    eventType,
                    fingerprint: stableFingerprint || "GHOST_OPERATOR",
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
            const tagMatch = accumulated.match(/\[TECHNIQUE:\s*(.*?)\]/);
            if (tagMatch) cleanText = accumulated.replace(tagMatch[0], "").trim();

            setStreamText("");
            setHistory(prev => {
                const newHistory = [cleanText, ...prev].slice(0, 3);
                localStorage.setItem("sentinel_chat_history", JSON.stringify(newHistory));
                return newHistory;
            });

        } catch (err) {
            console.error("Sentinel Downlink Failed:", err);
            setStreamText("");
        } finally {
            isStreamingRef.current = false;
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
        const storedCid = localStorage.getItem("sentinel_cid");

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

        // CID Logic
        let activeCid = storedCid;
        if (activeCid && activeCid.includes("CID-CID-")) {
            activeCid = activeCid.replace(/^(CID-)+/, "CID-");
            localStorage.setItem("sentinel_cid", activeCid);
        }
        if (!activeCid || !/CID-[0-9A-F]{4}-\d$/.test(activeCid || "")) {
            activeCid = `CID-${Math.random().toString(16).slice(2, 6).toUpperCase()}-${Math.floor(Math.random() * 9)}`;
            localStorage.setItem("sentinel_cid", activeCid);
        }
        setCid(activeCid);

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
            const isSuspicious = invokePath !== "/" && invokePath !== "/unknown";
            const isMathProbe = /[\d=+\-*/]/.test(invokePath) && invokePath.length < 20;

            // V33: Exact Latching to prevent Strict Mode Double-Count
            if (isSuspicious && processedPathRef.current !== invokePath) {
                processedPathRef.current = invokePath; // Latch immediately

                const currentProbeCount = parseInt(localStorage.getItem("sentinel_probe_count") || "0", 10);
                const newProbeCount = currentProbeCount + 1;
                localStorage.setItem("sentinel_probe_count", newProbeCount.toString());

                // PROTOCOL OF 3:
                // Attempts 1, 2, 3: LOGGED.
                // Attempt 4+: SILENT (return).
                if (newProbeCount > 3) {
                    return;
                }

                if (isMathProbe) {
                    // Points Logic: 
                    // 1 & 2 = Skip Risk (Points 0)
                    // 3 = Add Risk (Points 10, subject to Cap)
                    // 4+ = Blocked above.
                    const skipRisk = newProbeCount < 3;

                    triggerSentinel(
                        "SECURITY ALERT: HOSTILE ROUTING PROBE DETECTED.",
                        TECHNIQUES.ROUTING,
                        skipRisk
                    );
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
