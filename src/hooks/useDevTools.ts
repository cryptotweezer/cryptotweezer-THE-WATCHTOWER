"use client";

import { useEffect, useState } from "react";

export default function useDevTools() {
    const [isDevToolsOpen, setIsDevToolsOpen] = useState(false);

    useEffect(() => {
        // Method 1: Keyboard Shortcuts (Standard)
        const handleKeyDown = (e: KeyboardEvent) => {
            if (
                e.key === "F12" ||
                (e.ctrlKey && e.shiftKey && e.key === "I") ||
                (e.ctrlKey && e.shiftKey && e.key === "J") ||
                (e.ctrlKey && e.shiftKey && e.key === "C") ||
                (e.ctrlKey && e.key === "U")
            ) {
                setIsDevToolsOpen(true);
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        // Method 2: Robust Console Element (Console Diff)
        // Browsers evaluate IDs on objects differently when console is open vs closed.
        // let devtools = { isOpen: false, orientation: undefined };
        const threshold = 160;

        const emitEvent = (isOpen: boolean) => {
            if (isOpen) setIsDevToolsOpen(true);
        };

        // Old School Resize Check (Backup)
        const handleResize = () => {
            const widthThreshold = window.outerWidth - window.innerWidth > threshold;
            const heightThreshold = window.outerHeight - window.innerHeight > threshold;
            if (widthThreshold || heightThreshold) {
                emitEvent(true);
            }
        }

        window.addEventListener("resize", handleResize);

        // Advanced Interval Check (Debugger loop trick - very aggressive, keeping it simple for now to avoid React perf hits)
        // Instead, we trust the resize and keydown for now, as the "Debugger" trick can freeze the UI.

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    return isDevToolsOpen;
}
