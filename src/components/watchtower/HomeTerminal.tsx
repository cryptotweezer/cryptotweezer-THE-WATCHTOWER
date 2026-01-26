"use client";

import { useState, useCallback } from "react";

import Gatekeeper from "@/components/watchtower/Gatekeeper";
import IdentityHUD from "@/components/watchtower/IdentityHUD";
import Briefing from "@/components/watchtower/Briefing";
import Footer from "@/components/watchtower/Footer";

interface SecurityEvent {
    id: string;
    eventType: string;
    ipAddress: string | null;
    actionTaken: string;
    timestamp: Date | string;
}

interface HomeTerminalProps {
    threatCount: number;
    recentEvents: SecurityEvent[];
    identity: {
        alias: string;
        fingerprint: string | null;
        riskScore: number;
        ip: string | null;
    };
}

export default function HomeTerminal({ threatCount, recentEvents, identity }: HomeTerminalProps) {
    const [accessGranted, setAccessGranted] = useState(false);

    const [aiResponse, setAiResponse] = useState("");

    // Manual Stream Implementation (Plan C)
    const startSentinel = useCallback(async () => {
        setAiResponse("");

        try {
            const response = await fetch('/api/sentinel', {
                method: 'POST',
                body: JSON.stringify({
                    prompt: "Initialize system. Report status.",
                    eventType: 'System Handshake',
                    fingerprint: identity.fingerprint,
                    ipAddress: identity.ip,
                    location: "Australia/Sydney",
                    threatLevel: identity.riskScore > 50 ? "High" : "Low"
                })
            });

            if (!response.body) return;

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                setAiResponse((prev) => prev + decoder.decode(value, { stream: true }));
            }
        } catch (err) {
            console.error("Sentinel Downlink Failed:", err);
            setAiResponse(">> CONNECTION LOST <<");
        }
    }, [identity]);

    const handleAccess = (granted: boolean) => {
        setAccessGranted(granted);
        if (granted) {
            startSentinel();
        }
    };

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

                    {/* Live Feed */}
                    <div className="group rounded-lg border border-transparent px-5 py-4 transition-colors border-neutral-800 bg-neutral-900/50">
                        <h2 className={`mb-3 text-2xl font-semibold animate-pulse text-blue-500`}>
                            LIVE CONNECTION
                        </h2>
                        <div className="space-y-4">
                            {recentEvents.length === 0 ? (
                                <p className="text-neutral-200 font-mono text-sm leading-relaxed whitespace-pre-wrap">
                                    {aiResponse || "Awaiting Sentinel downlink..."}
                                </p>
                            ) : (
                                recentEvents.map((event) => (
                                    <div key={event.id} className="flex justify-between items-start border-l-2 border-red-500 pl-4 py-1">
                                        <div>
                                            <p className="font-mono text-red-400 text-sm font-bold">{event.eventType}</p>
                                            <p className="text-xs text-neutral-500">{event.ipAddress || "Unknown IP"}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs font-mono px-2 py-1 rounded bg-neutral-800 text-neutral-300">{event.actionTaken}</span>
                                            <p className="text-[10px] text-neutral-600 mt-1">
                                                {new Date(event.timestamp).toLocaleTimeString()}
                                            </p>
                                        </div>
                                    </div>
                                ))
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
