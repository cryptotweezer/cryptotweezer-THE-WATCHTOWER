"use client";

import { useEffect, useState } from "react";
import { Monitor, Globe, Clock, Shield, Network } from "lucide-react";

interface IdentityHUDProps {
    alias: string;
    riskScore: number;
    ip: string;
    cid?: string;
    fingerprint?: string;
    onRevealComplete?: () => void;
}

interface DeepScanData {
    browser: string;
    os: string;
    timezone: string;
    screen: string;
}

export default function IdentityHUD({ alias, riskScore, ip, cid, fingerprint, onRevealComplete }: IdentityHUDProps) {
    const [deepScan, setDeepScan] = useState<DeepScanData | null>(null);

    useEffect(() => {
        // Granular Client-Side Deep Scan
        const ua = window.navigator.userAgent;

        // OS Detection
        let os = "[ ANALYZING... ]";
        if (ua.match(/Windows NT 10.0/)) os = "Windows 10/11";
        else if (ua.match(/Windows NT 6.2/)) os = "Windows 8";
        else if (ua.match(/Windows NT 6.1/)) os = "Windows 7";
        else if (ua.match(/Mac OS X/)) os = "macOS";
        else if (ua.match(/Android/)) os = "Android OS";
        else if (ua.match(/Linux/)) os = "Linux Kernel";
        else if (ua.match(/iPhone|iPad|iPod/)) os = "iOS";

        // Browser/Engine Detection
        let browser = "[ ANALYZING... ]";
        if (ua.indexOf("Edg/") !== -1) browser = "Edge (Chromium)";
        else if (ua.indexOf("Chrome") !== -1 && ua.indexOf("Edg") === -1 && ua.indexOf("OPR") === -1) browser = "Chrome (Blink)";
        else if (ua.indexOf("Firefox") !== -1) browser = "Firefox (Gecko)";
        else if (ua.indexOf("Safari") !== -1 && ua.indexOf("Chrome") === -1) browser = "Safari (WebKit)";
        else if (ua.indexOf("OPR") !== -1) browser = "Opera";

        // Simulate analysis delay for effect
        setTimeout(() => {
            setDeepScan({
                browser,
                os,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                screen: `${window.screen.width}x${window.screen.height}`,
            });
        }, 800);
    }, []);

    // Risk Color Logic
    const riskColor = riskScore > 50 ? "text-red-500" : riskScore > 20 ? "text-yellow-500" : "text-blue-400";
    const borderColor = riskScore > 50 ? "border-red-500/30" : "border-blue-500/30";
    const bgColor = riskScore > 50 ? "bg-red-950/10" : "bg-blue-950/10";
    const glow = riskScore > 50 ? "shadow-[0_0_30px_rgba(239,68,68,0.2)]" : "shadow-[0_0_30px_rgba(59,130,246,0.15)]";

    // CID Reveal Logic
    const [displayCID, setDisplayCID] = useState("[SCANNING...]");
    const [revealPhase, setRevealPhase] = useState<'IDLE' | 'ASSIGNING' | 'TYPING' | 'DONE'>('IDLE');
    const [showCursor, setShowCursor] = useState(false);

    // 0. INITIALIZATION & PERSISTENCE
    useEffect(() => {
        // Prevent layout shift/flash by checking persistence immediately if possible
        const isRevealed = localStorage.getItem("sentinel_cid_revealed") === "true";
        if (isRevealed && riskScore >= 20 && cid && cid !== "unknown") {
            setRevealPhase('DONE');
            setDisplayCID(cid);
            setShowCursor(true);
        }
    }, [riskScore, cid]);

    // 1. RISK TRIGGER (IDLE -> ASSIGNING)
    useEffect(() => {
        // Only trigger if NOT already done/revealed
        if (riskScore >= 20 && revealPhase === 'IDLE') {
            // Double check persistence to be safe
            const isRevealed = localStorage.getItem("sentinel_cid_revealed") === "true";
            if (!isRevealed) {
                setRevealPhase('ASSIGNING');
                setDisplayCID("ASSIGNING...");
            }
        }
    }, [riskScore, revealPhase]);

    // 2. ASSIGNING WAITING ROOM (ASSIGNING -> TYPING)
    // We wait here until backend actually delivers the CID.
    useEffect(() => {
        if (revealPhase === 'ASSIGNING') {
            // INTEGRITY FILTER: Must have valid CID format before starting
            if (cid && cid !== "unknown" && cid.startsWith('CID-') && cid.length > 5) {
                // Buffer: 2 seconds of stability
                const timer = setTimeout(() => {
                    setRevealPhase('TYPING');
                    setDisplayCID(""); // Buffer Cleanup
                }, 2000);
                return () => clearTimeout(timer);
            }
        }
    }, [revealPhase, cid]);

    // 3. TYPING EFFECT (TYPING -> DONE)
    useEffect(() => {
        if (revealPhase === 'TYPING' && cid) {
            const realCID = cid;
            // Robustness: Ensure clean CID format
            const formattedCID = realCID.replace(/(CID-)+/g, "CID-");

            // Atomic Slicing State
            let charCount = 0;
            setShowCursor(true);

            // Force initial clear to prevent ghost characters
            setDisplayCID("");

            const typeInterval = setInterval(() => {
                charCount++;

                // ATOMIC UPDATE: Always slice from the original constant string.
                // This prevents race conditions or weird 'prev' state accumulations.
                // We use charCount directly as the length slice.
                const currentSlice = formattedCID.slice(0, charCount);
                setDisplayCID(currentSlice);

                // Stop Condition: When slice length equals full length
                if (charCount >= formattedCID.length) {
                    clearInterval(typeInterval);
                    setRevealPhase('DONE');
                    localStorage.setItem("sentinel_cid_revealed", "true");

                    // CASCADE TRIGGER: 6000ms Delay for Simmering Silence (AAA Pacing)
                    if (onRevealComplete) {
                        setTimeout(() => onRevealComplete(), 6000);
                    }
                }
            }, 75);

            // CLEANUP: Kill the interval if component unmounts or deps change.
            // This prevents "ghost threads" from trying to update state on an unmounted component.
            return () => clearInterval(typeInterval);
        }
    }, [revealPhase, cid, onRevealComplete]);

    // Blinking Cursor Logic
    useEffect(() => {
        if (revealPhase === 'TYPING' || revealPhase === 'DONE') {
            const blinkId = setInterval(() => setShowCursor(c => !c), 500);
            return () => clearInterval(blinkId);
        } else {
            setShowCursor(false);
        }
    }, [revealPhase]);

    return (
        <div className={`rounded-xl border ${borderColor} ${bgColor} ${glow} p-6 max-w-3xl mx-auto backdrop-blur-md transition-all duration-500`}>
            {/* Header */}
            <div className="flex justify-between items-center mb-6 border-b border-gray-800/50 pb-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Shield size={14} className={riskScore > 50 ? "text-red-500" : "text-blue-500"} />
                    Identity Node [Secured]
                </h3>
                <span className="font-mono text-[10px] text-blue-500 animate-pulse flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span> LIVE CONNECTION
                </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                {/* Left Column: Core Identity */}
                <div className="space-y-6">
                    <div className="grid grid-cols-[100px_1fr] items-baseline gap-2">
                        <span className="text-[10px] uppercase text-gray-600 font-mono tracking-wider">Cyber Alias</span>
                        <span className="text-2xl font-mono font-bold text-white tracking-tighter truncate">{alias}</span>
                    </div>

                    {/* NODE ID (Fingerprint) - Static */}
                    <div className="grid grid-cols-[100px_1fr] items-baseline gap-2">
                        <span className="text-[10px] uppercase text-gray-600 font-mono tracking-wider">Node ID</span>
                        <span className="font-mono text-xs text-gray-500 tracking-tight">
                            {fingerprint || "UNKNOWN_NODE"}
                        </span>
                    </div>

                    {/* CRIMINAL ID (CID) */}
                    <div className="grid grid-cols-[100px_1fr] items-baseline gap-2">
                        <span className="text-[10px] uppercase text-gray-600 font-mono tracking-wider">Criminal ID</span>
                        <div className="font-mono text-sm flex items-center gap-2 h-5 w-full"> {/* Fixed height to prevent layout shift */}
                            <span className={`
                                ${revealPhase === 'DONE' ? "text-white" : "text-gray-500 animate-pulse"}
                                ${revealPhase === 'TYPING' ? "text-white" : ""}
                                ${revealPhase === 'ASSIGNING' ? "text-white" : ""} 
                            `}>
                                {displayCID}
                                {showCursor && <span className="text-white">_</span>}
                            </span>

                            {/* Flag Label */}
                            {riskScore >= 60 && (
                                <span className="text-[10px] text-red-500 border border-red-500 px-1 rounded animate-bounce ml-auto">
                                    FLAGGED
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="grid grid-cols-[100px_1fr] items-center gap-2 pt-2">
                        <span className="text-[10px] uppercase text-gray-600 font-mono tracking-wider">Net Address</span>
                        <span className="text-sm font-mono text-blue-300 flex items-center gap-2">
                            <Network size={12} /> {ip}
                        </span>
                    </div>

                    {/* Risk Score */}
                    <div className="mt-4 pt-4 border-t border-gray-800/50 flex justify-between items-center">
                        <span className="text-[10px] text-gray-500 uppercase tracking-widest">Threat Assessment</span>
                        <span className={`text-3xl font-mono font-bold ${riskColor}`}>{riskScore}%</span>
                    </div>
                </div>

                {/* Right Column: Deep Scan Metadata (Aligned Grid) */}
                <div className="space-y-4">

                    <div className="grid grid-cols-[24px_100px_1fr] items-center text-sm font-mono border-b border-gray-800/30 pb-3">
                        <Monitor size={14} className="text-gray-600" />
                        <span className="text-gray-500 text-xs uppercase tracking-wider">System</span>
                        <span className="text-gray-300 text-right">{deepScan ? deepScan.os : <span className="animate-pulse text-gray-600">[ SCANNING ]</span>}</span>
                    </div>

                    <div className="grid grid-cols-[24px_100px_1fr] items-center text-sm font-mono border-b border-gray-800/30 pb-3">
                        <Globe size={14} className="text-gray-600" />
                        <span className="text-gray-500 text-xs uppercase tracking-wider">Engine</span>
                        <span className="text-gray-300 text-right">{deepScan ? deepScan.browser : <span className="animate-pulse text-gray-600">[ ANALYZING ]</span>}</span>
                    </div>

                    <div className="grid grid-cols-[24px_100px_1fr] items-center text-sm font-mono border-b border-gray-800/30 pb-3">
                        <Clock size={14} className="text-gray-600" />
                        <span className="text-gray-500 text-xs uppercase tracking-wider">Timezone</span>
                        <span className="text-gray-300 text-right">{deepScan ? deepScan.timezone : <span className="animate-pulse text-gray-600">[ TRIANGULATING ]</span>}</span>
                    </div>

                    <div className="grid grid-cols-[24px_100px_1fr] items-center text-sm font-mono pb-2 border-b border-gray-800/30 mb-3">
                        <Monitor size={14} className="text-gray-600" />
                        <span className="text-gray-500 text-xs uppercase tracking-wider">Display</span>
                        <span className="text-gray-300 text-right">{deepScan ? deepScan.screen : <span className="animate-pulse text-gray-600">[ MEASURING ]</span>}</span>
                    </div>

                    {/* Status Indicator (Dynamic) - Moved into Grid */}
                    {riskScore >= 20 && (
                        <div className="grid grid-cols-[24px_100px_1fr] items-center text-sm font-mono pt-1">
                            <Shield size={14} className={
                                riskScore >= 100 ? "text-red-500 animate-pulse" :
                                    riskScore >= 60 ? "text-orange-500" :
                                        "text-cyan-400"
                            } />
                            <span className="text-gray-500 text-xs uppercase tracking-wider">Status</span>
                            <span className={`text-right font-bold tracking-widest ${riskScore >= 100 ? "text-red-500 animate-glitch" :
                                riskScore >= 60 ? "text-orange-500" :
                                    "text-cyan-400"
                                }`}>
                                {riskScore >= 100 ? "ADVERSARY" :
                                    riskScore >= 60 ? "THREAT ACTOR" :
                                        "SCRIPT-KIDDIE"}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
