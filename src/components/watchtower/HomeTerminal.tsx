"use client";

import { useState, useCallback, useEffect, useRef } from "react";

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

    // REFS for Logic (Non-rendering state)
    const isStreamingRef = useRef(false);
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
        // Checks sessionStorage for existing history to prevent loss on refresh
        const storedHistory = sessionStorage.getItem("sentinel_chat_history");
        if (storedHistory) {
            try {
                setHistory(JSON.parse(storedHistory));
            } catch (e) {
                console.error("Failed to parse history", e);
            }
        }
    }, []);

    const triggerSentinel = useCallback(async (prompt: string, eventType: string) => {
        // Double check checks using REF to avoid dependency cycles
        if (isStreamingRef.current) return;

        isStreamingRef.current = true;
        setStreamText(""); // Clear previous stream if any (though logic handles this)

        try {
            const response = await fetch('/api/sentinel', {
                method: 'POST',
                body: JSON.stringify({
                    prompt,
                    eventType,
                    fingerprint: identity.fingerprint,
                    ipAddress: identity.ip,
                    alias: identity.alias,
                    location: "Australia/Sydney",
                    threatLevel: identity.riskScore > 50 ? "High" : "Low"
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
            setStreamText("");
            setHistory(prev => {
                const newHistory = [accumulated, ...prev].slice(0, 3);
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
    }, [identity]);
    // ^ Removed isStreaming from dependency to prevent function recreation during stream

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
                    // Immediate Hostility for suspicious first entry
                    triggerSentinel("Security Alert: Unauthorized Access Attempt detected on restricted route.", "Protocol Violation");
                } else {
                    triggerSentinel("System Initialization", "System Handshake");
                }
            } else {
                // Already greeted (Page Refresh or Navigation back)
                // Sentinel remains silent UNLESS there is an active new threat (Suspicious Path)
                if (isSuspicious) {
                    // Attack Logic: Add insult to injury (history) without wiping previous context
                    triggerSentinel("Security Alert: Persistent unauthorized access attempt.", "Protocol Violation");
                }
            }
        }
    }, [accessGranted, triggerSentinel, invokePath]);

    const handleAccess = (granted: boolean) => {
        localStorage.setItem("watchtower_access", "granted");
        setAccessGranted(true);
    };

    // Wait for client-side mount to prevent hydration mismatch
    if (!isMounted) {
        return null;
    }

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
                            fingerprint={identity.fingerprint || "unknown"}
                            riskScore={identity.riskScore}
                            ip={identity.ip || "unknown"}
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
