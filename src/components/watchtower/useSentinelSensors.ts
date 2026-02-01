import { useRef, useEffect } from "react";
import useDevTools from "@/hooks/useDevTools";

const TECHNIQUES = {
    INSPECTION: "FORENSIC_INSPECTION_ACTIVITY",
    SURFACE: "UI_SURFACE_ANALYSIS", // DB Safe
    EXFIL: "DATA_EXFILTRATION_ATTEMPT",
    CONTEXT: "CONTEXT_SWITCH_ANOMALY",
    FOCUS: "FOCUS_LOSS_ANOMALY"
};

interface SentinelSensorsProps {
    triggerSentinel: (prompt: string, eventType: string, skipRisk?: boolean) => void;
    isSystemReadyRef: React.MutableRefObject<boolean>;
    accessGranted: boolean;
}

export default function useSentinelSensors({ triggerSentinel, isSystemReadyRef, accessGranted }: SentinelSensorsProps) {
    // SENSORS
    const { isDevToolsOpen } = useDevTools();
    const isDevToolsOpenRef = useRef(isDevToolsOpen);

    // Internal State
    const lastFocusTimeRef = useRef<number>(0);
    const lastResizeTimeStamp = useRef(0);
    const lastBlurTimeStamp = useRef(0);
    const hasLoggedForensic = useRef(false);
    const isGuardStateRef = useRef(false);
    const blurTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Sync Ref
    useEffect(() => {
        isDevToolsOpenRef.current = isDevToolsOpen;
    }, [isDevToolsOpen]);

    // REACTOR (Forensic & Guard)
    useEffect(() => {
        if (isDevToolsOpen) {
            // OPEN DETECTED
            if (!hasLoggedForensic.current) {
                triggerSentinel("Security Alert: Debugger.", TECHNIQUES.INSPECTION);
                hasLoggedForensic.current = true;
            }
        } else {
            // CLOSED (Recovery)
            isGuardStateRef.current = true;
            lastFocusTimeRef.current = Date.now();
            hasLoggedForensic.current = false;
        }
    }, [isDevToolsOpen, triggerSentinel]);

    // DOM LISTENERS
    useEffect(() => {
        if (!accessGranted) return;

        // V30: Micro-Buffer for Blur to allow Resize to catch up (Cancellation Logic)


        const processCorrelatedEvent = (eventType: 'RESIZE' | 'BLUR', message: string, technique: string) => {
            const now = performance.now();
            let isCorrelated = false;

            // 1. Record Timestamp & Check Correlation
            if (eventType === 'RESIZE') {
                lastResizeTimeStamp.current = now;
                if (now - lastBlurTimeStamp.current < 200) isCorrelated = true;
            } else {
                lastBlurTimeStamp.current = now;
                if (now - lastResizeTimeStamp.current < 200) isCorrelated = true;
            }

            // 2. The Verdict (The Forensic Bypass)
            // If we detect a correlation, it's a Debugger Attack. 
            // We Log it immediately, BYPASSING the 'System Ready' gate.
            if (isCorrelated) {
                // CANCEL PENDING BLUR ALERT
                if (blurTimerRef.current) clearTimeout(blurTimerRef.current);

                if (!hasLoggedForensic.current) {
                    triggerSentinel("Security Alert: Debugger (Correlated).", TECHNIQUES.INSPECTION);
                    hasLoggedForensic.current = true;
                }
                return;
            }

            // 3. Standard Gate Check
            if (!isSystemReadyRef.current) return;

            // 4. No Match -> Immediate Execution
            if (isDevToolsOpenRef.current) return;

            triggerSentinel(message, technique);
        };

        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
            // 0. Silence Chamber
            if (Date.now() - lastFocusTimeRef.current < 300) return;
            // 1. Guard State Check
            if (isGuardStateRef.current) {
                isGuardStateRef.current = false;
                return;
            }
            // V28: Map to SURFACE per DB Schema Rules
            triggerSentinel("Security Alert: Context Menu.", TECHNIQUES.SURFACE);
        };

        const handleVisibilityChange = () => {
            if (isDevToolsOpenRef.current) return;
            if (document.hidden) {
                triggerSentinel("Searching for tutorials? Interesting...", TECHNIQUES.CONTEXT);
            }
        };

        const handleBlur = () => {
            // V30: Wait 50ms for a potential Resize event to cancel this
            if (blurTimerRef.current) clearTimeout(blurTimerRef.current);

            blurTimerRef.current = setTimeout(() => {
                processCorrelatedEvent('BLUR', "Multitasking? Focus on the terminal.", TECHNIQUES.FOCUS);
            }, 50);
        };

        const handleResize = () => {
            if (Date.now() - lastFocusTimeRef.current < 300) return;

            // V26 SHORTCUT: Physical Dimension Check
            const widthDiff = window.outerWidth - window.innerWidth;
            const heightDiff = window.outerHeight - window.innerHeight;

            if (widthDiff > 160 || heightDiff > 160) {
                triggerSentinel("Security Alert: Debugger (Phys-Check).", TECHNIQUES.INSPECTION);
                return;
            }

            processCorrelatedEvent('RESIZE', "Security Alert: Resize.", TECHNIQUES.SURFACE);
        };

        const handleClipboard = () => triggerSentinel("Security Alert: Exfiltration.", TECHNIQUES.EXFIL);

        const handleFocus = () => {
            lastFocusTimeRef.current = Date.now();
            isGuardStateRef.current = true;
        };

        const handleClick = (e: MouseEvent) => {
            if (isDevToolsOpenRef.current) return;
            if (Date.now() - lastFocusTimeRef.current < 300) return;
            if (isGuardStateRef.current) {
                isGuardStateRef.current = false;
                return;
            }
            if (e.button !== 0) return;
            // Left click ignored
        };

        // ATTACH LISTENERS
        window.addEventListener("contextmenu", handleContextMenu);
        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("blur", handleBlur);
        window.addEventListener("resize", handleResize);
        window.addEventListener("copy", handleClipboard);
        window.addEventListener("paste", handleClipboard);
        window.addEventListener("focus", handleFocus);
        window.addEventListener("click", handleClick);

        return () => {
            window.removeEventListener("contextmenu", handleContextMenu);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("blur", handleBlur);
            window.removeEventListener("resize", handleResize);
            window.removeEventListener("copy", handleClipboard);
            window.removeEventListener("paste", handleClipboard);
            window.removeEventListener("focus", handleFocus);
            window.removeEventListener("click", handleClick);
        };
    }, [triggerSentinel, isSystemReadyRef, accessGranted]); // Dependencies

}
