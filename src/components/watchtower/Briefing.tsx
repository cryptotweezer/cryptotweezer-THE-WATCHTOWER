"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Lock, Shield, Cpu, Activity } from "lucide-react";

export default function Briefing() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), 500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className={`mt-24 w-full max-w-6xl mx-auto transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>

            {/* Classified Header */}
            <div className="flex items-center gap-4 mb-12 border-b border-blue-900/30 pb-4">
                <h2 className="font-mono text-xl font-bold text-blue-500 tracking-[0.2em] flex items-center gap-2">
                    <Lock size={18} /> SYSTEM OVERVIEW
                </h2>
                <div className="h-[1px] flex-1 bg-gradient-to-r from-blue-900/50 to-transparent"></div>
            </div>

            {/* Modules Grid (Modern Cards) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Module */}
                <div className="group relative rounded-xl border border-blue-500/30 bg-neutral-950 p-6 transition-all duration-300 hover:scale-[1.03] hover:-translate-y-1 hover:border-blue-400 hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] hover:z-10">
                    <div className="mb-4 flex items-center justify-between">
                        <div className="rounded-full bg-blue-500/10 p-2 text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors duration-300">
                            <Shield size={24} className="animate-pulse group-hover:animate-none" />
                        </div>
                    </div>
                    <h3 className="mb-3 font-mono text-sm font-bold tracking-wider text-blue-500 group-hover:text-blue-300 transition-colors">
                        THE GHOST LAYER
                    </h3>
                    <p className="font-mono text-xs leading-relaxed text-white text-left opacity-90 group-hover:opacity-100 transition-opacity">
                        A sophisticated decoy architecture that intercepts malicious traffic and redirects it to an isolated execution environment,
                        ensuring attackers are observed without compromising real data.
                    </p>
                </div>

                {/* Module */}
                <div className="group relative rounded-xl border border-blue-500/30 bg-neutral-950 p-6 transition-all duration-300 hover:scale-[1.03] hover:-translate-y-1 hover:border-blue-400 hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] hover:z-10">
                    <div className="mb-4 flex items-center justify-between">
                        <div className="rounded-full bg-blue-500/10 p-2 text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors duration-300">
                            <Activity size={24} className="animate-pulse group-hover:animate-none" />
                        </div>
                    </div>
                    <h3 className="mb-3 font-mono text-sm font-bold tracking-wider text-blue-500 group-hover:text-blue-300 transition-colors">
                        PROACTIVE DEFENSE
                    </h3>
                    <p className="font-mono text-xs leading-relaxed text-white text-left opacity-90 group-hover:opacity-100 transition-opacity">
                        Analyzes network behavioral patterns in milliseconds to detect anomalies before they escalate into security incidents.
                    </p>
                </div>

                {/* Module */}
                <div className="group relative rounded-xl border border-blue-500/30 bg-neutral-950 p-6 transition-all duration-300 hover:scale-[1.03] hover:-translate-y-1 hover:border-blue-400 hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] hover:z-10">
                    <div className="mb-4 flex items-center justify-between">
                        <div className="rounded-full bg-blue-500/10 p-2 text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors duration-300">
                            <Cpu size={24} className="animate-pulse group-hover:animate-none" />
                        </div>
                    </div>
                    <h3 className="mb-3 font-mono text-sm font-bold tracking-wider text-blue-500 group-hover:text-blue-300 transition-colors">
                        RESIDENT INTELLIGENCE
                    </h3>
                    <p className="font-mono text-xs leading-relaxed text-white text-left opacity-90 group-hover:opacity-100 transition-opacity">
                        The AI neural layer that acts as a 24/7 sentinel, processing real-time telemetry and generating automated countermeasures.
                    </p>
                </div>
            </div>

            {/* Perimeter Check Banner (Modern) */}
            <div className="mt-12 flex flex-col md:flex-row items-center justify-between gap-4 rounded-lg border border-gray-800/50 bg-neutral-900/50 p-4 font-mono text-xs backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <span className="flex items-center gap-2 rounded bg-green-500/10 px-3 py-1 text-[10px] font-bold tracking-wider text-green-400 animate-pulse">
                        <div className="h-1.5 w-1.5 rounded-full bg-green-500 shadow-[0_0_10px_#22c55e]"></div>
                        SECURE
                    </span>
                    <span className="text-gray-400">
                        [ STATUS ] PERIMETER CHECK: <span className="font-bold text-white">0 OPEN PORTS DETECTED</span>
                    </span>
                </div>
                <div className="flex items-center gap-2 text-gray-500">
                    <CheckCircle2 size={14} className="text-green-500" />
                    <span>GHOST LAYER SEALED</span>
                </div>
            </div>

        </div>
    );
}
