"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useSentinel } from "@/contexts/SentinelContext";
import Link from "next/link";

interface WarRoomShellProps {
    identity: {
        alias: string;
        fingerprint: string | null;
        cid?: string | null;
        riskScore: number;
        ip: string | null;
        sessionTechniques?: string[];
    };
    initialLogs?: string[];
    invokePath?: string;
}

export default function WarRoomShell({ identity, initialLogs, invokePath }: WarRoomShellProps) {

    const CID_REVEAL_THRESHOLD = 20;

    const { actions, state } = useSentinel();

    const { isLoaded: isClerkLoaded } = useUser();
    const [isMounted, setIsMounted] = useState(false);

    // Hydrate context from server-provided identity
    useEffect(() => {
        setIsMounted(true);
        actions.hydrateFromServer(identity, invokePath, initialLogs);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    // Wait for mount
    if (!isMounted) return null;

    // Wait for Clerk and Identity to be fully loaded
    const isFullyReady = isClerkLoaded && state.isIdentityReady;

    // Risk-based color theming
    const getRiskColor = () => {
        if (state.currentRiskScore >= 70) return "text-red-500";
        if (state.currentRiskScore >= 40) return "text-orange-500";
        if (state.currentRiskScore >= 20) return "text-cyan-400";
        return "text-neutral-500";
    };

    return (
        <div className="h-screen w-screen bg-black text-white font-mono overflow-hidden flex flex-col">
            {/* Header */}
            <header className="h-12 border-b border-neutral-800 flex items-center justify-between px-4 shrink-0">
                <Link
                    href="/"
                    className="text-[#00f2ff] hover:underline transition-colors text-sm"
                >
                    &lt; THE WATCHTOWER
                </Link>
                <h1 className="text-xs tracking-[0.3em] text-neutral-400 uppercase">
                    Global Command Center (GCC)
                </h1>
                <div className={`text-xs ${getRiskColor()}`}>
                    {!isFullyReady ? (
                        "SYNCING..."
                    ) : state.currentRiskScore >= CID_REVEAL_THRESHOLD ? (
                        identity.cid || state.cid || "CID-UNKNOWN"
                    ) : (
                        "SCANNING..."
                    )}
                </div>

            </header>

            {/* 3-Column Grid */}
            <main className="flex-1 grid grid-cols-[280px_1fr_320px] gap-px bg-neutral-900">
                {/* LEFT: Control Panel */}
                <section className="bg-black p-4 overflow-hidden flex flex-col">
                    <h2 className="text-[10px] text-neutral-600 mb-4 tracking-[0.2em] uppercase border-b border-neutral-800 pb-2">
                        Control
                    </h2>

                    {/* Navigation Links */}
                    <nav className="flex flex-col gap-2 text-sm">
                        <button className="text-left text-neutral-400 hover:text-[#00f2ff] transition-colors py-1 border-l-2 border-transparent hover:border-[#00f2ff] pl-2">
                            [{isFullyReady ? identity.alias : "INITIALIZING_IDENTITY..."}]
                        </button>
                        <button className="text-left text-neutral-600 hover:text-[#00f2ff] transition-colors py-1 border-l-2 border-transparent hover:border-[#00f2ff] pl-2">
                            GLOBAL INTELLIGENCE
                        </button>
                        <button className="text-left text-neutral-600 hover:text-[#00f2ff] transition-colors py-1 border-l-2 border-transparent hover:border-[#00f2ff] pl-2">
                            CONTACT DEV
                        </button>
                    </nav>

                    {/* Unique Techniques Counter */}
                    <div className="border-t border-neutral-800 pt-4 mt-4">
                        <div className="text-[10px] text-neutral-600 uppercase tracking-widest mb-1">
                            Unique Techniques
                        </div>
                        <div className="text-2xl font-bold text-red-500">
                            {state.uniqueTechniqueCount}
                        </div>
                    </div>

                    {/* Spacer */}
                    <div className="flex-1" />

                    {/* Risk Indicator */}
                    <div className="border-t border-neutral-800 pt-4">
                        <div className="text-[10px] text-neutral-600 uppercase tracking-widest mb-2">
                            Threat Level
                        </div>
                        <div className={`text-3xl font-bold ${getRiskColor()}`}>
                            {state.currentRiskScore}%
                        </div>
                        <div className="h-1 bg-neutral-800 mt-2 rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all duration-500 ${state.currentRiskScore >= 70 ? "bg-red-500" : state.currentRiskScore >= 40 ? "bg-orange-500" : state.currentRiskScore >= 20 ? "bg-cyan-400" : "bg-neutral-600"}`}
                                style={{ width: `${state.currentRiskScore}%` }}
                            />
                        </div>
                    </div>
                </section>

                {/* CENTER: Deployment Zone */}
                <section className="bg-black p-4 overflow-hidden flex flex-col">
                    <h2 className="text-[10px] text-neutral-600 mb-4 tracking-[0.2em] uppercase border-b border-neutral-800 pb-2">
                        Deployment
                    </h2>

                    {/* Subject Metadata Placeholder */}
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                            <div className="text-neutral-700 text-6xl mb-4">{"//"}</div>
                            <div className="text-neutral-600 text-sm tracking-widest">
                                SUBJECT_METADATA_STREAM
                            </div>
                            <div className="text-neutral-700 text-xs mt-2">
                                [PENDING: Phase 2.B Implementation]
                            </div>
                        </div>
                    </div>
                </section>

                {/* RIGHT: Intelligence Feed */}
                <section className="bg-black p-4 overflow-hidden flex flex-col">
                    <h2 className="text-[10px] text-neutral-600 mb-4 tracking-[0.2em] uppercase border-b border-neutral-800 pb-2">
                        Intelligence
                    </h2>

                    {/* Event Log */}
                    <div className="flex-1 overflow-y-auto text-xs space-y-1">
                        {state.eventLog.length > 0 ? (
                            state.eventLog.map((log, idx) => (
                                <p
                                    key={idx}
                                    className={`${idx === 0 ? "text-white" : "text-neutral-600"} leading-relaxed`}
                                >
                                    {log}
                                </p>
                            ))
                        ) : (
                            <p className="text-neutral-700 italic">-- NO SIGNALS --</p>
                        )}
                    </div>

                    {/* Sentinel Chat Placeholder */}
                    <div className="border-t border-neutral-800 pt-4 mt-4">
                        <div className="text-[10px] text-neutral-600 uppercase tracking-widest mb-2">
                            Sentinel Uplink
                        </div>
                        <div className="text-neutral-600 text-xs">
                            {state.streamText ? (
                                <span className="text-white animate-pulse">
                                    {state.streamText}
                                    <span className="inline-block w-1 h-3 bg-white ml-1">|</span>
                                </span>
                            ) : state.history[0] ? (
                                <span className="text-neutral-400">{state.history[0].substring(0, 100)}...</span>
                            ) : (
                                <span className="italic text-neutral-700">[AWAITING TRANSMISSION]</span>
                            )}
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
