
"use client";

import { useState, useEffect } from "react";

export default function useStableIdentity(serverFingerprint: string | null) {
    const [stableId, setStableId] = useState<string | null>(null);

    useEffect(() => {
        // Hydration Guard: Only run on client
        if (typeof window === "undefined") return;

        // 1. Check LocalStorage (The Anchor)
        const storedId = localStorage.getItem("sentinel_id");

        if (storedId) {
            setStableId(storedId);
            return;
        }

        // 2. If Server provided a valid ID, use it and anchor it
        if (serverFingerprint && serverFingerprint !== "unknown") {
            localStorage.setItem("sentinel_id", serverFingerprint);
            setStableId(serverFingerprint);
            return;
        }

        // 3. Generate New Persistent ID (The Ghost)
        const newId = "node_" + Math.random().toString(36).slice(2, 10);
        localStorage.setItem("sentinel_id", newId);
        setStableId(newId);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run Once on Mount to Lock Identity

    return stableId;
}
