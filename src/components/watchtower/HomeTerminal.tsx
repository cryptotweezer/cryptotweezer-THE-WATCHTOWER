"use client";

import { useState, useCallback, useEffect, useRef } from "react";

import useDevTools from "@/hooks/useDevTools";
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

export default function HomeTerminal({ threatCount, identity, invokePath }: HomeTerminalProps) {
    // MOUNT GUARD: Prevent hydration mismatch
    const [isMounted, setIsMounted] = useState(false);
    const [accessGranted, setAccessGranted] = useState(false);
    const [history, setHistory] = useState<string[]>([]);
    const [streamText, setStreamText] = useState("");

    // INFAMY SYSTEM STATE
    const [currentRiskScore, setCurrentRiskScore] = useState(identity.riskScore);
    const [sessionTechniques, setSessionTechniques] = useState<string[]>([]);

    // --- CLIENT-SIDE IDENTITY STABILIZATION ---
    // Solves Server-Side Purity/Hydration mismatch for random IDs
    const [stableFingerprint, setStableFingerprint] = useState(identity.fingerprint);

    useEffect(() => {
        // If server couldn't identify (Dev Mode), generate a persistent session ID on client
        if (stableFingerprint === "unknown" || !stableFingerprint) {
            const randomHash = "node_" + Math.random().toString(36).slice(2, 10);
            setStableFingerprint(randomHash);
        }
    }, [stableFingerprint]);
    const [cid, setCid] = useState<string>("");

    // SENSORS
    const isDevToolsOpen = useDevTools();

    // REFS for Logic (Non-rendering state)
    const isStreamingRef = useRef(false);
    const knownTechniquesRef = useRef<string[]>([]);
    // Rule of 3 Trackers
    const criticalPathCountRef = useRef<number>(0);
    // GUARD: Prevent infinite loops and double-firing in StrictMode
    const hasInitialized = useRef(false);
    // Mount Effect: Check localStorage AFTER mount & Restore Session
    useEffect(() => {
        setIsMounted(true);
        const storedAccess = localStorage.getItem("watchtower_access");
        if (storedAccess === "granted") {
            setAccessGranted(true);
        }

        // RESTORE SESSION (Persistence Layer)
        const storedHistory = sessionStorage.getItem("sentinel_chat_history");
        const storedTechniques = sessionStorage.getItem("sentinel_techniques");
        const storedRisk = sessionStorage.getItem("sentinel_risk_score");
        const storedCid = sessionStorage.getItem("sentinel_cid");

        if (storedHistory) setHistory(JSON.parse(storedHistory));
        if (storedTechniques) {
            const parsedTechniques = JSON.parse(storedTechniques);
            setSessionTechniques(parsedTechniques);
            knownTechniquesRef.current = parsedTechniques; // Sync Ref
        }
        if (storedRisk) setCurrentRiskScore(Number(storedRisk));

        // CID Logic: Generate or Retrieve
        let activeCid = storedCid;
        // Fix: Strict Regex validation for CID-XXXX-X
        const cidRegex = /^CID-[0-9A-F]{4}-\d$/;

        if (!activeCid || !cidRegex.test(activeCid)) {
            activeCid = `CID-${Math.random().toString(16).slice(2, 6).toUpperCase()}-${Math.floor(Math.random() * 9)}`;
            sessionStorage.setItem("sentinel_cid", activeCid);
        }
        setCid(activeCid);

        // HONEYPOT TRAP (Window Object)
        // Exposed Global Variable for script-kiddies scanning 'window'
        // HONEYPOT TRAP (Window Object)
        // Exposed Global Variable for script-kiddies scanning 'window'
        if (typeof window !== "undefined" && !Object.prototype.hasOwnProperty.call(window, '_VGT_DEBUG_')) {
            Object.defineProperty(window, '_VGT_DEBUG_', {
                get: function () {
                    console.warn(">> SECURITY BREACH DETECTED: ILLEGAL MEMORY ACCESS <<");
                    // Trigger Sentinel immediately via a different mechanism if possible, 
                    // or just dispatch an event caught by our listeners? 
                    // Direct trigger is safer for logic availability.
                    // We can't access 'triggerSentinel' easily from here due to closure scope if not careful.
                    // BUT: this useEffect has triggerSentinel in scope? NO, triggerSentinel is defined BELOW.
                    // FIX: Move Honeypot setup to a separate useEffect BELOW triggerSentinel definition.
                    return "ACCESS DENIED. TRACE STARTED.";
                },
                configurable: false
            });
        }
    }, []);

    const triggerSentinel = useCallback(async (prompt: string, eventType: string) => {
        // Double check checks using REF to avoid dependency cycles
        if (isStreamingRef.current) return;

        // --- SENSORES SILENT PROTOCOL (GUARD CLAUSE - HARDWARE BRAKE) ---
        // Critical: Prevent loop/spam. If technique is known (using REF for sync access), Do Nothing.
        // Exception: Handshake (controlled by its own effect)
        // Check Ref for immediate blockade
        if (knownTechniquesRef.current.includes(eventType) && eventType !== "System Handshake") {
            console.log("Blocking repeated technique (Ref):", eventType);
            return;
        }

        // IMMEDIATE REGISTRATION: Update Ref immediately to block next click in 0ms
        if (eventType !== "System Handshake") {
            knownTechniquesRef.current.push(eventType);
        }

        // IMMEDIATE REGISTRATION: Prevent race conditions (Machine Gun Clicks)
        // Add to state and storage BEFORE calling API
        if (eventType !== "System Handshake") {
            // Optimistic update to block subsequent calls immediately
            // Ref is already updated above. Now sync blocked state.
            const updatedTechniques = [...sessionTechniques, eventType];
            setSessionTechniques(updatedTechniques);
            sessionStorage.setItem("sentinel_techniques", JSON.stringify(updatedTechniques));

            // Note: Scoring is still handled by the 'impact' calculation in the response stream? 
            // The prompt "Ensure the technique is added... before calling" implies blocking. 
            // If we add it here, we must score it here? OR relies on the response to trigger score?
            // If I add it here, the response logic `if (!prev.includes(techniqueName))` will FAIL because it IS included now.
            // CHANGE: I must update the response logic to Score even if it's in the list? No, that breaks the "New Only" rule.
            // SOLUTION: I will rely on the fact that I am treating 'eventType' as the technique name. 
            // In the response logic, I will calculate score based on this NEW technique I just registered.
            // BUT: The response logic is async.
            // BETTER: Score HERE too.

            // --- WEIGHTED SCORING ENGINE (CLIENT SIDE) ---
            setCurrentRiskScore(currentScore => {
                let impact = 0;
                // Categories (Mirroring response logic which will clear itself)
                const LOW_RISK = ["UI_SURFACE_ANALYSIS", "CONTEXT_MENU_ACCESS"]; // - Foreman Inspection handled separately
                const MED_RISK = ["OUT-OF-BAND_RECON"]; // - Exfil handled separately

                // Recalibrated Weights (Step 3.2)
                if (eventType === "FORENSIC_INSPECTION") impact = 5; // DevTools
                else if (eventType === "DATA_EXFILTRATION_ATTEMPT") impact = 1; // Clipboard
                else if (eventType === "MEMORY_INJECTION_ATTEMPT") impact = 20; // Honeypot
                else if (LOW_RISK.includes(eventType)) impact = 2;
                else if (MED_RISK.includes(eventType)) impact = 7;
                else impact = 10; // Default High (e.g. Critical Routes after Rule of 3)

                // Instruction says: "Max Standard Risk = 60". 
                // "The remaining 40% is locked for Kali/External".
                // BUT Honeypot is browser based. 
                // Does Honeypot count as 'Standard'? It's +20.
                // Let's cap at 80 for Honeypot events? 
                // Logic: Math.min(score, 60) normally. 
                // If event == HONEYPOT, cap at 80?

                let cap = 60;
                if (eventType === "MEMORY_INJECTION_ATTEMPT") cap = 80;

                const finalScore = Math.min(currentScore + impact, cap);
                sessionStorage.setItem("sentinel_risk_score", finalScore.toString());
                return finalScore;
            });
        }
        isStreamingRef.current = true;
        setStreamText(""); // Clear previous stream if any (though logic handles this)

        try {
            const response = await fetch('/api/sentinel', {
                method: 'POST',
                headers: {
                    'x-cid': cid
                },
                body: JSON.stringify({
                    prompt,
                    eventType,
                    fingerprint: identity.fingerprint,
                    ipAddress: identity.ip,
                    alias: identity.alias,
                    location: "Australia/Sydney",
                    threatLevel: identity.riskScore > 50 ? "High" : "Low",
                    riskScore: currentRiskScore
                })
            });

            if (!response.body) {
                throw new Error("No response body");
            }

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

            // ATOMIC COMMIT TO HISTORY & SESSION
            // 1. Clear Active Stream
            // 2. Add Accumulated to History (Top of History Stack)
            // 3. Trim History to max 2 items
            // 4. Save to SessionStorage
            // --- INFAMY LOGIC: EXTRACT & STRIP TAGS ---
            let cleanText = accumulated;
            const tagMatch = accumulated.match(/\[TECHNIQUE:\s*(.*?)\]/);

            if (tagMatch) {
                const fullTag = tagMatch[0];
                const techniqueName = tagMatch[1];

                // Remove tag for UI cleanliness
                cleanText = accumulated.replace(fullTag, "").trim();

                // Infamy Scoring: ONLY if new technique
                // NOTE: logic moved to triggerSentinel for immediate locking.
                // However, the sentinel might return a DIFFERENT technique name than eventType?
                // Rules say: "End response with [TECHNIQUE: Name]"
                // If the name matches eventType, it's fine.
                // If it differs, we might score twice? 
                // Assumption: The Sentinel API mirrors the technical event name if we are passing it.
                // BUT current prompt in route.ts says: "no technical jargon... end with [TECHNIQUE: <Technical Name>]"
                // The Sentinel might make up a name if not careful.
                // We should ensure the Sentinel API prompt uses the Input EventType as the Technique Name if possible.
                // Or relies on our client-side locking.

                // Since we already locked and scored on Request, we DON'T do it here for Sensors.
                // We only do it here if it's a "System Handshake" that somehow generated a technique?
                // OR if the technique name is DIFFERENT from what we locked.

                setSessionTechniques(prev => {
                    // Safety check: Unique add only
                    if (!prev.includes(techniqueName)) {
                        const newTechniques = [...prev, techniqueName];
                        sessionStorage.setItem("sentinel_techniques", JSON.stringify(newTechniques));

                        // Increase Risk (Only if we didn't do it in triggerSentinel)
                        // If techniqueName equals the eventType we just blocked, this shouldn't run.
                        // BUT techniqueName comes from LLM.
                        // If LLM returns exactly the eventType string, we are good (prev.includes will be true).
                        // If LLM hallucinates a new string, we score double.
                        // Ideally LLM returns exactly eventType.

                        // Fallback scoring for unexpected techniques (e.g. from server analysis)
                        setCurrentRiskScore(startScore => {
                            // ... (Same Logic)
                            let impact = 0;
                            const LOW_RISK = ["UI_SURFACE_ANALYSIS", "CONTEXT_MENU_ACCESS", "FORENSIC_INSPECTION"];
                            // ...
                            // Basic +2 fallback if unknown
                            // If it matches known list, use weight.
                            if (LOW_RISK.includes(techniqueName)) impact = 2;
                            else impact = 7; // Med weight default for server findings

                            const newScore = Math.min(startScore + impact, 60);
                            sessionStorage.setItem("sentinel_risk_score", newScore.toString());
                            return newScore;
                        });

                        return newTechniques;
                    }
                    return prev;
                });

                // SILENT PROTOCOL CHECK
                // Since this runs in the stream loop, we need to check if we should show this.
                // We use sessionTechniques from state, but it might not be updated yet.
                // However, we just called setSessionTechniques.
                // Hack: Check if we are seeing a technique we ALREADY knew about before this match found it.
                // Actually, simplest is:
                if (sessionTechniques.includes(techniqueName)) {
                    // It was already known. Silence.
                    setStreamText("");
                    return;
                }
            }

            setStreamText("");
            setHistory(prev => {
                const newHistory = [cleanText, ...prev].slice(0, 3);
                sessionStorage.setItem("sentinel_chat_history", JSON.stringify(newHistory));
                return newHistory;
            });

        } catch (err) {
            console.error("Sentinel Downlink Failed:", err);
            setStreamText("");
            setHistory(prev => {
                const newHistory = [">> CONNECTION LOST <<", ...prev].slice(0, 3);
                sessionStorage.setItem("sentinel_chat_history", JSON.stringify(newHistory));
                return newHistory;
            });
        } finally {
            isStreamingRef.current = false;
        }
    }, [identity, currentRiskScore, sessionTechniques, cid]);
    // ^ Removed isStreaming from dependency to prevent function recreation during stream

    // --- SENSOR ARRAY ---
    useEffect(() => {
        if (!accessGranted) return;

        // 1. DevTools Trigger
        if (isDevToolsOpen) {
            triggerSentinel("Security Alert: System Integrity Check Failed. External Debugger Attached.", "FORENSIC_INSPECTION");
        }

        // 2. Event Listeners
        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
            triggerSentinel("Security Alert: Unauthorized heuristic scan attempt via Context Menu.", "CONTEXT_MENU_ACCESS");
        };

        const handleVisibilityChange = () => {
            if (document.hidden) {
                triggerSentinel("Security Alert: User session backgrounded. Potential out-of-band reconnaissance.", "OUT-OF-BAND_RECON");
            }
        };

        let resizeTimeout: NodeJS.Timeout;
        const handleResize = () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                triggerSentinel("Security Alert: Viewport manipulation detected. UI surface analysis in progress.", "UI_SURFACE_ANALYSIS");
            }, 1000);
        };

        const handleClipboard = () => {
            triggerSentinel("Security Alert: Data egress/ingress attempt via logic gate (Clipboard).", "DATA_EXFILTRATION_ATTEMPT");
        };

        window.addEventListener("contextmenu", handleContextMenu);
        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("resize", handleResize);
        window.addEventListener("copy", handleClipboard);
        window.addEventListener("paste", handleClipboard);

        return () => {
            window.removeEventListener("contextmenu", handleContextMenu);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("resize", handleResize);
            window.removeEventListener("copy", handleClipboard);
            window.removeEventListener("paste", handleClipboard);
            clearTimeout(resizeTimeout);
        };
    }, [accessGranted, isDevToolsOpen, triggerSentinel]);

    // 3. Honeypot Setup (Needs triggerSentinel in scope)
    useEffect(() => {
        if (typeof window !== "undefined") {
            // We need to use a custom event or a direct attach if possible.
            // But 'triggerSentinel' changes on render? 
            // We can attach a listener to 'vgt-honeypot'
            const handleHoney = () => {
                triggerSentinel("Security Alert: Unauthorized heuristic scanning of global variables.", "MEMORY_INJECTION_ATTEMPT");
            };
            window.addEventListener('vgt-honeypot', handleHoney);

            if (!Object.prototype.hasOwnProperty.call(window, '_VGT_DEBUG_')) {
                Object.defineProperty(window, '_VGT_DEBUG_', {
                    get: function () {
                        window.dispatchEvent(new Event('vgt-honeypot'));
                        return "ACCESS DENIED. TRACE STARTED.";
                    },
                    configurable: true // Allow re-definition if needed to avoid errors
                });
            }

            return () => window.removeEventListener('vgt-honeypot', handleHoney);
        }
    }, [triggerSentinel]);
    // Initial Handshake Trigger - Protected by Ref & Session Check
    useEffect(() => {
        if (accessGranted && !hasInitialized.current) {
            hasInitialized.current = true;

            // Check if we already greeted this session
            const alreadyGreeted = sessionStorage.getItem("sentinel_greeted");

            // Attack Detection: Any path that is NOT root and NOT unknown is considered suspicious if hitting the Home Terminal directly
            // Note: This relies on middleware passing x-invoke-path. 
            // If user goes to /admin and middleware rewrites to / (showing Home), invokePath will be /admin.
            const isSuspicious = invokePath && invokePath !== "/" && invokePath !== "/unknown";

            if (!alreadyGreeted) {
                // First time -> Trigger Handshake
                sessionStorage.setItem("sentinel_greeted", "true");

                if (isSuspicious) {
                    // Rule of 3 Logic for Critical Paths
                    criticalPathCountRef.current += 1;
                    if (criticalPathCountRef.current >= 3) {
                        triggerSentinel("Security Alert: Persistent unauthorized access attempt on restricted route.", "Protocol Violation");
                    }
                } else {
                    // Handshake -> 0 Risk Impact (Defined in triggerSentinel default if needed, or just 0 weight)
                    triggerSentinel("System Initialization", "System Handshake");
                }
            } else {
                // Already greeted (Page Refresh or Navigation back)
                if (isSuspicious) {
                    // Attack Logic: Add insult to injury (history) without wiping previous context
                    // Rule of 3 check
                    criticalPathCountRef.current += 1;
                    if (criticalPathCountRef.current >= 3) {
                        triggerSentinel("Security Alert: Persistent unauthorized access attempt.", "Protocol Violation");
                    }
                }
            }
        }
    }, [accessGranted, triggerSentinel, invokePath]);

    const handleAccess = () => {
        localStorage.setItem("watchtower_access", "granted");
        setAccessGranted(true);
    };

    // Wait for client-side mount to prevent hydration mismatch
    if (!isMounted) {
        return null;
    }

    /* Moved to top to satisfy Rules of Hook */

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

                {/* Dashboard Grid */}
                <div className="mb-32 mt-16 grid text-center lg:max-w-5xl lg:w-full lg:mb-0 lg:grid-cols-2 lg:text-left gap-8">

                    {/* Metric Card */}
                    <div className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30">
                        <h2 className={`mb-3 text-2xl font-semibold`}>
                            Threats Detected{" "}
                            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
                                -&gt;
                            </span>
                        </h2>
                        <p className={`m-0 max-w-[30ch] text-5xl font-mono text-red-500`}>
                            {threatCount}
                        </p>
                        <p className="text-sm text-neutral-500 mt-2">All-time blocked attempts</p>
                    </div>

                    {/* Live Feed - Reverse Cascade */}
                    <div className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30 flex flex-col h-64 overflow-hidden relative">
                        <h2 className={`mb-3 text-2xl font-semibold animate-pulse text-blue-500 sticky top-0 z-10 w-full`}>
                            LIVE CONNECTION
                        </h2>

                        {/* Terminal Window
                            Layout: Flex Column Normal (Top Down)
                            We want:
                            1. Title (Already sticky above)
                            2. Active Stream (White) - Immediately below title
                            3. History (Gray) - Below Active Stream
                        */}
                        <div className="flex flex-col gap-1 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-900 scrollbar-track-transparent pr-2 font-mono text-sm leading-relaxed h-full">

                            {/* 1. Active Stream (White) - Visual Top */}
                            {streamText && (
                                <p className="text-[#FFFFFF] animate-pulse whitespace-pre-wrap shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                                    {streamText}<span className="inline-block w-2 h-4 bg-white ml-1 animate-blink">|</span>
                                </p>
                            )}

                            {/* 2. History (Gray) - Visual Bottom */}
                            {/* History is [Newest, Older]. Map normally to show Newest right under Stream */}
                            {history.map((msg, idx) => (
                                <p key={idx} className={`${idx === 0 ? "text-[#FFFFFF]" : "text-[#666666]"} whitespace-pre-wrap`}>
                                    {msg}
                                </p>
                            ))}

                            {/* Empty State */}
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
