"use client";

import { createContext, useContext, useState, useRef, useEffect, useCallback, ReactNode } from "react";
import { usePathname } from "next/navigation";
import useDevTools from "@/hooks/useDevTools";


// ============= CONSTANTS =============
const TECHNIQUES = {
    FOCUS: "FOCUS_LOSS_ANOMALY",
    INSPECTION: "FORENSIC_INSPECTION_ACTIVITY",
    SURFACE: "UI_SURFACE_ANALYSIS",
    EXFIL: "DATA_EXFILTRATION_ATTEMPT",
    CONTEXT: "CONTEXT_SWITCH_ANOMALY",
    ROUTING: "ROUTING_PROBE_HEURISTICS",
    HANDSHAKE: "System Handshake",
    PROTOCOL: "PROTOCOL_VIOLATION",
    INJECTION: "MEMORY_INJECTION_ATTEMPT",
    WARNING: "SECURITY_WARNING_PROTOCOL",
    DOM: "HEURISTIC_DOM",
    DRAG: "HEURISTIC_DRAG",
    FUZZ: "HEURISTIC_FUZZ"
};

const NON_UNIQUE_EVENTS = [
    TECHNIQUES.HANDSHAKE,
    TECHNIQUES.WARNING,
    TECHNIQUES.ROUTING,
    "IDENTITY_REVEAL_PROTOCOL",
    "TAGGED: SCRIPT-KIDDIE", // Display name for IDENTITY_REVEAL_PROTOCOL
    "EXT_ATTACK_INTERCEPTED", // Phase 2: allows multiple external attack notifications
];

const KNOWN_ROUTES = ["/", "/war-room", "/legal", "/privacy", "/terms", "/cookies", "/unknown"];



const LOG_RISK = (action: string, details: Record<string, unknown>) => {

    console.log(`[RISK_ENGINE] ${action}:`, details);
};

// ============= TYPES =============
export interface OperationsState {
    desertStorm: boolean;
    overlord: boolean;
    rollingThunder: boolean;
}

export interface IdentityData {
    alias: string;
    fingerprint: string | null;
    cid?: string | null;
    riskScore: number;
    ip: string | null;
    countryCode?: string;
    sessionTechniques?: string[];
    uniqueTechniqueCount?: number;
    riskCap?: number; // Dynamic risk cap (default 40, raised by operations)
    operations?: OperationsState; // Phase 2: real-time operation tracking
}

interface SentinelState {
    accessGranted: boolean;
    currentRiskScore: number;
    uniqueTechniqueCount: number;
    eventLog: string[];
    history: string[];
    streamText: string;
    sessionTechniques: string[];
    cid: string;
    isIdentityReady: boolean; // Guards against "Unknown User" race condition
    operations: OperationsState; // Phase 2: real-time operation tracking
}

interface SentinelActions {
    handleAccess: () => void;
    triggerSentinel: (prompt: string, eventType: string, skipRisk?: boolean) => Promise<void>;
    hydrateFromServer: (identity: IdentityData, invokePath?: string, initialLogs?: string[]) => void;
}


interface SentinelRefs {
    isSystemReadyRef: React.RefObject<boolean>;
    knownTechniquesRef: React.RefObject<string[]>;
    riskScoreRef: React.RefObject<number>;
}

interface SentinelContextValue {
    state: SentinelState;
    actions: SentinelActions;
    refs: SentinelRefs;
    identity: IdentityData | null;
}

// ============= CONTEXT =============
const SentinelContext = createContext<SentinelContextValue | null>(null);

// ============= PROVIDER =============
export function SentinelProvider({ children }: { children: ReactNode }) {
    // STATE
    const [accessGranted, setAccessGranted] = useState(false);
    const [history, setHistory] = useState<string[]>([]);
    const [eventLog, setEventLog] = useState<string[]>([]);
    const [streamText, setStreamText] = useState("");
    const [currentRiskScore, setCurrentRiskScore] = useState(0);
    const [sessionTechniques, setSessionTechniques] = useState<string[]>([]);
    const [uniqueTechniqueCount, setUniqueTechniqueCount] = useState(0);
    const [cid, setCid] = useState<string>("");
    const [identity, setIdentity] = useState<IdentityData | null>(null);
    const [isIdentityReady, setIsIdentityReady] = useState(false); // Guards against "Unknown User" race condition
    const [isHydrated, setIsHydrated] = useState(false); // V43: Fix Race Condition for Routing Probes
    const [operations, setOperations] = useState<OperationsState>({ desertStorm: false, overlord: false, rollingThunder: false });

    // REFS
    const isStreamingRef = useRef(false);
    const knownTechniquesRef = useRef<string[]>([]);
    const riskScoreRef = useRef(0);
    const isSystemReadyRef = useRef(false);
    const hasInitialized = useRef(false);
    const abortControllerRef = useRef<AbortController | null>(null);
    const processedPathRef = useRef<string | null>(null);
    const stableFingerprint = useRef<string | null>(null);
    const currentInvokePath = useRef<string | undefined>(undefined);
    const identityRef = useRef<IdentityData | null>(null);
    const isNavigatingRef = useRef(false);
    const lastSyncTimeRef = useRef<string | null>(null);
    const pathname = usePathname();

    const prevPathnameRef = useRef(pathname);

    // NAVIGATION GUARD: Disable Sensitive Heuristics during page transitions
    // V45: Detect logic MUST run during render (before DOM commit/unmount)
    if (pathname !== prevPathnameRef.current) {
        isNavigatingRef.current = true;
        prevPathnameRef.current = pathname;
    }

    useEffect(() => {
        const timer = setTimeout(() => {
            isNavigatingRef.current = false;
        }, 1500); // 1.5s buffer for mounting/unmounting
        return () => clearTimeout(timer);
    }, [pathname]);


    // STABLE IDENTITY: Managed via hydrateFromServer (SSoT)
    // Deprecated: client-side localStorage read. 
    // We rely on Server Component to pass the identity.

    // RESTORE STATE FROM LOCALSTORAGE
    useEffect(() => {
        if (typeof window === "undefined") return;

        const storedAccess = localStorage.getItem("watchtower_access");
        if (storedAccess === "granted") setAccessGranted(true);

        const storedHistory = localStorage.getItem("sentinel_chat_history");
        const storedEventLog = localStorage.getItem("sentinel_event_log");
        const storedTechniques = localStorage.getItem("sentinel_techniques");
        const storedRisk = localStorage.getItem("sentinel_risk_score");

        if (storedHistory) {
            setHistory(JSON.parse(storedHistory).filter((msg: string) => !msg.includes("DETECTED:")));
        }
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

        // Poison trap
        if (!Object.prototype.hasOwnProperty.call(window, '_VGT_DEBUG_')) {
            Object.defineProperty(window, '_VGT_DEBUG_', {
                get: function () {
                    console.warn(">> SECURITY BREACH DETECTED: ILLEGAL MEMORY ACCESS <<");
                    return "ACCESS DENIED. TRACE STARTED.";
                },
                configurable: false
            });
        }
    }, []);

    // TRIGGER SENTINEL
    const triggerSentinel = useCallback(async (prompt: string, eventType: string, skipRisk: boolean = false) => {
        if (!NON_UNIQUE_EVENTS.includes(eventType)) {
            if (knownTechniquesRef.current.includes(eventType)) return;
            knownTechniquesRef.current.push(eventType);
        }

        const LOW_PRIORITY = [TECHNIQUES.CONTEXT, "FOCUS_LOSS_ANOMALY", TECHNIQUES.SURFACE];
        const isRoutingProbe = eventType === TECHNIQUES.ROUTING; // Define this early

        if (abortControllerRef.current) {
            if (LOW_PRIORITY.includes(eventType)) return;
            // Only abort if it's not a routing probe which will use non-streaming
            if (!isRoutingProbe && eventType !== "IDENTITY_REVEAL_PROTOCOL") {
                abortControllerRef.current.abort();
                abortControllerRef.current = null;
            }
        }

        const controller = new AbortController();
        // Only use controller for streaming calls
        if (!isRoutingProbe) {
            abortControllerRef.current = controller;
        }
        isStreamingRef.current = true; // Still set true, but immediately reset for non-streaming

        // Persistence: knownTechniquesRef handles dedup (updated at line 178).
        // sessionTechniques and uniqueTechniqueCount are updated from server/API responses only.

        // Event Log (Client-side localStorage update for immediate UI)
        // This log entry will be replaced by the server's formatted one for non-streaming
        const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
        let displayEvent = eventType;

        if (eventType === "IDENTITY_REVEAL_PROTOCOL") {
            displayEvent = "TAGGED: SCRIPT-KIDDIE";
        } else if (eventType === TECHNIQUES.ROUTING || eventType === TECHNIQUES.WARNING) {
            const routePath = currentInvokePath.current || "UNKNOWN";
            displayEvent = `${eventType} -> ${routePath}`;
        }
        const clientLogEntry = `> [${timestamp}] DETECTED: [${displayEvent}]`;
        setEventLog(prev => {
            const newLog = [clientLogEntry, ...prev];
            localStorage.setItem("sentinel_event_log", JSON.stringify(newLog));
            return newLog;
        });

        // Risk Scoring (Client-side, will be overwritten by server for non-streaming)
        // Dynamic cap: 40 default, raised by operations (Desert Storm → 60, etc.)
        const riskCap = identityRef.current?.riskCap || 40;
        if (!skipRisk && !isRoutingProbe) { // Only do client-side risk calc for streaming events
            setCurrentRiskScore(currentScore => {
                let impact = 0;
                switch (eventType) {
                    case TECHNIQUES.INSPECTION: impact = 3; break;
                    case TECHNIQUES.SURFACE: impact = 2; break;
                    case TECHNIQUES.EXFIL: impact = 2; break;
                    case TECHNIQUES.CONTEXT: impact = 1; break;
                    case "FOCUS_LOSS_ANOMALY": impact = 1; break;
                    case TECHNIQUES.ROUTING: impact = 3; break;
                    case TECHNIQUES.DOM: impact = 5; break;
                    case TECHNIQUES.DRAG: impact = 5; break;
                    case TECHNIQUES.FUZZ: impact = 3; break;
                    case TECHNIQUES.INJECTION: impact = 8; break;
                    default: impact = 0;
                }
                if (NON_UNIQUE_EVENTS.includes(eventType) && eventType !== TECHNIQUES.ROUTING) return currentScore;
                const newScore = Math.min(currentScore + impact, riskCap);
                LOG_RISK("INFAMY_UPDATE", { event: eventType, current: currentScore, impact, new: newScore });
                localStorage.setItem("sentinel_risk_score", newScore.toString());
                riskScoreRef.current = newScore;
                return newScore;
            });
        }

        if (prompt === "SILENCE") return;

        setStreamText(""); // Clear stream text for new response

        const activeFingerprint = stableFingerprint.current || identityRef.current?.fingerprint;

        if (!activeFingerprint || activeFingerprint === "unknown") {
            console.warn("Sentinel Trigger Aborted: No Identity Available yet.");
            return;
        }

        try {
            const response = await fetch('/api/sentinel', {
                method: 'POST',
                headers: { 'x-cid': cid.replace(/(CID-)+/g, "CID-"), 'Content-Type': 'application/json' },
                signal: isRoutingProbe ? undefined : controller.signal, // Only use signal for streaming
                body: JSON.stringify({
                    prompt, eventType, fingerprint: activeFingerprint, ipAddress: identityRef.current?.ip,
                    alias: identityRef.current?.alias || "Unknown User",
                    location: identityRef.current?.countryCode || "UNKNOWN",
                    threatLevel: (identityRef.current?.riskScore || 0) > 50 ? "High" : "Low",
                    riskScore: riskScoreRef.current, targetPath: currentInvokePath.current,
                    nonStreaming: isRoutingProbe // Send the nonStreaming flag
                })
            });

            if (!response.ok) { // Handle HTTP errors
                const errorBody = await response.json().catch(() => ({ message: "Unknown API error" }));
                throw new Error(`API Error: ${response.status} - ${errorBody.message}`);
            }

            if (isRoutingProbe) {
                // Handle non-streaming JSON response for routing probes
                const data = await response.json();
                if (data.status === "success") {
                    // Update risk score from API response (SSoT from DB)
                    setCurrentRiskScore(data.finalRiskScore);
                    riskScoreRef.current = data.finalRiskScore;
                    localStorage.setItem("sentinel_risk_score", data.finalRiskScore.toString());

                    // Update unique technique count from API (SSoT from DB)
                    if (typeof data.uniqueTechniqueCount === "number") {
                        setUniqueTechniqueCount(data.uniqueTechniqueCount);
                    }

                    // Update event log from API response (SSoT from DB)
                    // The clientLogEntry was a placeholder; replace with server's final message
                    setEventLog(prev => {
                        const newLog = [data.logMessage, ...prev.filter(entry => entry !== clientLogEntry)];
                        localStorage.setItem("sentinel_event_log", JSON.stringify(newLog));
                        return newLog;
                    });
                    console.log("Routing Probe Handled via Non-Streaming API.");
                    isStreamingRef.current = false; // Reset streaming flag immediately
                } else {
                    console.error("Non-streaming API error:", data);
                    setEventLog(prev => [`> [${new Date().toLocaleTimeString('en-US', { hour12: false })}] ERROR: Routing Probe API Failed`, ...prev]);
                    isStreamingRef.current = false;
                }
            } else {
                // Existing streaming logic for AI responses
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

                if (tagMatch) {
                    const trueTechniqueName = tagMatch[1];
                    cleanText = accumulated.replace(tagMatch[0], "").trim();
                    const isHeuristic = eventType.startsWith("HEURISTIC_");

                    if (trueTechniqueName !== "INVENTED_NAME" && isHeuristic) {
                        setEventLog(prev => {
                            const newLog = [...prev];
                            if (newLog.length > 0) {
                                const ts = new Date().toLocaleTimeString('en-US', { hour12: false });
                                newLog[0] = `> [${ts}] DETECTED: [${trueTechniqueName}]`;
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
            }
        } catch (err) {
            if (err instanceof Error && err.name === 'AbortError') {
                console.log("Sentinel Stream Aborted (New Trigger Priority)");
                // Do not reset isStreamingRef.current here for aborts, it will be reset by finally block if controller matches
            } else {
                console.error("Sentinel Downlink Failed:", err);
                setStreamText(""); // Clear any partial stream
                setEventLog(prev => [`> [${new Date().toLocaleTimeString('en-US', { hour12: false })}] ERROR: Sentinel Downlink Failed`, ...prev]);
            }
        } finally {
            // Reset streaming flag if not a routing probe
            if (!isRoutingProbe && abortControllerRef.current === controller) {
                isStreamingRef.current = false;
                abortControllerRef.current = null;
            } else if (isRoutingProbe) {
                isStreamingRef.current = false; // Ensure it's reset for non-streaming
            }
        }
    }, [cid]);

    // HYDRATE FROM SERVER (DB -> Context)

    const hydrateFromServer = useCallback((serverIdentity: IdentityData, invokePath?: string, initialLogs?: string[]) => {

        setIdentity(serverIdentity);
        identityRef.current = serverIdentity;
        currentInvokePath.current = invokePath;

        // Anchor fingerprint

        if (serverIdentity.fingerprint && serverIdentity.fingerprint !== "unknown") {
            stableFingerprint.current = serverIdentity.fingerprint;
            localStorage.setItem("sentinel_id", serverIdentity.fingerprint);
        }

        // CID from DB (Source of Truth)
        if (serverIdentity.cid && serverIdentity.cid !== "unknown") {
            setCid(serverIdentity.cid);
        }

        // HYDRATE UNIQUE TECHNIQUES FROM SERVER (NEW SSoT)
        // Merge with existing ref to prevent race condition where a technique
        // detected before hydration gets lost and re-triggers on the new page
        if (serverIdentity.sessionTechniques) {
            const merged = [...new Set([...knownTechniquesRef.current, ...serverIdentity.sessionTechniques])];
            setSessionTechniques(merged);
            knownTechniquesRef.current = merged;
            localStorage.setItem("sentinel_techniques", JSON.stringify(merged));
        }

        // HYDRATE LOGS (Source of Truth)
        if (initialLogs) {
            setEventLog(initialLogs);
            // Sync to LocalStorage for persistence across reloads (matches current view)
            localStorage.setItem("sentinel_event_log", JSON.stringify(initialLogs));
        }


        // HYDRATE RISK FROM DB (Critical: DB is Single Source of Truth)
        const dbRisk = serverIdentity.riskScore;
        setCurrentRiskScore(dbRisk);
        riskScoreRef.current = dbRisk;
        localStorage.setItem("sentinel_risk_score", dbRisk.toString());

        // HYDRATE UNIQUE TECHNIQUE COUNT FROM DB
        if (typeof serverIdentity.uniqueTechniqueCount === "number") {
            setUniqueTechniqueCount(serverIdentity.uniqueTechniqueCount);
        }

        // HYDRATE OPERATIONS FROM SERVER
        if (serverIdentity.operations) {
            setOperations(serverIdentity.operations);
        }

        // HANDSHAKE (Once per session)
        if (!hasInitialized.current) {
            hasInitialized.current = true;

            const isSessionActive = sessionStorage.getItem("sentinel_session_active");

            if (isSessionActive) {
                isSystemReadyRef.current = true;
            } else {
                setTimeout(() => {
                    triggerSentinel("System Initialization", TECHNIQUES.HANDSHAKE);
                    isSystemReadyRef.current = true;
                    sessionStorage.setItem("sentinel_session_active", "true");
                }, 0);
            }
        }

        // IDENTITY READY: DB hydration complete, safe to display alias
        setIsIdentityReady(true);
        setIsHydrated(true); // Signal that hydration is complete
    }, [triggerSentinel]);

    // ============= CENTRALIZED CID REVEAL TRIGGER =============
    // This effect monitors when risk crosses 20% and triggers the reveal message
    // from ANY page (Home or War Room). Previously this was only in IdentityHUD.tsx.
    const hasTriggeredRevealRef = useRef(false);

    useEffect(() => {
        // Guard: Only trigger once per session
        if (hasTriggeredRevealRef.current) return;

        // Guard: Wait for identity to be ready and CID to be valid
        if (!isIdentityReady) return;
        if (!cid || cid === "unknown" || !cid.startsWith("CID-")) return;

        // Guard: Check localStorage to prevent re-trigger across page loads
        const alreadyRevealed = localStorage.getItem("sentinel_cid_revealed") === "true";
        if (alreadyRevealed) {
            hasTriggeredRevealRef.current = true;
            return;
        }

        // Trigger condition: Risk crosses 20% threshold
        if (currentRiskScore >= 20) {
            hasTriggeredRevealRef.current = true;
            localStorage.setItem("sentinel_cid_revealed", "true");

            // CASCADE TRIGGER: 6000ms delay for dramatic pacing (AAA UX)
            setTimeout(() => {
                triggerSentinel(
                    "IDENTITY REVEAL CONFIRMED. CASCADE INITIATED.",
                    "IDENTITY_REVEAL_PROTOCOL"
                );
            }, 6000);
        }
    }, [currentRiskScore, isIdentityReady, cid, triggerSentinel]);

    // ROUTING LOGIC (Moved to useEffect to avoid Race Condition)
    useEffect(() => {
        if (!isHydrated) return; // Wait for hydration

        const invokePath = currentInvokePath.current;

        if (invokePath) {
            const isSystemPath =
                invokePath.includes(".well-known") ||
                invokePath.includes("favicon") ||
                invokePath.includes("_next/static");

            const isWhitelisted = KNOWN_ROUTES.includes(invokePath) || isSystemPath;
            const isSuspicious = !isWhitelisted;

            if (isSuspicious && processedPathRef.current !== invokePath) {

                processedPathRef.current = invokePath;

                const storedPaths = JSON.parse(localStorage.getItem("sentinel_invoked_paths") || "[]");

                if (!storedPaths.includes(invokePath)) {
                    const newPaths = [...storedPaths, invokePath];
                    localStorage.setItem("sentinel_invoked_paths", JSON.stringify(newPaths));

                    const uniqueCount = newPaths.length;

                    if (uniqueCount === 3) {
                        triggerSentinel(
                            "SECURITY ALERT: HOSTILE ROUTING PATTERN (TRIPLICATE).",
                            TECHNIQUES.ROUTING,
                            false
                        );
                    } else if (uniqueCount < 3) {
                        triggerSentinel(
                            `Routing Probe: ${invokePath}`,
                            TECHNIQUES.ROUTING,
                            true
                        );
                    }
                }
            }
        }
    }, [isHydrated, triggerSentinel]);


    // ============= PHASE 2: REAL-TIME SYNC POLLING =============
    useEffect(() => {
        if (!isHydrated) return;
        if (!cid || !cid.startsWith("CID-")) return;

        let isVisible = true;
        let isMounted = true;
        let consecutiveFailures = 0;
        const BASE_INTERVAL = 10_000; // 10s base
        const MAX_INTERVAL = 60_000;  // 60s max backoff

        const handleVisibilityForPolling = () => {
            isVisible = !document.hidden;
            // Reset backoff when tab becomes visible again
            if (isVisible) consecutiveFailures = 0;
        };
        document.addEventListener("visibilitychange", handleVisibilityForPolling);

        const poll = async () => {
            if (!isVisible || !isMounted) return;
            if (isStreamingRef.current) return; // Don't poll during active streaming

            try {
                const since = lastSyncTimeRef.current || new Date(Date.now() - 30000).toISOString();
                const res = await fetch(`/api/sentinel/sync?since=${encodeURIComponent(since)}`);

                if (!res.ok) {
                    consecutiveFailures++;
                    return;
                }

                // Success — reset backoff
                consecutiveFailures = 0;

                const data = await res.json();

                // Update cursor: prefer server event timestamp over client time (avoids clock skew)
                if (data.events && data.events.length > 0) {
                    // Events are sorted DESC — first one is most recent
                    const latestEventTime = data.events[0].timestamp;
                    if (latestEventTime) {
                        lastSyncTimeRef.current = new Date(latestEventTime).toISOString();
                    }
                } else {
                    // No new events — advance cursor to server's "now" (fallback)
                    lastSyncTimeRef.current = new Date().toISOString();
                }

                // Update risk score if changed
                if (typeof data.riskScore === "number" && data.riskScore !== riskScoreRef.current) {
                    setCurrentRiskScore(data.riskScore);
                    riskScoreRef.current = data.riskScore;
                    localStorage.setItem("sentinel_risk_score", data.riskScore.toString());
                }

                // Update operations if changed
                if (data.operations) {
                    setOperations(data.operations);
                }

                // Update unique technique count
                if (typeof data.uniqueTechniqueCount === "number") {
                    setUniqueTechniqueCount(data.uniqueTechniqueCount);
                }

                // Update riskCap in identity ref
                if (typeof data.riskCap === "number" && identityRef.current) {
                    identityRef.current = { ...identityRef.current, riskCap: data.riskCap };
                }

                // C4: Process new EXT_* events
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
                            // Dedup: don't add entries that already exist
                            const existing = new Set(prev);
                            const fresh = newLogEntries.filter((entry: string) => !existing.has(entry));
                            if (fresh.length === 0) return prev;
                            const merged = [...fresh, ...prev];
                            localStorage.setItem("sentinel_event_log", JSON.stringify(merged));
                            return merged;
                        });

                        // Trigger Sentinel narrative for the MOST RECENT external event only
                        const latest = extEvents[0];
                        const attackPrompt = [
                            `EXTERNAL ATTACK INTERCEPTED.`,
                            `Technique: ${latest.eventType}.`,
                            `Payload signature: "${((latest.payload as string) || "classified").substring(0, 100)}".`,
                            `Route targeted: ${(latest.route as string) || "perimeter"}.`,
                            `Impact: +${latest.riskScoreImpact} risk points.`,
                            `Address the defender. Mock the attacker's attempt. Be detailed (2-3 paragraphs).`
                        ].join(" ");

                        triggerSentinel(attackPrompt, "EXT_ATTACK_INTERCEPTED", true);
                    }
                }
            } catch (err) {
                consecutiveFailures++;
                console.error(`[SYNC] Poll failed (attempt ${consecutiveFailures}):`, err);
            }
        };

        // Adaptive interval: exponential backoff on failures, reset on success
        let timerId: ReturnType<typeof setTimeout>;
        const scheduleNext = () => {
            if (!isMounted) return;
            const backoff = Math.min(BASE_INTERVAL * Math.pow(2, consecutiveFailures), MAX_INTERVAL);
            timerId = setTimeout(async () => {
                await poll();
                scheduleNext();
            }, backoff);
        };

        // Initial poll after short delay, then schedule adaptive loop
        timerId = setTimeout(async () => {
            await poll();
            scheduleNext();
        }, BASE_INTERVAL);

        return () => {
            isMounted = false;
            clearTimeout(timerId);
            document.removeEventListener("visibilitychange", handleVisibilityForPolling);
        };
    }, [isHydrated, cid, triggerSentinel]);

    // HANDLE ACCESS
    const handleAccess = useCallback(() => {
        localStorage.setItem("watchtower_access", "granted");
        setAccessGranted(true);
    }, []);

    // ============= GLOBAL SENSORS =============
    const { isDevToolsOpen } = useDevTools();
    const isDevToolsOpenRef = useRef(isDevToolsOpen);
    const lastFocusTimeRef = useRef<number>(0);
    const lastResizeTimeStamp = useRef(0);
    const lastBlurTimeStamp = useRef(0);
    const hasLoggedForensic = useRef(false);
    const isGuardStateRef = useRef(false);
    const blurTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Sync DevTools Ref
    useEffect(() => {
        isDevToolsOpenRef.current = isDevToolsOpen;
    }, [isDevToolsOpen]);

    // FORENSIC DETECTION (DevTools)
    useEffect(() => {
        if (isDevToolsOpen) {
            if (!hasLoggedForensic.current) {
                triggerSentinel("Security Alert: Debugger.", TECHNIQUES.INSPECTION);
                hasLoggedForensic.current = true;
            }
        } else {
            isGuardStateRef.current = true;
            lastFocusTimeRef.current = Date.now();
            hasLoggedForensic.current = false;
        }
    }, [isDevToolsOpen, triggerSentinel]);

    // DOM LISTENERS (Global)
    useEffect(() => {
        if (typeof window === "undefined") return;
        if (!accessGranted) return;

        const processCorrelatedEvent = (eventType: 'RESIZE' | 'BLUR', message: string, technique: string) => {
            const now = performance.now();
            let isCorrelated = false;

            if (eventType === 'RESIZE') {
                lastResizeTimeStamp.current = now;
                if (now - lastBlurTimeStamp.current < 200) isCorrelated = true;
            } else {
                lastBlurTimeStamp.current = now;
                if (now - lastResizeTimeStamp.current < 200) isCorrelated = true;
            }

            if (isCorrelated) {
                if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
                if (!hasLoggedForensic.current) {
                    triggerSentinel("Security Alert: Debugger (Correlated).", TECHNIQUES.INSPECTION);
                    hasLoggedForensic.current = true;
                }
                return;
            }

            if (!isSystemReadyRef.current) return;
            if (isDevToolsOpenRef.current) return;

            triggerSentinel(message, technique);
        };

        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
            if (Date.now() - lastFocusTimeRef.current < 300) return;
            if (isGuardStateRef.current) {
                isGuardStateRef.current = false;
                return;
            }
            triggerSentinel("Security Alert: Context Menu.", TECHNIQUES.SURFACE);
        };

        const handleVisibilityChange = () => {
            if (isDevToolsOpenRef.current) return;
            if (document.hidden) {
                triggerSentinel("Searching for tutorials? Interesting...", TECHNIQUES.CONTEXT);
            }
        };

        const handleBlur = () => {
            if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
            blurTimerRef.current = setTimeout(() => {
                processCorrelatedEvent('BLUR', "Multitasking? Focus on the terminal.", TECHNIQUES.FOCUS);
            }, 50);
        };

        const handleResize = () => {
            if (Date.now() - lastFocusTimeRef.current < 300) return;

            const widthDiff = window.outerWidth - window.innerWidth;
            const heightDiff = window.outerHeight - window.innerHeight;

            if (widthDiff > 160 || heightDiff > 160) {
                triggerSentinel("Security Alert: Debugger (Phys-Check).", TECHNIQUES.INSPECTION);
                return;
            }

            processCorrelatedEvent('RESIZE', "Security Alert: Resize.", TECHNIQUES.SURFACE);
        };

        const handleClipboard = () => triggerSentinel("Security Alert: Exfiltration.", TECHNIQUES.EXFIL);

        const handleFocus = () => {
            lastFocusTimeRef.current = Date.now();
            isGuardStateRef.current = true;
        };

        window.addEventListener("contextmenu", handleContextMenu);
        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("blur", handleBlur);
        window.addEventListener("resize", handleResize);
        window.addEventListener("copy", handleClipboard);
        window.addEventListener("paste", handleClipboard);
        window.addEventListener("focus", handleFocus);

        return () => {
            window.removeEventListener("contextmenu", handleContextMenu);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("blur", handleBlur);
            window.removeEventListener("resize", handleResize);
            window.removeEventListener("copy", handleClipboard);
            window.removeEventListener("paste", handleClipboard);
            window.removeEventListener("focus", handleFocus);
        };
    }, [triggerSentinel, accessGranted]);

    // DOM MUTATION OBSERVER (Global Shield)
    useEffect(() => {
        if (typeof window === "undefined") return;
        if (!accessGranted || !isSystemReadyRef.current) return;

        const observer = new MutationObserver((mutations) => {
            if (isNavigatingRef.current) return; // IGNORE mutations during navigation

            for (const mutation of mutations) {

                if (mutation.type === 'childList') {
                    const removed = Array.from(mutation.removedNodes);
                    const hasSensitiveDeletion = removed.some(node =>
                        node instanceof HTMLElement && (
                            node.id.includes("watchtower") ||
                            node.getAttribute("data-shield") === "protected" ||
                            (node.querySelector && node.querySelector('[data-shield="protected"]'))
                        )
                    );

                    if (hasSensitiveDeletion) {
                        triggerSentinel(
                            "CRITICAL HEURISTIC: UI Layer Deletion detected. Subject attempting to blind the Sentinel.",
                            TECHNIQUES.DOM
                        );
                    }
                }
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
        return () => observer.disconnect();
    }, [accessGranted, triggerSentinel]);

    // PHANTOM DRAG & FUZZING (Global)
    useEffect(() => {
        if (typeof window === "undefined") return;
        if (!accessGranted) return;

        let clickCount = 0;
        let resetTimer: NodeJS.Timeout | null = null;

        const handleDrag = (e: DragEvent) => {
            triggerSentinel(
                `HEURISTIC: Anomalous Drag Interaction on [${(e.target as HTMLElement).tagName}]. Subject testing physics engine.`,
                TECHNIQUES.DRAG
            );
        };

        const handleFuzzing = () => {
            if (clickCount === 0) {
                resetTimer = setTimeout(() => { clickCount = 0; }, 1000);
            }
            clickCount++;
            if (clickCount >= 6) {
                triggerSentinel(
                    "HEURISTIC: Erratic Fuzzing (High Velocity Inputs). Subject Stress-Testing Input Layer.",
                    TECHNIQUES.FUZZ
                );
                clickCount = 0;
                if (resetTimer) clearTimeout(resetTimer);
            }
        };

        window.addEventListener("dragstart", handleDrag);
        window.addEventListener("click", handleFuzzing);

        return () => {
            window.removeEventListener("dragstart", handleDrag);
            window.removeEventListener("click", handleFuzzing);
            if (resetTimer) clearTimeout(resetTimer);
        };
    }, [accessGranted, triggerSentinel]);

    const value: SentinelContextValue = {
        state: {
            accessGranted,
            currentRiskScore,
            uniqueTechniqueCount,
            eventLog,
            history,
            streamText,
            sessionTechniques,
            cid,
            isIdentityReady,
            operations
        },
        actions: {
            handleAccess,
            triggerSentinel,
            hydrateFromServer
        },
        refs: {
            isSystemReadyRef: isSystemReadyRef as React.RefObject<boolean>,
            knownTechniquesRef: knownTechniquesRef as React.RefObject<string[]>,
            riskScoreRef: riskScoreRef as React.RefObject<number>
        },
        identity
    };

    return (
        <SentinelContext.Provider value={value}>
            {children}
        </SentinelContext.Provider>
    );
}

// ============= HOOK =============
export function useSentinel() {
    const context = useContext(SentinelContext);
    if (!context) {
        throw new Error("useSentinel must be used within SentinelProvider");
    }
    return context;
}
