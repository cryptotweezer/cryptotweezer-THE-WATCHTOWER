"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import type { GlobalIntelData } from "./GlobalIntelPanel";

const WorldAttackMap = dynamic(() => import("./WorldAttackMap"), {
    ssr: false,
    loading: () => (
        <div className="w-full flex-1 flex items-center justify-center text-xs font-mono bg-black/50 rounded-lg border border-cyan-900/30">
            <span className="text-cyan-500/40 animate-pulse">INITIALIZING GEO-SYSTEM...</span>
        </div>
    ),
});

const POLL_INTERVAL = 30000;
// How long a country stays "pulsing" before fading out (ms)
const PULSE_DURATION = 5000;

export default function GeoTrackerPanel() {
    const [data, setData] = useState<GlobalIntelData | null>(null);
    const [loading, setLoading] = useState(true);
    const [pulsingCountries, setPulsingCountries] = useState<Set<string>>(new Set());

    // Track previous attack counts to detect new activity
    const prevCountsRef = useRef<Record<string, number>>({});
    // Track active pulse timers so we can clear them on unmount
    const pulseTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
    const isFirstLoad = useRef(true);

    const fetchData = useCallback(async () => {
        try {
            const response = await fetch("/api/global-intel");
            if (!response.ok) throw new Error("Failed to fetch");
            const result: GlobalIntelData = await response.json();

            // Build current counts map from raw API data
            const currentCounts: Record<string, number> = {};
            result.attacksByCountry.forEach(({ country, count }) => {
                currentCounts[country] = count;
            });

            // Detect which countries have new activity
            const newPulsing: string[] = [];
            const prev = prevCountsRef.current;

            if (isFirstLoad.current) {
                // First load: pulse ALL countries that have attacks
                Object.keys(currentCounts).forEach((country) => {
                    newPulsing.push(country);
                });
                isFirstLoad.current = false;
            } else {
                // Subsequent polls: only pulse countries with INCREASED count
                Object.entries(currentCounts).forEach(([country, count]) => {
                    if (!prev[country] || count > prev[country]) {
                        newPulsing.push(country);
                    }
                });
            }

            // Update previous counts for next comparison
            prevCountsRef.current = currentCounts;

            // Add new pulsing countries and schedule their removal
            if (newPulsing.length > 0) {
                setPulsingCountries((prevSet) => {
                    const next = new Set(prevSet);
                    newPulsing.forEach((c) => next.add(c));
                    return next;
                });

                // Schedule fade-out for each newly pulsing country
                newPulsing.forEach((country) => {
                    // Clear existing timer if country re-pulses before fading
                    const existing = pulseTimersRef.current.get(country);
                    if (existing) clearTimeout(existing);

                    const timer = setTimeout(() => {
                        setPulsingCountries((prevSet) => {
                            const next = new Set(prevSet);
                            next.delete(country);
                            return next;
                        });
                        pulseTimersRef.current.delete(country);
                    }, PULSE_DURATION);

                    pulseTimersRef.current.set(country, timer);
                });
            }

            setData(result);
        } catch (err) {
            console.error("[GeoTracker] Fetch error:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, POLL_INTERVAL);
        const timers = pulseTimersRef.current;
        return () => {
            clearInterval(interval);
            // Cleanup all pulse timers on unmount
            timers.forEach((timer) => clearTimeout(timer));
            timers.clear();
        };
    }, [fetchData]);

    if (loading) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <span className="text-zinc-500 animate-pulse font-mono text-sm">
                    INITIALIZING GEO TRACKER...
                </span>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <span className="text-red-500 font-mono text-sm">GEO DATA UNAVAILABLE</span>
            </div>
        );
    }

    const stressColor =
        data.stressState === "CHARLIE"
            ? "#ef4444"
            : data.stressState === "ECHO"
              ? "#eab308"
              : "#22c55e";

    return (
        <div className="w-full h-full flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2 mb-3 shrink-0">
                <h2 className="text-[10px] text-neutral-600 tracking-[0.2em] uppercase">
                    Geo Tracker
                </h2>
                <span className="text-[10px] text-cyan-500/60 animate-pulse flex items-center gap-1.5 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-500/60" />
                    LIVE
                </span>
            </div>

            {/* Map — takes all available space */}
            <div className="flex-1 min-h-0">
                <WorldAttackMap
                    attacksByCountry={data.attacksByCountry}
                    stressColor={stressColor}
                    pulsingCountries={pulsingCountries}
                />
            </div>

            {/* Country interaction counts — compact bottom bar */}
            {data.topCountries.length > 0 && (
                <div className="shrink-0 border-t border-neutral-800 pt-3 mt-3">
                    <div className="text-[10px] text-neutral-600 uppercase tracking-widest mb-2 font-mono">
                        Origin Activity
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {data.topCountries.map((c) => {
                            const isActive = pulsingCountries.has(c.country);
                            return (
                                <span
                                    key={c.country}
                                    className={`px-2 py-1 rounded text-xs font-mono flex items-center gap-1.5 transition-all duration-500 ${
                                        isActive
                                            ? "bg-cyan-500/15 border border-cyan-500/50 text-cyan-300"
                                            : "bg-cyan-500/5 border border-cyan-900/30 text-cyan-400/80"
                                    }`}
                                >
                                    <span className={isActive ? "text-white" : "text-white/70"}>{c.country}</span>
                                    <span className={`font-bold ${isActive ? "text-cyan-300" : "text-cyan-400"}`}>{c.count}</span>
                                </span>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
