"use client";

import { useState, useEffect, useRef } from "react";
import { useSentinel } from "@/contexts/SentinelContext";
import { postInfamyMessage, getInfamyMessages } from "@/app/actions";

interface InfamyEntry {
    id: string;
    alias: string;
    message: string;
    riskScore: number;
    createdAt: Date;
}

const INFAMY_THRESHOLD = 90;

export default function WallOfInfamyPanel({ fingerprint }: { fingerprint: string }) {
    const { state } = useSentinel();
    const [entries, setEntries] = useState<InfamyEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [isPosting, setIsPosting] = useState(false);
    const [error, setError] = useState("");
    const [hasPosted, setHasPosted] = useState(false);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const canPost = state.currentRiskScore >= INFAMY_THRESHOLD && !hasPosted;

    useEffect(() => {
        (async () => {
            const msgs = await getInfamyMessages();
            setEntries(msgs);
            setIsLoading(false);
            // Check if current user already posted
            if (msgs.some(m => m.fingerprint === fingerprint)) {
                setHasPosted(true);
            }
        })();
    }, [fingerprint]);

    const handlePost = async () => {
        if (!canPost || isPosting) return;
        setIsPosting(true);
        setError("");

        const result = await postInfamyMessage(fingerprint, message);
        if (result.success) {
            setHasPosted(true);
            setMessage("");
            // Refresh the wall
            const msgs = await getInfamyMessages();
            setEntries(msgs);
        } else {
            setError(result.error || "Failed to post");
        }
        setIsPosting(false);
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="border-b border-red-500/20 pb-3 mb-4 shrink-0">
                <h2 className="text-[10px] text-red-500 tracking-[0.2em] uppercase flex items-center gap-2">
                    <span className="text-red-500 animate-pulse">&#9760;</span>
                    Wall of Infamy
                </h2>
                <p className="text-neutral-700 text-[10px] mt-1 font-mono">
                    Permanent records of those who reached {INFAMY_THRESHOLD}% threat level. These messages survive forensic wipes.
                </p>
            </div>

            {/* Post Form — only visible if user qualifies */}
            {state.currentRiskScore >= INFAMY_THRESHOLD && !hasPosted && (
                <div className="border border-red-500/30 rounded-lg p-4 mb-4 shrink-0 bg-red-500/5">
                    <div className="text-[10px] text-red-400 uppercase tracking-wider mb-2 font-mono">
                        &#9888; You have earned the right to leave your mark
                    </div>
                    <textarea
                        ref={inputRef}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        maxLength={280}
                        placeholder="Leave your message for eternity..."
                        rows={3}
                        className="w-full bg-neutral-950 border border-neutral-800 text-neutral-300 font-mono text-xs px-3 py-2 rounded focus:border-red-500/50 focus:outline-none transition-colors resize-none placeholder:text-neutral-800"
                    />
                    <div className="flex items-center justify-between mt-2">
                        <span className="text-neutral-700 text-[9px] font-mono">
                            {message.length}/280
                        </span>
                        <div className="flex items-center gap-2">
                            {error && <span className="text-red-500 text-[10px]">{error}</span>}
                            <button
                                onClick={handlePost}
                                disabled={isPosting || message.trim().length === 0}
                                className="px-4 py-1.5 bg-red-500/10 border border-red-500/40 text-red-500 font-mono text-[10px] tracking-widest uppercase rounded hover:bg-red-500/20 hover:border-red-500/60 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {isPosting ? "ENGRAVING..." : "[ ENGRAVE ]"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {hasPosted && (
                <div className="border border-green-500/20 rounded-lg p-3 mb-4 shrink-0 bg-green-500/5 text-center">
                    <span className="text-green-500 text-[10px] font-mono tracking-wider">
                        &#10003; YOUR MARK HAS BEEN ENGRAVED PERMANENTLY
                    </span>
                </div>
            )}

            {state.currentRiskScore < INFAMY_THRESHOLD && !hasPosted && (
                <div className="border border-neutral-800/40 rounded-lg p-3 mb-4 shrink-0 text-center">
                    <span className="text-neutral-600 text-[10px] font-mono tracking-wider">
                        &#9888; REACH {INFAMY_THRESHOLD}% THREAT LEVEL TO UNLOCK WALL ACCESS
                    </span>
                    <div className="mt-2 text-neutral-700 text-[10px] font-mono">
                        Current: {state.currentRiskScore}% / {INFAMY_THRESHOLD}%
                    </div>
                </div>
            )}

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto pr-1">
                {isLoading ? (
                    <div className="flex items-center justify-center h-32">
                        <span className="text-neutral-600 text-xs font-mono animate-pulse">LOADING RECORDS...</span>
                    </div>
                ) : entries.length === 0 ? (
                    <div className="flex items-center justify-center h-32">
                        <span className="text-neutral-700 text-xs font-mono italic">-- NO ENTRIES YET --</span>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {entries.map((entry) => (
                            <div
                                key={entry.id}
                                className="border border-neutral-800/40 rounded-lg p-3 bg-neutral-950/50 hover:border-red-500/20 transition-colors"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-red-500 text-[10px]">&#9760;</span>
                                        <span className="text-white font-bold text-xs tracking-tight">
                                            {entry.alias}
                                        </span>
                                        <span className="text-red-500/60 text-[9px] border border-red-500/20 px-1 rounded">
                                            {entry.riskScore}%
                                        </span>
                                    </div>
                                    <span className="text-neutral-700 text-[9px] font-mono">
                                        {new Date(entry.createdAt).toLocaleDateString("en-US", {
                                            year: "numeric",
                                            month: "short",
                                            day: "numeric",
                                        })}
                                    </span>
                                </div>
                                <p className="text-neutral-400 text-xs leading-relaxed font-mono">
                                    {entry.message}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
