"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Activity } from "lucide-react";

import useDevTools from "@/hooks/useDevTools";
import useStableIdentity from "@/hooks/useStableIdentity"; // NEW HOOK
import Gatekeeper from "@/components/watchtower/Gatekeeper";
import IdentityHUD from "@/components/watchtower/IdentityHUD";
import Briefing from "@/components/watchtower/Briefing";
import Footer from "@/components/watchtower/Footer";

interface HomeTerminalProps {
    threatCount: number;
    identity: {
        alias: string;
        fingerprint: string | null;
        riskScore: number;
        ip: string | null;
    };
    invokePath?: string;
}

// CONSTANTS (Technique Registry)
const TECHNIQUES = {
    INSPECTION: "FORENSIC_INSPECTION_ACTIVITY",
    SURFACE: "UI_SURFACE_ANALYSIS",
    EXFIL: "DATA_EXFILTRATION_ATTEMPT",
    CONTEXT: "CONTEXT_SWITCH_ANOMALY",
    ROUTING: "ROUTING_PROBE_HEURISTICS",
    HANDSHAKE: "System Handshake",
    PROTOCOL: "PROTOCOL_VIOLATION",
    INJECTION: "MEMORY_INJECTION_ATTEMPT",
    WARNING: "SECURITY_WARNING_PROTOCOL"
};

export default function HomeTerminal({ identity, invokePath }: HomeTerminalProps) {
    // 1. STABLE IDENTITY ANCHOR (The Foundation)
    const stableFingerprint = useStableIdentity(identity.fingerprint);

    const [isMounted, setIsMounted] = useState(false);
    const [accessGranted, setAccessGranted] = useState(false);
    const [history, setHistory] = useState<string[]>([]);
    const [eventLog, setEventLog] = useState<string[]>([]);
    const [streamText, setStreamText] = useState("");
    const [currentRiskScore, setCurrentRiskScore] = useState(0);
    const [sessionTechniques, setSessionTechniques] = useState<string[]>([]);
    const [cid, setCid] = useState<string>("");

    // SENSORS
    const isDevToolsOpen = useDevTools();
    const isStreamingRef = useRef(false);
    const knownTechniquesRef = useRef<string[]>([]);
    const hasInitialized = useRef(false);
    const blurTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // 2. MOUNT & RESTORE (The Recall)
    useEffect(() => {
        setIsMounted(true);

        const storedAccess = localStorage.getItem("watchtower_access");
        if (storedAccess === "granted") setAccessGranted(true);

        const storedHistory = localStorage.getItem("sentinel_chat_history");
        const storedEventLog = localStorage.getItem("sentinel_event_log");
        const storedTechniques = localStorage.getItem("sentinel_techniques");
        const storedRisk = localStorage.getItem("sentinel_risk_score");
        const storedCid = localStorage.getItem("sentinel_cid");

        if (storedHistory) {
            const parsed = JSON.parse(storedHistory);
            const cleanChat = parsed.filter((msg: string) => !msg.includes("DETECTED:"));
            setHistory(cleanChat);
        }

        if (storedEventLog) {
            setEventLog(JSON.parse(storedEventLog));
        }

        if (storedTechniques) {
            const parsedTechniques = JSON.parse(storedTechniques);
            setSessionTechniques(parsedTechniques);
            knownTechniquesRef.current = parsedTechniques;
        }

        if (storedRisk) setCurrentRiskScore(Number(storedRisk));

        // CID Logic
        let activeCid = storedCid;
        const cidRegex = /^CID-[0-9A-F]{4}-\d$/;
        if (activeCid && activeCid.includes("CID-CID-")) {
            activeCid = activeCid.replace(/^(CID-)+/, "CID-");
            localStorage.setItem("sentinel_cid", activeCid);
        }

        if (!activeCid || !cidRegex.test(activeCid)) {
            activeCid = `CID-${Math.random().toString(16).slice(2, 6).toUpperCase()}-${Math.floor(Math.random() * 9)}`;
            localStorage.setItem("sentinel_cid", activeCid);
        }
        setCid(activeCid);

        if (typeof window !== "undefined" && !Object.prototype.hasOwnProperty.call(window, '_VGT_DEBUG_')) {
            Object.defineProperty(window, '_VGT_DEBUG_', {
                get: function () {
                    console.warn(">> SECURITY BREACH DETECTED: ILLEGAL MEMORY ACCESS <<");
                    return "ACCESS DENIED. TRACE STARTED.";
                },
                configurable: false
            });
        }
    }, []);

    // 3. SENTINEL TRIGGER (The Reaction)
    const triggerSentinel = useCallback(async (prompt: string, eventType: string) => {
        // Anti-Spam (Lock)
        if (isStreamingRef.current) return;

        // Identity Guard
        if (!stableFingerprint) return;

        // Unique Technique Guard
        // EXCEPTIONS: Handshake (Once per Boot), Warnings (Logic Driven)
        const EXCEPTIONS = [TECHNIQUES.HANDSHAKE, TECHNIQUES.WARNING];
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
        setCurrentRiskScore(currentScore => {
            let impact = 0;
            switch (eventType) {
                case TECHNIQUES.INSPECTION: impact = 5; break;
                case TECHNIQUES.SURFACE: impact = 2; break;
                case TECHNIQUES.EXFIL: impact = 1; break;
                case TECHNIQUES.CONTEXT: impact = 2; break;
                case "FOCUS_LOSS_ANOMALY": impact = 2; break; // New Technique
                case TECHNIQUES.ROUTING: impact = 10; break;
                case TECHNIQUES.INJECTION: impact = 20; break;
                default: impact = 0;
            }

            if (EXCEPTIONS.includes(eventType)) return currentScore;

            let newScore = currentScore + impact;

            // Script Kiddie Cap (20%) - Browser Events
            const BROWSER_EVENTS = [
                TECHNIQUES.INSPECTION,
                TECHNIQUES.SURFACE,
                TECHNIQUES.EXFIL,
                TECHNIQUES.CONTEXT,
                "FOCUS_LOSS_ANOMALY"
            ];

            if (BROWSER_EVENTS.includes(eventType)) {
                // Strict 20% limit for browser noise
                if (currentScore >= 20) {
                    newScore = currentScore;
                } else {
                    newScore = Math.min(newScore, 20);
                }
            }

            newScore = Math.min(newScore, 100);
            localStorage.setItem("sentinel_risk_score", newScore.toString());
            return newScore;
        });

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
                    fingerprint: stableFingerprint,
                    ipAddress: identity.ip,
                    alias: identity.alias,
                    location: "Australia/Sydney",
                    threatLevel: identity.riskScore > 50 ? "High" : "Low",
                    riskScore: currentRiskScore
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


    // 4. SENSOR LANE (The Watcher)
    useEffect(() => {
        if (!accessGranted || !stableFingerprint) return;

        // F12 / DevTools
        if (isDevToolsOpen) triggerSentinel("Security Alert: Debugger.", TECHNIQUES.INSPECTION);

        // Click / Context Menu
        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
            // PREVENT LEAK: If DevTools already open (Inspection), ignore clicks to avoid double-dipping score.
            if (isDevToolsOpen) return;
            triggerSentinel("Security Alert: Context Menu.", TECHNIQUES.SURFACE);
        };

        // Smart Blur/Focus Logic (Distinguish Tab Switch vs Focus Loss)
        const handleVisibilityChange = () => {
            if (document.hidden) {
                // If hidden, clear trigger for simple focus, this is a distinct Tab Switch
                if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
                triggerSentinel("Searching for tutorials? Interesting...", TECHNIQUES.CONTEXT);
            }
        };

        const handleBlur = () => {
            // Delay to check if this results in Visibility Hidden (Tab Switch)
            blurTimeoutRef.current = setTimeout(() => {
                // If still visible but blurred, it's Multitasking (Focus Loss)
                if (!document.hidden) {
                    triggerSentinel("Multitasking? Focus on the terminal.", "FOCUS_LOSS_ANOMALY");
                }
            }, 200);
        };

        const handleClipboard = () => triggerSentinel("Security Alert: Exfiltration.", TECHNIQUES.EXFIL);

        let resizeTimeout: NodeJS.Timeout;
        const handleResize = () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => triggerSentinel("Security Alert: Resize.", TECHNIQUES.SURFACE), 1000);
        };

        // FOCUS FILTER LOGIC
        // Let inside effect works because event listeners close over it.
        let ignoreNextClick = false;

        const handleFocus = () => {
            // When window regains focus (e.g. from DevTools), ignore the next immediate click
            ignoreNextClick = true;
            // Timeout to reset just in case they don't click immediately
            setTimeout(() => { ignoreNextClick = false; }, 500);
        };

        const handleClick = (e: MouseEvent) => {
            if (ignoreNextClick) {
                // Return from DevTools/Blur -> Ignore this click
                ignoreNextClick = false;
                return;
            }

            // Interaction Check (Normal Left Click)
            // Filter out right clicks (handled by contextmenu) and non-primary
            if (e.button !== 0) return;

            // If DevTools are open, we might want to ignore clicks to avoid double-logging with Inspection?
            // User requirement: "Usuario ya estando en la terminal hace clic izquierdo -> Log...".
            // If DevTools open, user is technically "inspecting".
            // But let's follow the Focus Filter rule primarily. 
            // If they are *already* in terminal (not returning) and click, we log.
            triggerSentinel("Security Alert: Surface Interaction.", TECHNIQUES.SURFACE);
        };

        window.addEventListener("contextmenu", handleContextMenu);
        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("blur", handleBlur);
        window.addEventListener("resize", handleResize);
        window.addEventListener("copy", handleClipboard);
        window.addEventListener("paste", handleClipboard);
        window.addEventListener("focus", handleFocus);
        window.addEventListener("click", handleClick);

        return () => {
            window.removeEventListener("contextmenu", handleContextMenu);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("blur", handleBlur);
            window.removeEventListener("resize", handleResize);
            window.removeEventListener("copy", handleClipboard);
            window.removeEventListener("paste", handleClipboard);
            window.removeEventListener("focus", handleFocus);
            window.removeEventListener("click", handleClick);
            clearTimeout(resizeTimeout);
            if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
        };
    }, [accessGranted, isDevToolsOpen, triggerSentinel, stableFingerprint]);

    // 5. NAVIGATION LANE
    useEffect(() => {
        if (!accessGranted || !stableFingerprint) return;

        if (!hasInitialized.current) {
            hasInitialized.current = true;
            const alreadyGreeted = localStorage.getItem("sentinel_greeted");
            if (!alreadyGreeted) {
                localStorage.setItem("sentinel_greeted", "true");
                triggerSentinel("System Initialization", TECHNIQUES.HANDSHAKE);
            }
        }

        if (invokePath) {
            const isSuspicious = invokePath !== "/" && invokePath !== "/unknown";
            if (isSuspicious) {
                const currentProbeCount = parseInt(localStorage.getItem("sentinel_probe_count") || "0", 10);
                const newProbeCount = currentProbeCount + 1;
                localStorage.setItem("sentinel_probe_count", newProbeCount.toString());

                if (newProbeCount > 3) return; // Block

                if (newProbeCount === 3) {
                    triggerSentinel("SECURITY ALERT: HOSTILE ROUTING PROBE DETECTED.", TECHNIQUES.ROUTING);
                } else if (newProbeCount === 2) {
                    triggerSentinel("Security Warning: Pattern detected.", TECHNIQUES.WARNING);
                } else {
                    triggerSentinel("Security Warning: Access violation.", TECHNIQUES.WARNING);
                }
            }
        }
    }, [accessGranted, triggerSentinel, invokePath, stableFingerprint]);

    const handleAccess = () => {
        localStorage.setItem("watchtower_access", "granted");
        setAccessGranted(true);
    };

    if (!isMounted) return null;

    return (
        <>
            {!accessGranted && <Gatekeeper onAccess={handleAccess} />}

            <main className={`flex min-h-screen flex-col items-center justify-between p-24 bg-neutral-950 text-neutral-200 transition-all duration-1000 ${accessGranted ? "blur-none opacity-100 scale-100" : "blur-lg opacity-50 scale-95 overflow-hidden h-screen"}`}>

                {/* Header Section */}
                <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
                    <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
                        SecOps Platform v3.0
                    </p>
                    <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-white via-white dark:from-black dark:via-black lg:static lg:h-auto lg:w-auto lg:bg-none">
                        <span className="flex place-items-center gap-2 p-8 lg:p-0">
                            By <a href="https://github.com/cryptotweezer/Digital-Twin-III.git" target="_blank" rel="noopener noreferrer" className="font-bold hover:underline hover:text-blue-400 transition-colors">Team 02</a>
                        </span>
                    </div>
                </div>

                {/* Title & Identity */}
                <div className="relative flex flex-col items-center place-items-center z-0 mt-16">
                    <div className="before:absolute before:h-[300px] before:w-[480px] before:-translate-x-1/2 before:rounded-full before:bg-gradient-radial before:from-white before:to-transparent before:blur-2xl before:content-[''] after:absolute after:-z-20 after:h-[180px] after:w-[240px] after:translate-x-1/3 after:bg-gradient-conic after:from-sky-200 after:via-blue-200 after:blur-2xl after:content-[''] before:dark:bg-gradient-to-br before:dark:from-transparent before:dark:to-blue-700 before:dark:opacity-10 after:dark:from-sky-900 after:dark:via-[#0141ff] after:dark:opacity-40 before:lg:h-[360px] z-[-1]"></div>
                    <h1 className="text-6xl font-bold text-center tracking-tighter">
                        THE WATCHTOWER
                    </h1>

                    <div className="w-full mt-4">
                        <IdentityHUD
                            alias={identity.alias}
                            riskScore={currentRiskScore}
                            ip={identity.ip || "unknown"}
                            cid={cid}
                        />
                    </div>
                </div>

                {/* Dashboard Grid - Refactored for Equal Height and Fluid Logs */}
                <div className="mb-32 mt-16 flex flex-col lg:flex-row lg:max-w-5xl lg:w-full lg:mb-0 lg:items-stretch gap-8">

                    {/* Left Column (A): Metrics & Signal Log */}
                    <div className="flex flex-col gap-4 w-full lg:w-1/2">
                        {/* Metric Card */}
                        <div className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30">
                            <h2 className={`mb-3 text-2xl font-semibold`}>
                                Unique Techniques{" "}
                                <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
                                    -&gt;
                                </span>
                            </h2>
                            <p className={`m-0 max-w-[30ch] text-5xl font-mono text-red-500`}>
                                {sessionTechniques.length}
                            </p>
                        </div>

                        {/* Event Log (Signal Logs) - Fluid Height */}
                        <div className="group flex-1 flex flex-col rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30 text-left min-h-0">
                            <h3 className="mb-2 text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                <Activity size={14} className="text-red-500" />
                                Signal Logs
                            </h3>
                            <div className="font-mono text-xs flex-1 overflow-y-auto scrollbar-none pr-1">
                                {eventLog.map((log, idx) => (
                                    <p key={idx} className="text-[#FFFFFF] whitespace-normal break-words leading-tight mb-2 opacity-90 hover:opacity-100">{log}</p>
                                ))}
                                {eventLog.length === 0 && <span className="text-gray-600 italic opacity-50">-- NO ANOMALIES --</span>}
                            </div>
                        </div>
                    </div>

                    {/* Right Column (B): Live Feed - Fixed Height */}
                    <div className="w-full lg:w-1/2 group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30 flex flex-col relative h-full lg:max-h-[500px]">
                        <h2 className={`mb-3 text-2xl font-semibold animate-pulse ${currentRiskScore >= 100 ? "text-red-500" : currentRiskScore >= 60 ? "text-orange-500" : currentRiskScore >= 20 ? "text-cyan-400" : "text-blue-500"} sticky top-0 z-10 w-full`}>
                            LIVE CONNECTION
                        </h2>

                        {/* Terminal Window */}
                        <div className="flex flex-col gap-1 overflow-y-auto pr-2 font-mono text-sm leading-relaxed h-[500px] dark-scrollbar">
                            <style jsx global>{`
                                .dark-scrollbar::-webkit-scrollbar {
                                    width: 4px;
                                }
                                .dark-scrollbar::-webkit-scrollbar-thumb {
                                    background-color: #262626;
                                    border-radius: 4px;
                                }
                                .dark-scrollbar::-webkit-scrollbar-track {
                                    background: transparent;
                                }
                            `}</style>

                            {/* Stream & History */}
                            {streamText && (
                                <p className="text-[#FFFFFF] animate-pulse whitespace-pre-wrap shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                                    {streamText}<span className="inline-block w-2 h-4 bg-white ml-1 animate-blink">|</span>
                                </p>
                            )}
                            {history.map((msg, idx) => (
                                <p key={idx} className={`${idx === 0 ? "text-[#FFFFFF]" : "text-[#666666]"} whitespace-pre-wrap`}>
                                    {msg}
                                </p>
                            ))}
                            {history.length === 0 && !streamText && (
                                <p className="text-neutral-600 italic">
                                    [ Waiting for Sentinel... ]
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <Briefing />

                <Footer />
            </main>
        </>
    );
}
