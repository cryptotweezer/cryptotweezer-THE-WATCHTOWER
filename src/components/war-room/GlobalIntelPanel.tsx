"use client";

import { useState, useEffect, useCallback } from "react";

// ============= TYPES =============
export interface GlobalIntelData {
    // Map Data
    attacksByCountry: { country: string; count: number }[];

    // Stats
    activeUsersNow: number;
    totalUsersAllTime: number;
    totalAttacksAllTime: number;
    attacksToday: number;
    topTechniques: { technique: string; count: number }[];
    topCountries: { country: string; count: number }[];
    avgRiskScore: number;

    // Stress State
    eventsLastHour: number;
    stressState: "BRAVO" | "ECHO" | "CHARLIE";
    stressLevel: "LOW" | "MEDIUM" | "HIGH";
    stressColor: string;

    // Attack Velocity
    eventsLast5Min: number;
    attacksPerMinute: number;

    // Live Feed
    recentEvents: {
        id: string;
        eventType: string;
        alias: string;
        timestamp: string;
        riskImpact: number;
        country: string | null;
    }[];

    // Arcjet Intelligence
    arcjetBotsDetected: number;
    arcjetRateLimited: number;
    arcjetShieldTriggers: number;

    // Metadata
    lastUpdated: string;
}

// ============= STRESS STATE CONFIG =============
const STRESS_CONFIG = {
    BRAVO: {
        label: "BRAVO",
        level: "LOW STRESS",
        description: "Minimal threat activity detected",
        color: "#22c55e",
        bgGlow: "rgba(34, 197, 94, 0.1)",
    },
    ECHO: {
        label: "ECHO",
        level: "MEDIUM STRESS",
        description: "Elevated threat activity",
        color: "#eab308",
        bgGlow: "rgba(234, 179, 8, 0.1)",
    },
    CHARLIE: {
        label: "CHARLIE",
        level: "HIGH STRESS",
        description: "Active threat engagement",
        color: "#ef4444",
        bgGlow: "rgba(239, 68, 68, 0.15)",
    },
};

// ============= POLLING INTERVAL =============
const POLL_INTERVAL = 30000; // 30 seconds

// ============= COMPONENT =============
export default function GlobalIntelPanel() {
    const [data, setData] = useState<GlobalIntelData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch global intel data
    const fetchData = useCallback(async () => {
        try {
            const response = await fetch("/api/global-intel");
            if (!response.ok) throw new Error("Failed to fetch global intel");
            const result: GlobalIntelData = await response.json();
            setData(result);
            setError(null);
        } catch (err) {
            console.error("[GlobalIntel] Fetch error:", err);
            setError("Failed to load global intelligence");
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial fetch + polling
    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, POLL_INTERVAL);
        return () => clearInterval(interval);
    }, [fetchData]);

    // Get stress config
    const stressConfig = data ? STRESS_CONFIG[data.stressState] : STRESS_CONFIG.BRAVO;

    // Loading state
    if (loading) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-black/50 rounded-lg border border-zinc-800">
                <div className="text-zinc-500 animate-pulse">
                    INITIALIZING GLOBAL INTELLIGENCE...
                </div>
            </div>
        );
    }

    // Error state
    if (error || !data) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-black/50 rounded-lg border border-red-900/50">
                <div className="text-red-500">
                    {error || "NO DATA AVAILABLE"}
                </div>
            </div>
        );
    }

    return (
        <div
            className="w-full h-full flex flex-col gap-4 p-4 rounded-lg border border-zinc-800 overflow-y-auto cyber-scrollbar"
            style={{
                background: `linear-gradient(180deg, ${stressConfig.bgGlow} 0%, rgba(0,0,0,0.9) 100%)`,
            }}
        >
            {/* HEADER */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-3">
                    <div
                        className="w-3 h-3 rounded-full animate-pulse"
                        style={{ backgroundColor: stressConfig.color }}
                    />
                    <h2 className="text-lg font-mono font-bold text-white tracking-wider">
                        GLOBAL INTELLIGENCE
                    </h2>
                </div>
                <div className="text-xs text-zinc-500 font-mono">
                    LAST UPDATE: {new Date(data.lastUpdated).toLocaleTimeString()}
                </div>
            </div>

            {/* STRESS STATE INDICATOR */}
            <div
                className="flex items-center justify-between p-3 rounded-lg border"
                style={{
                    borderColor: stressConfig.color,
                    backgroundColor: stressConfig.bgGlow,
                }}
            >
                <div className="flex items-center gap-3">
                    <div
                        className="text-2xl font-mono font-black"
                        style={{ color: stressConfig.color }}
                    >
                        {stressConfig.label}
                    </div>
                    <div className="flex flex-col">
                        <span
                            className="text-sm font-bold"
                            style={{ color: stressConfig.color }}
                        >
                            {stressConfig.level}
                        </span>
                        <span className="text-xs text-zinc-500">
                            {stressConfig.description}
                        </span>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-mono font-bold text-white">
                        {data.attacksPerMinute}
                    </div>
                    <div className="text-xs text-zinc-500">attacks/min</div>
                </div>
            </div>

            {/* STATS GRID */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard
                    label="ACTIVE NOW"
                    value={data.activeUsersNow}
                    color="#22d3ee"
                />
                <StatCard
                    label="TOTAL USERS"
                    value={data.totalUsersAllTime}
                    color="#a78bfa"
                />
                <StatCard
                    label="ATTACKS TODAY"
                    value={data.attacksToday}
                    color="#fb923c"
                />
                <StatCard
                    label="TOTAL ATTACKS"
                    value={data.totalAttacksAllTime}
                    color="#ef4444"
                />
            </div>

            {/* ARCJET DEFENSE LAYER */}
            <div className="bg-black/50 rounded-lg border border-zinc-800 p-3">
                <h3 className="text-xs font-mono text-zinc-500 mb-3 tracking-wider">
                    DEFENSE LAYER
                </h3>
                <div className="grid grid-cols-3 gap-3">
                    <StatCard
                        label="BOTS DETECTED"
                        value={data.arcjetBotsDetected}
                        color="#f472b6"
                    />
                    <StatCard
                        label="RATE LIMITED"
                        value={data.arcjetRateLimited}
                        color="#fbbf24"
                    />
                    <StatCard
                        label="WAF TRIGGERS"
                        value={data.arcjetShieldTriggers}
                        color="#f87171"
                    />
                </div>
            </div>

            {/* TWO COLUMN LAYOUT */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* TOP TECHNIQUES */}
                <div className="flex flex-col bg-black/50 rounded-lg border border-zinc-800 p-3 overflow-hidden">
                    <h3 className="text-xs font-mono text-zinc-500 mb-2 tracking-wider">
                        TOP ATTACK VECTORS
                    </h3>
                    <div className="flex-1 overflow-y-auto space-y-1">
                        {data.topTechniques.slice(0, 5).map((tech, i) => (
                            <div
                                key={tech.technique}
                                className="flex justify-between items-center text-sm py-1 border-b border-zinc-800/50"
                            >
                                <span className="text-zinc-400 font-mono truncate">
                                    {i + 1}. {tech.technique}
                                </span>
                                <span className="text-white font-mono font-bold ml-2">
                                    {tech.count}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* LIVE EVENT FEED */}
                <div className="flex flex-col bg-black/50 rounded-lg border border-zinc-800 p-3 overflow-hidden">
                    <h3 className="text-xs font-mono text-zinc-500 mb-2 tracking-wider">
                        LIVE EVENT FEED
                    </h3>
                    <div className="flex-1 overflow-y-auto space-y-1">
                        {data.recentEvents.slice(0, 8).map((event) => (
                            <div
                                key={event.id}
                                className="flex justify-between items-center text-xs py-1 border-b border-zinc-800/50"
                            >
                                <div className="flex items-center gap-2 truncate">
                                    <span className="text-zinc-600">
                                        {new Date(event.timestamp).toLocaleTimeString([], {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </span>
                                    <span className="text-white truncate">
                                        {event.alias}
                                    </span>
                                </div>
                                <span className="text-neutral-500 font-mono ml-2 truncate">
                                    {event.eventType}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* TOP COUNTRIES */}
            {data.topCountries.length > 0 && (
                <div className="flex items-center gap-3 pt-2 border-t border-zinc-800">
                    <span className="text-xs text-zinc-500 font-mono">TOP ORIGINS:</span>
                    <div className="flex gap-2 flex-wrap">
                        {data.topCountries.slice(0, 5).map((country) => (
                            <span
                                key={country.country}
                                className="px-2 py-0.5 bg-zinc-800 rounded text-xs font-mono text-zinc-400"
                            >
                                {country.country} ({country.count})
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ============= STAT CARD COMPONENT =============
function StatCard({
    label,
    value,
    color
}: {
    label: string;
    value: number;
    color: string;
}) {
    return (
        <div className="bg-black/50 rounded-lg border border-zinc-800 p-3 text-center">
            <div
                className="text-2xl font-mono font-bold"
                style={{ color }}
            >
                {value.toLocaleString()}
            </div>
            <div className="text-xs text-zinc-500 font-mono mt-1">
                {label}
            </div>
        </div>
    );
}
