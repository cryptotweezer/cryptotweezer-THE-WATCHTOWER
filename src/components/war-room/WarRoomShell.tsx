"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { useSentinel } from "@/contexts/SentinelContext";
import Link from "next/link";
import { Shield, Network, Monitor, Globe, Clock, Send, AlertTriangle } from "lucide-react";
import GlobalIntelPanel from "./GlobalIntelPanel";
import GeoTrackerPanel from "./GeoTrackerPanel";
import ContactFormPanel from "./ContactFormPanel";
import DebugConsolePanel from "./DebugConsolePanel";
import WallOfInfamyPanel from "./WallOfInfamyPanel";
import { forensicWipe, updateAlias } from "@/app/actions";

type ActiveView = "subject" | "global-intel" | "geo-tracker" | "contact" | "wall-of-infamy" | "debug-console" | "forensic-wipe";

interface DeepScanData {
    browser: string;
    os: string;
    timezone: string;
    screen: string;
}

interface ChatMessage {
    role: "user" | "sentinel";
    content: string;
}

interface WarRoomShellProps {
    identity: {
        alias: string;
        fingerprint: string | null;
        cid?: string | null;
        riskScore: number;
        ip: string | null;
        sessionTechniques?: string[];
        riskCap?: number;
    };
    operations?: {
        desertStorm: boolean;
        overlord: boolean;
        rollingThunder: boolean;
    };
    initialLogs?: string[];
    invokePath?: string;
    integrityToken?: string;
}

export default function WarRoomShell({ identity, operations, initialLogs, invokePath, integrityToken }: WarRoomShellProps) {

    const CID_REVEAL_THRESHOLD = 20;

    const { actions, state } = useSentinel();

    const { isLoaded: isClerkLoaded } = useUser();
    const { signOut } = useClerk();
    const [isMounted, setIsMounted] = useState(false);
    const [deepScan, setDeepScan] = useState<DeepScanData | null>(null);
    const [activeView, setActiveView] = useState<ActiveView>("subject");
    const [isWiping, setIsWiping] = useState(false);

    // Alias editing state
    const [isEditingAlias, setIsEditingAlias] = useState(false);
    const [aliasInput, setAliasInput] = useState(identity.alias);
    const [displayAlias, setDisplayAlias] = useState(identity.alias);
    const [aliasError, setAliasError] = useState("");
    const aliasInputRef = useRef<HTMLInputElement>(null);

    // Chat state
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState("");
    const [isStreaming, setIsStreaming] = useState(false);
    const [streamingText, setStreamingText] = useState("");
    const chatEndRef = useRef<HTMLDivElement>(null);
    const chatInputRef = useRef<HTMLInputElement>(null);
    const chatInitialized = useRef(false);

    const CHAT_STORAGE_KEY = identity.fingerprint
        ? `warroom_chat_${identity.fingerprint}`
        : null;

    // Hydrate context from server-provided identity
    useEffect(() => {
        setIsMounted(true);
        actions.hydrateFromServer(identity, invokePath, initialLogs);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Initialize chat: localStorage first, then fallback to state.history seed
    useEffect(() => {
        if (chatInitialized.current || !CHAT_STORAGE_KEY) return;

        // Try localStorage (persisted chat)
        const stored = localStorage.getItem(CHAT_STORAGE_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored) as ChatMessage[];
                if (parsed.length > 0) {
                    setChatMessages(parsed);
                    chatInitialized.current = true;
                    return;
                }
            } catch { /* fall through to history seed */ }
        }

        // Fallback: seed from SentinelContext history (first visit)
        if (state.history.length > 0) {
            chatInitialized.current = true;
            const seeded: ChatMessage[] = [...state.history]
                .reverse()
                .map(msg => ({ role: "sentinel" as const, content: msg }));
            setChatMessages(seeded);
        }
    }, [CHAT_STORAGE_KEY, state.history]);

    // Capture new auto-triggered sentinel messages (from sensors) into chat
    // Uses content dedup: only adds if the exact message doesn't already exist in chat
    useEffect(() => {
        if (!chatInitialized.current) return;
        const latestAuto = state.history[0];
        if (!latestAuto) return;

        setChatMessages(prev => {
            // Check if this exact message already exists anywhere in chat
            if (prev.some(m => m.role === "sentinel" && m.content === latestAuto)) return prev;
            return [...prev, { role: "sentinel", content: latestAuto }];
        });
    }, [state.history]);

    // Persist chat to localStorage on every change
    useEffect(() => {
        if (!CHAT_STORAGE_KEY || chatMessages.length === 0) return;
        localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(chatMessages));
    }, [chatMessages, CHAT_STORAGE_KEY]);

    // Auto-scroll to bottom
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatMessages, streamingText]);

    // Client-side deep scan (mirrors IdentityHUD logic)
    useEffect(() => {
        const ua = window.navigator.userAgent;

        let os = "[ ANALYZING... ]";
        if (ua.match(/Windows NT 10.0/)) os = "Windows 10/11";
        else if (ua.match(/Windows NT 6.2/)) os = "Windows 8";
        else if (ua.match(/Windows NT 6.1/)) os = "Windows 7";
        else if (ua.match(/Mac OS X/)) os = "macOS";
        else if (ua.match(/Android/)) os = "Android OS";
        else if (ua.match(/Linux/)) os = "Linux Kernel";
        else if (ua.match(/iPhone|iPad|iPod/)) os = "iOS";

        let browser = "[ ANALYZING... ]";
        if (ua.indexOf("Edg/") !== -1) browser = "Edge (Chromium)";
        else if (ua.indexOf("Chrome") !== -1 && ua.indexOf("Edg") === -1 && ua.indexOf("OPR") === -1) browser = "Chrome (Blink)";
        else if (ua.indexOf("Firefox") !== -1) browser = "Firefox (Gecko)";
        else if (ua.indexOf("Safari") !== -1 && ua.indexOf("Chrome") === -1) browser = "Safari (WebKit)";
        else if (ua.indexOf("OPR") !== -1) browser = "Opera";

        setTimeout(() => {
            setDeepScan({
                browser,
                os,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                screen: `${window.screen.width}x${window.screen.height}`,
            });
        }, 600);
    }, []);

    // Send user message to Sentinel Chat API (War Room dedicated endpoint)
    const sendMessage = useCallback(async () => {
        const message = chatInput.trim();
        if (!message || isStreaming) return;

        const fp = identity.fingerprint;
        if (!fp || fp === "unknown") return;

        const newUserMsg: ChatMessage = { role: "user", content: message };
        const updatedMessages = [...chatMessages, newUserMsg];

        setChatMessages(updatedMessages);
        setChatInput("");
        setIsStreaming(true);
        setStreamingText("");

        try {
            const response = await fetch("/api/sentinel/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: updatedMessages,
                    fingerprint: fp,
                    identity: {
                        alias: identity.alias,
                        cid: identity.cid || state.cid || "UNKNOWN",
                        riskScore: state.currentRiskScore,
                        ip: identity.ip || "unknown",
                    },
                }),
            });

            if (!response.ok) throw new Error(`API Error: ${response.status}`);
            if (!response.body) throw new Error("No response body");

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let accumulated = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                accumulated += chunk;
                setStreamingText(accumulated);
            }

            const cleanText = accumulated.trim();
            setChatMessages(prev => [...prev, { role: "sentinel", content: cleanText }]);
            setStreamingText("");
        } catch (err) {
            console.error("Chat send failed:", err);
            setChatMessages(prev => [...prev, { role: "sentinel", content: "[TRANSMISSION FAILED — RETRY]" }]);
            setStreamingText("");
        } finally {
            setIsStreaming(false);
            // Re-focus input after response completes
            setTimeout(() => chatInputRef.current?.focus(), 50);
        }
    }, [chatInput, isStreaming, identity, chatMessages, state.cid, state.currentRiskScore]);

    // FORENSIC WIPE: Erase all traces and redirect to Gatekeeper
    const handleForensicWipe = async () => {
        if (!identity.fingerprint || isWiping) return;
        setIsWiping(true);

        try {
            // 1. Server: Purge DB records
            await forensicWipe(identity.fingerprint);

            // 2. Client: Clear all Watchtower localStorage keys
            for (let i = localStorage.length - 1; i >= 0; i--) {
                const key = localStorage.key(i);
                if (key && (key.startsWith("sentinel_") || key.startsWith("watchtower_") || key.startsWith("warroom_"))) {
                    localStorage.removeItem(key);
                }
            }

            // 3. Client: Clear sessionStorage
            sessionStorage.clear();

            // 4. Client: Expire tracking cookie
            document.cookie = "watchtower_node_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

            // 5. Clerk: Sign out (no redirect — we handle it manually)
            await signOut({ redirectUrl: undefined });

            // 6. Hard redirect: Forces full React tree rebuild so SentinelContext
            // re-initializes with clean localStorage (accessGranted = false → Gatekeeper shows)
            window.location.href = "/";
        } catch (error) {
            console.error("[FORENSIC_WIPE] Execution failed:", error);
            setIsWiping(false);
        }
    };

    // Alias editing handlers
    const handleAliasEdit = () => {
        setIsEditingAlias(true);
        setAliasInput(displayAlias);
        setAliasError("");
        setTimeout(() => aliasInputRef.current?.select(), 50);
    };

    const handleAliasSave = async () => {
        if (!identity.fingerprint) return;
        const result = await updateAlias(identity.fingerprint, aliasInput);
        if (result.success && result.alias) {
            setDisplayAlias(result.alias);
            setIsEditingAlias(false);
            setAliasError("");
        } else {
            setAliasError(result.error || "Failed");
        }
    };

    const handleAliasKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") handleAliasSave();
        if (e.key === "Escape") {
            setIsEditingAlias(false);
            setAliasError("");
        }
    };

    // Wait for mount
    if (!isMounted) return null;

    // Wait for Clerk and Identity to be fully loaded
    const isFullyReady = isClerkLoaded && state.isIdentityReady;

    // Risk-based color theming (matches IdentityHUD in Home)
    const getRiskColor = () => {
        if (state.currentRiskScore > 50) return "text-red-500";
        if (state.currentRiskScore > 20) return "text-yellow-500";
        return "text-blue-400";
    };

    const getRiskBarColor = () => {
        if (state.currentRiskScore > 50) return "bg-red-500";
        if (state.currentRiskScore > 20) return "bg-yellow-500";
        return "bg-blue-400";
    };

    // Status rank based on risk score
    const getStatusRank = () => {
        if (state.currentRiskScore >= 100) return { label: "ADVERSARY", color: "text-red-500", animate: "animate-pulse", iconColor: "text-red-500" };
        if (state.currentRiskScore >= 60) return { label: "THREAT ACTOR", color: "text-orange-500", animate: "", iconColor: "text-orange-500" };
        if (state.currentRiskScore >= 20) return { label: "SCRIPT-KIDDIE", color: "text-cyan-400", animate: "", iconColor: "text-cyan-400" };
        return null;
    };

    const statusRank = getStatusRank();
    const displayCID = state.currentRiskScore >= CID_REVEAL_THRESHOLD
        ? (identity.cid || state.cid || "CID-UNKNOWN")
        : "[SCANNING...]";

    return (
        <div className="h-screen w-screen bg-black text-white font-mono overflow-hidden flex flex-col">
            {/* Header */}
            <header className="h-12 border-b border-neutral-800 flex items-center justify-between px-4 shrink-0">
                <Link
                    href="/"
                    className="text-blue-500 hover:underline transition-colors text-sm"
                >
                    &lt; THE WATCHTOWER
                </Link>
                <h1 className="text-xs tracking-[0.3em] text-neutral-400 uppercase">
                    Global Command Center (GCC)
                </h1>
                <div className={`text-xs flex items-center gap-1.5 ${isFullyReady ? "text-green-500 animate-pulse" : "text-neutral-600"}`}>
                    {isFullyReady && <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>}
                    {!isFullyReady ? "SYNCING..." : "ONLINE"}
                </div>
            </header>

            {/* 3-Column Grid */}
            <main className="flex-1 grid grid-cols-[240px_1fr_320px] gap-px bg-neutral-900 overflow-hidden">
                {/* LEFT: Control Panel */}
                <section className="bg-black p-4 overflow-hidden flex flex-col">
                    <h2 className="text-[10px] text-neutral-600 mb-4 tracking-[0.2em] uppercase border-b border-neutral-800 pb-2">
                        Control
                    </h2>

                    {/* Navigation Links */}
                    <nav className="flex flex-col gap-2 text-sm">
                        <button
                            onClick={() => setActiveView("subject")}
                            className={`text-left transition-colors py-1 border-l-2 pl-2 ${activeView === "subject"
                                ? "text-blue-500 border-blue-500"
                                : "text-neutral-600 hover:text-blue-500 border-transparent hover:border-blue-500"
                                }`}
                        >
                            [{isFullyReady ? displayAlias : "SYNCING..."}]
                        </button>
                        <button
                            onClick={() => setActiveView("global-intel")}
                            className={`text-left transition-colors py-1 border-l-2 pl-2 ${activeView === "global-intel"
                                ? "text-blue-500 border-blue-500"
                                : "text-neutral-600 hover:text-blue-500 border-transparent hover:border-blue-500"
                                }`}
                        >
                            GLOBAL INTELLIGENCE
                        </button>
                        <button
                            onClick={() => setActiveView("geo-tracker")}
                            className={`text-left transition-colors py-1 border-l-2 pl-2 ${activeView === "geo-tracker"
                                ? "text-blue-500 border-blue-500"
                                : "text-neutral-600 hover:text-blue-500 border-transparent hover:border-blue-500"
                                }`}
                        >
                            GEO TRACKER
                        </button>
                        <button
                            onClick={() => setActiveView("contact")}
                            className={`text-left transition-colors py-1 border-l-2 pl-2 ${activeView === "contact"
                                ? "text-blue-500 border-blue-500"
                                : "text-neutral-600 hover:text-blue-500 border-transparent hover:border-blue-500"
                                }`}
                        >
                            CONTACT DEV
                        </button>
                        <button
                            onClick={() => setActiveView("wall-of-infamy")}
                            className={`text-left transition-colors py-1 border-l-2 pl-2 ${activeView === "wall-of-infamy"
                                ? "text-red-500 border-red-500"
                                : "text-red-900 hover:text-red-500 border-transparent hover:border-red-500"
                                }`}
                        >
                            WALL OF INFAMY
                        </button>
                        {/* Debug Console — appears after Rolling Thunder endpoint discovery */}
                        {state.eventLog.some(log => log.includes("ROLLING_THUNDER")) && (
                            <button
                                onClick={() => setActiveView("debug-console")}
                                className={`text-left transition-colors py-1 border-l-2 pl-2 ${activeView === "debug-console"
                                    ? "text-amber-400 border-amber-400"
                                    : "text-amber-700 hover:text-amber-400 border-transparent hover:border-amber-400 animate-pulse"
                                    }`}
                            >
                                LAUNCH DEBUG CONSOLE
                            </button>
                        )}
                        <button
                            onClick={() => setActiveView("forensic-wipe")}
                            className={`text-left transition-colors py-1 border-l-2 pl-2 ${activeView === "forensic-wipe"
                                ? "text-red-500 border-red-500"
                                : "text-red-900 hover:text-red-500 border-transparent hover:border-red-500"
                                }`}
                        >
                            FORENSIC WIPE
                        </button>
                    </nav>

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
                                className={`h-full transition-all duration-500 ${getRiskBarColor()}`}
                                style={{ width: `${state.currentRiskScore}%` }}
                            />
                        </div>
                    </div>
                </section>

                {/* CENTER: Dynamic Content based on activeView */}
                <section className={`bg-black p-4 flex flex-col ${activeView === "global-intel" || activeView === "wall-of-infamy" ? "overflow-y-auto cyber-scrollbar" : "overflow-hidden"}`}>
                    {activeView === "geo-tracker" ? (
                        <GeoTrackerPanel />
                    ) : activeView === "global-intel" ? (
                        <GlobalIntelPanel />
                    ) : activeView === "forensic-wipe" ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
                            <AlertTriangle size={48} className="text-red-500 mb-6 animate-pulse" />
                            <h2 className="text-xl font-bold text-red-500 mb-2 tracking-widest">
                                FORENSIC WIPE PROTOCOL
                            </h2>
                            <p className="text-neutral-500 text-sm mb-6 max-w-md leading-relaxed">
                                A true ghost leaves no trace. This protocol will permanently purge
                                your digital footprint from The Watchtower&apos;s memory:
                            </p>
                            <div className="text-left text-xs text-neutral-600 space-y-2 mb-8 max-w-sm">
                                <p className="flex items-center gap-2">
                                    <span className="text-red-500">&#x2022;</span> Identity node (alias, CID, fingerprint)
                                </p>
                                <p className="flex items-center gap-2">
                                    <span className="text-red-500">&#x2022;</span> Complete security event history
                                </p>
                                <p className="flex items-center gap-2">
                                    <span className="text-red-500">&#x2022;</span> Risk assessment and classification
                                </p>
                                <p className="flex items-center gap-2">
                                    <span className="text-red-500">&#x2022;</span> Session telemetry and behavioral data
                                </p>
                            </div>
                            <p className="text-neutral-700 text-xs mb-8 italic max-w-sm">
                                This action is irreversible. Once executed, you will be redirected
                                to the perimeter gate as an unknown entity.
                            </p>
                            <button
                                onClick={handleForensicWipe}
                                disabled={isWiping}
                                className="px-6 py-3 bg-red-500/10 border border-red-500 text-red-500 rounded font-bold tracking-widest text-sm hover:bg-red-500/20 transition-all hover:shadow-[0_0_20px_rgba(239,68,68,0.3)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isWiping ? "WIPING..." : "[ EXECUTE FORENSIC WIPE ]"}
                            </button>
                            <p className="text-neutral-800 text-[10px] mt-6 italic">
                                &quot;The best intrusion is the one that was never detected.&quot;
                            </p>
                        </div>
                    ) : activeView === "contact" ? (
                        <ContactFormPanel
                            integrityToken={integrityToken || ""}
                        />
                    ) : activeView === "wall-of-infamy" ? (
                        <WallOfInfamyPanel
                            fingerprint={identity.fingerprint || ""}
                        />
                    ) : activeView === "debug-console" ? (
                        <DebugConsolePanel
                            fingerprint={identity.fingerprint || ""}
                            cid={identity.cid || state.cid || "CID-UNKNOWN"}
                            alias={identity.alias}
                        />
                    ) : (
                        <>
                            <h2 className="text-[10px] text-neutral-600 mb-4 tracking-[0.2em] uppercase border-b border-neutral-800 pb-2">
                                Subject Dossier
                            </h2>

                            {/* Identity Card */}
                            <div className="border border-neutral-800/60 rounded-lg p-5 bg-neutral-950/50 mb-4 shrink-0">
                                <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-800/40">
                                    <div className="flex items-center gap-2">
                                        <Shield size={14} className={state.currentRiskScore > 50 ? "text-red-500" : "text-blue-500"} />
                                        <span className="text-[10px] text-neutral-500 uppercase tracking-[0.2em]">Identity Node</span>
                                    </div>
                                    <span className="text-[10px] text-blue-500 animate-pulse flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                        LIVE
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-0">
                                    {/* Left: Core Identity */}
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-[90px_1fr] items-baseline gap-2">
                                            <span className="text-[10px] uppercase text-neutral-600 tracking-wider">Alias</span>
                                            {isEditingAlias ? (
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-1">
                                                        <input
                                                            ref={aliasInputRef}
                                                            type="text"
                                                            value={aliasInput}
                                                            onChange={(e) => setAliasInput(e.target.value)}
                                                            onKeyDown={handleAliasKeyDown}
                                                            onBlur={handleAliasSave}
                                                            maxLength={24}
                                                            className="bg-neutral-900 border border-blue-500/50 text-white font-bold text-lg px-2 py-0 rounded focus:outline-none focus:border-blue-500 w-full tracking-tight"
                                                        />
                                                    </div>
                                                    {aliasError && (
                                                        <span className="text-red-500 text-[9px]">{aliasError}</span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span
                                                    onClick={handleAliasEdit}
                                                    className="text-lg font-bold text-white tracking-tight truncate cursor-pointer hover:text-blue-400 transition-colors"
                                                    title="Click to change alias"
                                                >
                                                    {isFullyReady ? displayAlias : "---"}
                                                </span>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-[90px_1fr] items-baseline gap-2">
                                            <span className="text-[10px] uppercase text-neutral-600 tracking-wider">Criminal ID</span>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-sm ${state.currentRiskScore >= CID_REVEAL_THRESHOLD ? "text-white" : "text-neutral-600 animate-pulse"}`}>
                                                    {isFullyReady ? displayCID : "---"}
                                                </span>
                                                {state.currentRiskScore >= 60 && (
                                                    <span className="text-[9px] text-red-500 border border-red-500/50 px-1 rounded">
                                                        FLAGGED
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-[90px_1fr] items-baseline gap-2">
                                            <span className="text-[10px] uppercase text-neutral-600 tracking-wider">Node ID</span>
                                            <span className="text-[11px] text-neutral-500 truncate">
                                                {identity.fingerprint || "UNKNOWN_NODE"}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-[90px_1fr] items-center gap-2">
                                            <span className="text-[10px] uppercase text-neutral-600 tracking-wider">Net Address</span>
                                            <span className="text-sm text-blue-500 flex items-center gap-1.5">
                                                <Network size={11} /> {identity.ip || "unknown"}
                                            </span>
                                        </div>

                                        {/* Operation Milestones (context = real-time, props = initial) */}
                                        {(() => {
                                            const liveOps = state.operations;
                                            const effectiveOps = (liveOps.desertStorm || liveOps.overlord || liveOps.rollingThunder)
                                                ? liveOps
                                                : operations;
                                            if (!effectiveOps) return null;
                                            return (
                                                <div className="mt-3 pt-3 border-t border-neutral-800/30 space-y-1.5">
                                                    <span className="text-[10px] uppercase text-neutral-600 tracking-wider">Operations</span>
                                                    {[
                                                        { label: "DESERT STORM", active: effectiveOps.desertStorm },
                                                        { label: "OVERLORD", active: effectiveOps.overlord },
                                                        { label: "ROLLING THUNDER", active: effectiveOps.rollingThunder },
                                                    ].map((op) => (
                                                        <div key={op.label} className="flex items-center justify-between text-[11px]">
                                                            <span className={op.active ? "text-green-400" : "text-neutral-700"}>
                                                                {op.label}
                                                            </span>
                                                            <span className={op.active
                                                                ? "text-green-400 font-bold tracking-wider"
                                                                : "text-neutral-700"
                                                            }>
                                                                {op.active ? "[COMPLETE]" : "[LOCKED]"}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            );
                                        })()}
                                    </div>

                                    {/* Right: Deep Scan + Status */}
                                    <div className="space-y-2.5 mt-3 lg:mt-0">
                                        <div className="grid grid-cols-[20px_80px_1fr] items-center text-sm border-b border-neutral-800/20 pb-2">
                                            <Monitor size={12} className="text-neutral-600" />
                                            <span className="text-neutral-600 text-[10px] uppercase tracking-wider">System</span>
                                            <span className="text-neutral-400 text-xs text-right">
                                                {deepScan ? deepScan.os : <span className="animate-pulse text-neutral-700">SCANNING</span>}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-[20px_80px_1fr] items-center text-sm border-b border-neutral-800/20 pb-2">
                                            <Globe size={12} className="text-neutral-600" />
                                            <span className="text-neutral-600 text-[10px] uppercase tracking-wider">Engine</span>
                                            <span className="text-neutral-400 text-xs text-right">
                                                {deepScan ? deepScan.browser : <span className="animate-pulse text-neutral-700">ANALYZING</span>}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-[20px_80px_1fr] items-center text-sm border-b border-neutral-800/20 pb-2">
                                            <Clock size={12} className="text-neutral-600" />
                                            <span className="text-neutral-600 text-[10px] uppercase tracking-wider">Timezone</span>
                                            <span className="text-neutral-400 text-xs text-right">
                                                {deepScan ? deepScan.timezone : <span className="animate-pulse text-neutral-700">LOCATING</span>}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-[20px_80px_1fr] items-center text-sm border-b border-neutral-800/20 pb-2">
                                            <Monitor size={12} className="text-neutral-600" />
                                            <span className="text-neutral-600 text-[10px] uppercase tracking-wider">Display</span>
                                            <span className="text-neutral-400 text-xs text-right">
                                                {deepScan ? deepScan.screen : <span className="animate-pulse text-neutral-700">MEASURING</span>}
                                            </span>
                                        </div>

                                        {statusRank && (
                                            <div className="grid grid-cols-[20px_80px_1fr] items-center text-sm pt-1">
                                                <Shield size={12} className={`${statusRank.iconColor} ${statusRank.animate}`} />
                                                <span className="text-neutral-600 text-[10px] uppercase tracking-wider">Status</span>
                                                <span className={`text-right font-bold tracking-widest text-xs ${statusRank.color} ${statusRank.animate}`}>
                                                    {statusRank.label}
                                                </span>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-[20px_80px_1fr] items-center text-sm pt-2 border-t border-neutral-800/30 mt-1">
                                            <span className="text-red-500 text-[10px] font-bold">#</span>
                                            <span className="text-neutral-600 text-[10px] uppercase tracking-wider">Techniques</span>
                                            <span className="text-right text-red-500 font-bold text-lg">
                                                {state.uniqueTechniqueCount}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Event Log */}
                            <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                                <div className="text-[10px] text-neutral-600 uppercase tracking-[0.2em] border-b border-neutral-800 pb-2 mb-3 shrink-0">
                                    Security Events
                                </div>
                                <div className="flex-1 overflow-y-auto text-xs space-y-1 pr-1">
                                    {state.eventLog.length > 0 ? (
                                        state.eventLog.map((log, idx) => {
                                            const isExternal = log.includes("DETECTED: [EXT_") || log.includes("DETECTED: [OVERLORD_") || log.includes("DETECTED: [ROLLING_THUNDER_");
                                            return (
                                                <p
                                                    key={idx}
                                                    className={`${idx === 0
                                                        ? (isExternal ? "text-red-500 font-bold animate-pulse" : "text-white")
                                                        : (isExternal ? "text-red-700" : "text-neutral-600")
                                                        } leading-relaxed`}
                                                >
                                                    {log}
                                                </p>
                                            );
                                        })
                                    ) : (
                                        <p className="text-neutral-700 italic">-- NO SIGNALS --</p>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </section>

                {/* RIGHT: Sentinel Uplink Chat */}
                <section className="bg-black p-4 overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between mb-4 border-b border-neutral-800 pb-2">
                        <h2 className="text-[10px] text-blue-500 tracking-[0.2em] uppercase animate-pulse flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                            Sentinel Uplink
                        </h2>
                    </div>

                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto pr-1 min-h-0">
                        <div className="flex flex-col gap-3 text-xs">
                            {chatMessages.map((msg, idx) => (
                                <div key={idx} className={msg.role === "user" ? "flex justify-end" : ""}>
                                    {msg.role === "sentinel" ? (
                                        <div>
                                            <span className="text-[9px] text-white uppercase tracking-widest">SENTINEL-02</span>
                                            <p className="text-neutral-300 leading-relaxed mt-1">{msg.content}</p>
                                        </div>
                                    ) : (
                                        <div className="max-w-[85%] w-fit">
                                            <div className="text-right">
                                                <span className="text-[9px] text-cyan-600 uppercase tracking-widest">YOU</span>
                                            </div>
                                            <p className="text-cyan-300/90 leading-relaxed mt-1 text-right">{msg.content}</p>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* Auto-trigger streaming from sensors */}
                            {!isStreaming && state.streamText && (
                                <div>
                                    <span className="text-[9px] text-white uppercase tracking-widest">SENTINEL-02</span>
                                    <p className="text-neutral-300 leading-relaxed mt-1">
                                        {state.streamText}
                                        <span className="inline-block w-1 h-3 bg-cyan-400 ml-0.5 animate-pulse">|</span>
                                    </p>
                                </div>
                            )}

                            {/* User chat streaming */}
                            {isStreaming && streamingText && (
                                <div>
                                    <span className="text-[9px] text-white uppercase tracking-widest">SENTINEL-02</span>
                                    <p className="text-neutral-300 leading-relaxed mt-1">
                                        {streamingText}
                                        <span className="inline-block w-1 h-3 bg-cyan-400 ml-0.5 animate-pulse">|</span>
                                    </p>
                                </div>
                            )}

                            {isStreaming && !streamingText && (
                                <div>
                                    <span className="text-[9px] text-white uppercase tracking-widest">SENTINEL-02</span>
                                    <p className="text-neutral-500 animate-pulse mt-1">Processing transmission...</p>
                                </div>
                            )}

                            {chatMessages.length === 0 && !isStreaming && (
                                <div className="flex-1 flex items-center justify-center py-8">
                                    <span className="italic text-neutral-700 text-xs">[AWAITING TRANSMISSION]</span>
                                </div>
                            )}

                            <div ref={chatEndRef} />
                        </div>
                    </div>

                    {/* Chat Input */}
                    <div className="border-t border-neutral-800 pt-3 mt-3 shrink-0">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                sendMessage();
                            }}
                            className="flex gap-2 items-center"
                        >
                            <input
                                ref={chatInputRef}
                                type="text"
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                placeholder={isStreaming ? "Transmitting..." : "Enter message..."}
                                disabled={isStreaming}
                                autoFocus
                                className="flex-1 bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-cyan-500/50 disabled:opacity-40"
                            />
                            <button
                                type="submit"
                                disabled={isStreaming || !chatInput.trim()}
                                className="p-2 text-cyan-500 hover:text-cyan-400 disabled:text-neutral-700 transition-colors"
                            >
                                <Send size={14} />
                            </button>
                        </form>
                    </div>
                </section>
            </main>
        </div>
    );
}
