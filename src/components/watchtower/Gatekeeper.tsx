"use client";

import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { performHandshake } from "@/app/actions";

interface HandshakeIdentity {
    alias: string;
    fingerprint: string | null;
    cid?: string | null;
    riskScore: number;
    ip: string | null;
    sessionTechniques?: string[];
    uniqueTechniqueCount?: number;
}

interface GatekeeperProps {
    fingerprint: string | null;
    clerkId?: string | null;
    onAccess: (identity: HandshakeIdentity, logs: string[]) => void;
}

export default function Gatekeeper({ fingerprint, clerkId, onAccess }: GatekeeperProps) {
    const [isUnlocking, setIsUnlocking] = useState(false);

    const handleHandshake = async () => {
        if (!fingerprint) return;
        setIsUnlocking(true);

        try {
            // Real handshake — creates session in DB
            const result = await performHandshake(fingerprint, clerkId);
            // Brief visual delay then pass identity back
            setTimeout(() => {
                onAccess(result.identity, result.initialLogs);
            }, 1200);
        } catch (error) {
            console.error("[GATEKEEPER] Handshake failed:", error);
            setIsUnlocking(false);
        }
    };

    return (
        <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md transition-opacity duration-1000 ${isUnlocking ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
            <div className="max-w-2xl px-6 text-center w-full">
                {/* Icon & Headline */}
                <div className="mb-6 flex justify-center text-white">
                    <ShieldCheck size={64} className={`${isUnlocking ? "animate-ping" : "animate-pulse"}`} />
                </div>

                <h1 className="mb-4 font-mono text-3xl font-bold tracking-tighter text-white md:text-5xl">
                    ACCESS RESTRICTED:
                    <br />
                    PERIMETER MONITORING ACTIVE
                </h1>

                {/* Security Disclaimer */}
                <p className="mb-8 font-mono text-sm leading-relaxed text-gray-300 md:text-base">
                    By entering <span className="text-white font-bold">The Watchtower</span>, you acknowledge that your digital signature,
                    network metadata, and behavioral patterns will be analyzed in real-time.
                    This is a live security environment designed for defensive intelligence gathering.
                </p>

                {/* Action Button */}
                <div className="flex justify-center">
                    <button
                        className="group relative overflow-hidden rounded-md bg-blue-600 px-8 py-4 font-mono text-lg font-bold uppercase tracking-widest text-white transition-all hover:bg-blue-500 hover:shadow-[0_0_20px_rgba(37,99,235,0.7)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={handleHandshake}
                        disabled={isUnlocking || !fingerprint}
                    >
                        <span className="relative z-10">
                            {isUnlocking ? "ESTABLISHING LINK..." : "[ INITIALIZE HANDSHAKE ]"}
                        </span>
                        <div className="absolute inset-0 -translate-x-full bg-white/20 transition-transform duration-300 group-hover:translate-x-0" />
                    </button>
                </div>
            </div>

            {/* Footer / Status */}
            <div className="absolute bottom-8 font-mono text-xs text-gray-500">
                SYSTEM ID: GHOST-LAYER-ALPHA // SECURE CONNECTION REQUIRED
            </div>
        </div>
    );
}
