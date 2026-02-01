"use client";

import { useEffect, useState } from "react";
import { Activity } from "lucide-react";
import IdentityHUD from "@/components/watchtower/IdentityHUD";
import Briefing from "@/components/watchtower/Briefing";
import Footer from "@/components/watchtower/Footer";
import Gatekeeper from "@/components/watchtower/Gatekeeper";
import useSentinelManager from "./useSentinelManager";
import useSentinelSensors from "./useSentinelSensors";

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

export default function HomeTerminal({ identity, invokePath }: HomeTerminalProps) {
    // 1. MANAGER (Brain)
    const { state, actions, refs } = useSentinelManager({ identity, invokePath });

    // 2. SENSORS (Eyes)
    useSentinelSensors({
        triggerSentinel: actions.triggerSentinel,
        isSystemReadyRef: refs.isSystemReadyRef,
        accessGranted: state.accessGranted
    });

    const [isMounted, setIsMounted] = useState(false);
    // eslint-disable-next-line
    useEffect(() => { setIsMounted(true); }, []);

    if (!isMounted) return null;

    return (
        <>
            {!state.accessGranted && <Gatekeeper onAccess={actions.handleAccess} />}

            <main className={`flex min-h-screen flex-col items-center justify-between p-24 bg-neutral-950 text-neutral-200 transition-all duration-1000 ${state.accessGranted ? "blur-none opacity-100 scale-100" : "blur-lg opacity-50 scale-95 overflow-hidden h-screen"}`}>

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
                            riskScore={state.currentRiskScore}
                            ip={identity.ip || "unknown"}
                            cid={state.cid}
                        />
                    </div>
                </div>

                {/* Dashboard Grid */}
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
                                {state.sessionTechniques.length}
                            </p>
                        </div>

                        {/* Event Log */}
                        <div className="group flex-1 flex flex-col rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30 text-left min-h-0">
                            <h3 className="mb-2 text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                <Activity size={14} className="text-red-500" />
                                Signal Logs
                            </h3>
                            <div className="font-mono text-xs flex-1 overflow-y-auto scrollbar-none pr-1">
                                {state.eventLog.map((log, idx) => (
                                    <p key={idx} className="text-[#FFFFFF] whitespace-normal break-words leading-tight mb-2 opacity-90 hover:opacity-100">{log}</p>
                                ))}
                                {state.eventLog.length === 0 && <span className="text-gray-600 italic opacity-50">-- NO ANOMALIES --</span>}
                            </div>
                        </div>
                    </div>

                    {/* Right Column (B): Live Feed */}
                    <div className="w-full lg:w-1/2 group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30 flex flex-col relative h-full lg:max-h-[500px]">
                        <h2 className={`mb-3 text-2xl font-semibold animate-pulse ${state.currentRiskScore >= 100 ? "text-red-500" : state.currentRiskScore >= 60 ? "text-orange-500" : state.currentRiskScore >= 20 ? "text-cyan-400" : "text-blue-500"} sticky top-0 z-10 w-full`}>
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
                            {state.streamText && (
                                <p className="text-[#FFFFFF] animate-pulse whitespace-pre-wrap shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                                    {state.streamText}<span className="inline-block w-2 h-4 bg-white ml-1 animate-blink">|</span>
                                </p>
                            )}
                            {state.history.map((msg, idx) => (
                                <p key={idx} className={`${idx === 0 ? "text-[#FFFFFF]" : "text-[#666666]"} whitespace-pre-wrap`}>
                                    {msg}
                                </p>
                            ))}
                            {state.history.length === 0 && !state.streamText && (
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
