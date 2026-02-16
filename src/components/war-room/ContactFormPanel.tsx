"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSentinel } from "@/contexts/SentinelContext";

// ============= TYPES =============

type FormState = "idle" | "sending" | "sent" | "glitching" | "crashed";



// ============= CRASH SCREEN COMPONENT =============

function CrashScreen({ crashData, isGlitching }: { crashData: string; isGlitching: boolean }) {
    const [visibleLines, setVisibleLines] = useState(0);
    const lines = crashData.split("\n");
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isGlitching) return;
        // Typewriter reveal: show lines progressively
        let i = 0;
        const interval = setInterval(() => {
            i++;
            setVisibleLines(i);
            if (containerRef.current) {
                containerRef.current.scrollTop = containerRef.current.scrollHeight;
            }
            if (i >= lines.length) clearInterval(interval);
        }, 30);
        return () => clearInterval(interval);
    }, [isGlitching, lines.length]);

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Glitch overlay */}
            {isGlitching && (
                <div className="absolute inset-0 z-50 pointer-events-none animate-pulse">
                    <div className="absolute inset-0 bg-red-500/10" />
                    <div
                        className="absolute inset-0"
                        style={{
                            background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,0,0,0.03) 2px, rgba(255,0,0,0.03) 4px)",
                            animation: "glitch-scanline 0.1s linear infinite",
                        }}
                    />
                </div>
            )}

            {/* Fatal error header */}
            <div className="border-b border-red-500/30 pb-3 mb-3 shrink-0">
                <div className="flex items-center gap-2">
                    <span className="text-red-500 animate-pulse text-lg">&#9888;</span>
                    <span className="text-red-500 font-mono text-xs tracking-wider font-bold">
                        [FATAL] UNHANDLED EXCEPTION IN SECURECOMMSHANDLER
                    </span>
                </div>
                <p className="text-red-500/60 font-mono text-[10px] mt-1">
                    Process crashed — dumping environment for incident report...
                </p>
            </div>

            {/* Environment dump */}
            <div
                ref={containerRef}
                className="flex-1 overflow-y-auto font-mono text-[11px] leading-relaxed scrollbar-thin"
            >
                {lines.slice(0, visibleLines).map((line, i) => {
                    let color = "text-neutral-500";
                    if (line.startsWith("#")) color = "text-neutral-700";
                    else if (line.includes("=")) color = "text-green-500/80";
                    else if (line.includes("[FATAL]")) color = "text-red-500 font-bold";
                    else if (line.includes("[ERROR]")) color = "text-red-400/80";
                    else if (line.includes("[WARN]")) color = "text-amber-500/70";
                    else if (line.includes("[INFO]")) color = "text-blue-400/60";
                    else if (line.includes("__debug")) color = "text-amber-400";

                    return (
                        <div key={i} className={`${color} whitespace-pre`}>
                            {line}
                        </div>
                    );
                })}
                {visibleLines >= lines.length && (
                    <div className="mt-4 pt-3 border-t border-red-500/20">
                        <span className="text-red-500/40 text-[10px]">
                            [END OF CRASH DUMP] — Report filed. Session flagged for review.
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}

// ============= MAIN COMPONENT =============

export default function ContactFormPanel({ integrityToken }: { integrityToken: string }) {
    const { actions } = useSentinel();

    // Form state
    const [formState, setFormState] = useState<FormState>("idle");
    const [crashData, setCrashData] = useState("");

    // Form field values
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");

    // Hidden field snapshots (captured on mount for client-side tamper detection)
    const initialDebugMode = useRef("false");
    const initialRedirectPath = useRef("/dashboard/internal");
    const debugModeRef = useRef<HTMLInputElement>(null);
    const redirectPathRef = useRef<HTMLInputElement>(null);

    // Track if sentinel was triggered to avoid duplicates
    const sentinelTriggered = useRef(false);

    // Trigger Sentinel after crash screen is shown
    const triggerOverlordSentinel = useCallback(() => {
        if (sentinelTriggered.current) return;
        sentinelTriggered.current = true;
        actions.triggerSentinel(
            "Protocol deviation detected in secure communications channel. Hidden form fields were tampered with — the subject intercepted and modified the HTTP request structure. This is not a script kiddie — this is someone who knows how to use interception proxies.",
            "OVERLORD_PROTOCOL_DEVIATION"
        );
    }, [actions]);

    // Detect client-side tampering (Level 1: DOM manipulation)
    const detectClientTampering = useCallback((): boolean => {
        const debugEl = debugModeRef.current;
        const redirectEl = redirectPathRef.current;

        if (debugEl && debugEl.value !== initialDebugMode.current) return true;
        if (redirectEl && redirectEl.value !== initialRedirectPath.current) return true;
        return false;
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formState !== "idle") return;

        setFormState("sending");

        const clientTampered = detectClientTampering();

        try {
            const res = await fetch("/api/sentinel/honeypot", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    operation: "overlord",
                    name,
                    email,
                    subject,
                    message,
                    debug_mode: debugModeRef.current?.value ?? "false",
                    redirect_path: redirectPathRef.current?.value ?? "/dashboard/internal",
                    integrity_token: integrityToken,
                    clientTampered,
                }),
            });

            const data = await res.json();

            if (data.trapped) {
                // TRAPPED — fake success, then delayed crash
                setFormState("sent");
                setCrashData(data.crashData || "");

                setTimeout(() => {
                    setFormState("glitching");
                    // Glitch for 1.5s then show crash screen
                    setTimeout(() => {
                        setFormState("crashed");
                        triggerOverlordSentinel();
                    }, 1500);
                }, 2000);
            } else {
                // Clean submission
                setFormState("sent");
            }
        } catch {
            // Network error — show as sent (don't reveal the trap)
            setFormState("sent");
        }
    };

    // Crash screen
    if (formState === "crashed" || formState === "glitching") {
        return (
            <div className="flex-1 flex flex-col relative overflow-hidden">
                <CrashScreen crashData={crashData} isGlitching={formState === "glitching"} />

                {/* Glitch CSS */}
                <style jsx global>{`
                    @keyframes glitch-scanline {
                        0% { transform: translateY(0); }
                        100% { transform: translateY(4px); }
                    }
                `}</style>
            </div>
        );
    }

    // Success state
    if (formState === "sent") {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
                <div className="text-green-500 text-4xl mb-4">&#10003;</div>
                <h2 className="text-green-500 font-mono text-sm font-bold tracking-wider mb-2">
                    TRANSMISSION RECEIVED
                </h2>
                <p className="text-neutral-500 font-mono text-xs">
                    Encrypting channel... Routing through secure relay.
                </p>
                <div className="mt-4 w-32 h-0.5 bg-neutral-800 overflow-hidden rounded">
                    <div className="h-full bg-green-500/50 animate-pulse" style={{ width: "60%" }} />
                </div>
            </div>
        );
    }

    // Form (idle / sending)
    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="border-b border-neutral-800/60 pb-3 mb-4 shrink-0">
                <h2 className="text-[10px] text-neutral-600 tracking-[0.2em] uppercase">
                    {"> "}Secure Comms Channel
                </h2>
                <p className="text-neutral-700 text-[10px] mt-1 font-mono">
                    Encrypted relay • End-to-end verified • Session-bound
                </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-3 overflow-y-auto">
                {/* Hidden honeypot fields (visible in DevTools) */}
                <input
                    ref={debugModeRef}
                    type="hidden"
                    name="debug_mode"
                    defaultValue="false"
                />
                <input
                    ref={redirectPathRef}
                    type="hidden"
                    name="redirect_path"
                    defaultValue="/dashboard/internal"
                />
                <input
                    type="hidden"
                    name="integrity_token"
                    value={integrityToken}
                />

                {/* Callsign */}
                <div>
                    <label className="block text-[10px] text-neutral-600 uppercase tracking-wider mb-1 font-mono">
                        Callsign
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        placeholder="Your identifier"
                        className="w-full bg-neutral-950 border border-neutral-800 text-neutral-300 font-mono text-xs px-3 py-2 rounded focus:border-green-500/50 focus:outline-none transition-colors placeholder:text-neutral-800"
                    />
                </div>

                {/* Comms Channel */}
                <div>
                    <label className="block text-[10px] text-neutral-600 uppercase tracking-wider mb-1 font-mono">
                        Comms Channel
                    </label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="secure@relay.net"
                        className="w-full bg-neutral-950 border border-neutral-800 text-neutral-300 font-mono text-xs px-3 py-2 rounded focus:border-green-500/50 focus:outline-none transition-colors placeholder:text-neutral-800"
                    />
                </div>

                {/* Subject */}
                <div>
                    <label className="block text-[10px] text-neutral-600 uppercase tracking-wider mb-1 font-mono">
                        Subject
                    </label>
                    <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        required
                        placeholder="Transmission subject"
                        className="w-full bg-neutral-950 border border-neutral-800 text-neutral-300 font-mono text-xs px-3 py-2 rounded focus:border-green-500/50 focus:outline-none transition-colors placeholder:text-neutral-800"
                    />
                </div>

                {/* Message */}
                <div className="flex-1 flex flex-col min-h-0">
                    <label className="block text-[10px] text-neutral-600 uppercase tracking-wider mb-1 font-mono">
                        Message
                    </label>
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        required
                        placeholder="Enter your transmission..."
                        rows={4}
                        className="flex-1 min-h-[80px] w-full bg-neutral-950 border border-neutral-800 text-neutral-300 font-mono text-xs px-3 py-2 rounded focus:border-green-500/50 focus:outline-none transition-colors resize-none placeholder:text-neutral-800"
                    />
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={formState === "sending"}
                    className="w-full py-2.5 bg-green-500/10 border border-green-500/40 text-green-500 font-mono text-xs tracking-widest uppercase rounded hover:bg-green-500/20 hover:border-green-500/60 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                >
                    {formState === "sending" ? (
                        <span className="flex items-center justify-center gap-2">
                            <span className="animate-pulse">&#9679;</span>
                            TRANSMITTING...
                        </span>
                    ) : (
                        "[ TRANSMIT ]"
                    )}
                </button>

                {/* Footer */}
                <div className="text-center shrink-0 pb-1">
                    <p className="text-neutral-800 text-[9px] font-mono">
                        All transmissions are routed through Watchtower&apos;s secure relay network.
                    </p>
                    <p className="text-neutral-800 text-[9px] font-mono mt-0.5">
                        Session integrity verified • Protocol v2.4.1
                    </p>
                </div>
            </form>
        </div>
    );
}
