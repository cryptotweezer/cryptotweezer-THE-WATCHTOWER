"use client";

import { useState } from "react";
import { ShieldCheck } from "lucide-react";

interface GatekeeperProps {
    onAccess: (granted: boolean) => void;
}

export default function Gatekeeper({ onAccess }: GatekeeperProps) {
    const [isUnlocking, setIsUnlocking] = useState(false);

    const handleHandshake = async () => {
        setIsUnlocking(true);

        // V33: Real Persistence
        // We get the fingerprint from localStorage if available, or generate a temporary one if needed by the parent.
        // But Gatekeeper is inside HomeTerminal usually, effectively blocking access.
        // We need the fingerprint passed or available. 
        // Ideally the parent (HomeTerminal) handles the identity, but Gatekeeper blocks the UI.

        // For now, we will assume the client-side identity generation will happen/sync.
        // Actually, we can just trigger the success callback which will trigger the Manager's init logic, 
        // BUT the requirement is: "Al cargar el componente, debe persistirse un registro real en Neon..."
        // The event says "The initial event... must stop being a visual simulation."

        // Since we don't have the fingerprint prop here easily without refactoring parents, 
        // we'll rely on the Sentinel Manager (which runs AFTER access is granted) to do the heavy lifting logic?
        // NO, the requirement says "Al cargar el componente" (When loading the component? Or when Handshaking?)
        // "El evento inicial de System Handshake... debe persistirse... que vincule la sesión".
        // UseSentinelManager does "triggerSentinel('System Initialization', TECHNIQUES.HANDSHAKE)" on mount if inactive.

        // Let's modify this to just visual unlock + let the Manager handle the Logic? 
        // The Prompt says: "The initial System Handshake event must stop being a visual simulation. Upon loading the component, a real record must be persisted..."

        // If we move the logic to `useSentinelManager` effectively, that covers it.
        // But Gatekeeper is the "Button".

        // Let's use the onAccess callback to signal "User clicked start". 
        // The Manager handles the actual DB call via `triggerSentinel` -> `api/sentinel`.
        // Wait, the new plan says: "Create Server Action... Update Gatekeeper to use it."

        // We need the fingerprint. 
        // Let's grab it from localStorage provided by useStableIdentity mechanism if possible, 
        // or let the parent pass it.
        // But Gatekeeper is simple.

        // Plan B: We trigger `onAccess(true)` and ensure `useSentinelManager` calls the API (which writes to DB).
        // The current `useSentinelManager` ALREADY calls `triggerSentinel` which calls `/api/sentinel` which writes to DB.
        // Is that enough? "Must stop being a visual simulation".
        // Maybe the user implies the *Gatekeeper* interaction itself was just visual.
        // If I make `Gatekeeper` call the server action, I need the `fingerprint`.

        // Let's grab the fingerprint from localStorage "sentinel_fingerprint" which is what `useStableIdentity` uses.
        const storedFingerprint = localStorage.getItem("sentinel_fingerprint");
        // const storedAlias = localStorage.getItem("sentinel_alias") || "Unknown Initiate"; 
        // We now let the server decide the alias/cid.

        if (storedFingerprint) {
            try {
                // Dynamic import to avoid server-action-in-client issues if not handled by framework well? 
                // No, standard import works in Next.js 14 client components if generic.
                const { performHandshake } = await import("./actions");
                const result = await performHandshake(storedFingerprint);

                if (result.success && result.alias && result.cid) {
                    localStorage.setItem("sentinel_alias", result.alias);
                    localStorage.setItem("sentinel_cid", result.cid);
                }
            } catch (e) {
                console.error("Handshake DB Error", e);
            }
        }

        onAccess(true);
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
                        disabled={isUnlocking}
                    >
                        <span className="relative z-10">
                            {isUnlocking ? "ESTABLISHING LINK..." : "[ INITIALIZE HANDSHAKE ]"}
                        </span>
                        {/* Scanline/Shine effect */}
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
