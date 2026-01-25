
import { headers } from "next/headers";
import { getOrCreateSession, getSession } from "@/lib/session";

export async function IdentityCard() {
    // 1. Get header set by middleware
    const headersList = await headers();
    const fingerprint = headersList.get("x-arcjet-fingerprint");

    if (!fingerprint || fingerprint === "unknown") {
        return (
            <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
                <p className="text-neutral-500">Identity: Unknown Node</p>
            </div>
        );
    }

    // 2. Fetch or Create Session (Self-Correction: middleware handles attack logging, 
    // but simple visits need a session too to be seen in the UI)
    const session = await getOrCreateSession(fingerprint);

    return (
        <div className="rounded-lg border border-blue-500/30 bg-blue-950/10 p-5 mt-8 max-w-xl mx-auto backdrop-blur-sm">
            <h3 className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-2">My Identity</h3>
            <div className="flex justify-between items-center">
                <div>
                    <p className="text-2xl font-mono font-bold text-white">{session.alias}</p>
                    <p className="text-xs text-neutral-400 font-mono mt-1">ID: {session.fingerprint.substring(0, 8)}...</p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-neutral-400 uppercase">Risk Score</p>
                    <p className={`text-3xl font-mono font-bold ${session.riskScore > 50 ? 'text-red-500' : session.riskScore > 20 ? 'text-yellow-500' : 'text-green-500'}`}>
                        {session.riskScore}
                    </p>
                </div>
            </div>
        </div>
    );
}
