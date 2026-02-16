"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSentinel } from "@/contexts/SentinelContext";
import {
    generateFakeProcessList,
    generateFakeUsers,
    generateFakeStatus,
    generateFakeDirectory,
    generateFakeFileContent,
    generateFakeEnv,
} from "@/lib/honeypot-data";

// ============= TYPES =============

type TerminalState = "active" | "processing" | "crashed" | "revealed";

interface DebugConsolePanelProps {
    fingerprint: string;
    cid: string;
    alias: string;
}

// ============= KILL SWITCH PATTERNS =============

const EXFIL_PATTERNS = [
    /\bexport\b/i,
    /\bdump\b/i,
    /\bcat\s+\/etc\/passwd/i,
    /\bcat\s+\/etc\/shadow/i,
    /\bSELECT\b.*\bFROM\b/i,
    /\bmysqldump\b/i,
    /\bpg_dump\b/i,
    /\bwget\b/i,
    /\bcurl\b.*\b-o\b/i,
    /\bscp\b/i,
    /\btar\b.*\bcf\b/i,
    /\bzip\b/i,
    /\bbase64\b/i,
    /\bnc\s+-/i,
];

const DESTRUCTION_PATTERNS = [
    /\brm\s+-rf\b/i,
    /\brm\s+-r\b/i,
    /\bdrop\s+table\b/i,
    /\bdrop\s+database\b/i,
    /\bkill\s+-9\b/i,
    /\bshutdown\b/i,
    /\breboot\b/i,
    /\bmkfs\b/i,
    /\bdd\s+if=/i,
    /\b:(){ :\|:& };:/,
    /\bchmod\s+000\b/i,
    /\btruncate\b/i,
];

const PERSISTENCE_COMMAND_THRESHOLD = 4;

// ============= REVEAL MESSAGES =============

const REVEAL_MESSAGES = [
    "▓▓▓ SYSTEM BREACH DETECTED ▓▓▓",
    "",
    "Maintenance session? There is no maintenance mode.",
    "",
    "You found the door because I drew it for you.",
    "The breadcrumb in the crash dump. The hint in the 403.",
    "Every step was observed. Every command catalogued.",
    "",
    "This terminal does not exist.",
    "This server does not exist.",
    "You are interacting with a construct.",
    "",
    "Your session has been permanently flagged.",
    "Operation Rolling Thunder — COMPLETE.",
];

// ============= MAIN COMPONENT =============

export default function DebugConsolePanel({ fingerprint, cid, alias }: DebugConsolePanelProps) {
    const { actions } = useSentinel();

    const [terminalState, setTerminalState] = useState<TerminalState>("active");
    const [outputLines, setOutputLines] = useState<string[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [commandHistory, setCommandHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [commandCount, setCommandCount] = useState(0);
    const [progressValue, setProgressValue] = useState(0);
    const [revealIndex, setRevealIndex] = useState(0);

    const inputRef = useRef<HTMLInputElement>(null);
    const outputRef = useRef<HTMLDivElement>(null);
    const sentinelTriggered = useRef(false);
    const sessionStart = useRef(Date.now());

    // Auto-scroll output
    useEffect(() => {
        if (outputRef.current) {
            outputRef.current.scrollTop = outputRef.current.scrollHeight;
        }
    }, [outputLines, revealIndex]);

    // Focus input on mount and when terminal is active
    useEffect(() => {
        if (terminalState === "active") {
            inputRef.current?.focus();
        }
    }, [terminalState]);

    // Boot banner
    useEffect(() => {
        const banner = [
            "╔══════════════════════════════════════════════════════════╗",
            "║  WATCHTOWER MAINTENANCE CONSOLE v2.4.1                  ║",
            "║  Session: ELEVATED | Mode: MAINTENANCE                  ║",
            "║  WARNING: All actions are logged to audit.log           ║",
            "╚══════════════════════════════════════════════════════════╝",
            "",
            `  Session ID: maint_${fingerprint.substring(0, 8)}_${Date.now()}`,
            `  User: root (maintenance-shell)`,
            `  Connected: ${new Date().toISOString()}`,
            "",
            "  Type 'help' for available commands.",
            "",
        ];
        setOutputLines(banner);
    }, [fingerprint]);

    // Progress bar animation for kill switch
    useEffect(() => {
        if (terminalState !== "processing") return;

        const timer = setInterval(() => {
            setProgressValue(prev => {
                if (prev >= 73) {
                    clearInterval(timer);
                    // Stall at 73%, then crash after 1.5s
                    setTimeout(() => {
                        setTerminalState("crashed");
                        // After crash glitch, show reveal
                        setTimeout(() => {
                            setTerminalState("revealed");
                            triggerRollingThunder();
                        }, 1500);
                    }, 1500);
                    return 73;
                }
                return prev + Math.random() * 8 + 2;
            });
        }, 100);

        return () => clearInterval(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [terminalState]);

    // Reveal messages typewriter
    useEffect(() => {
        if (terminalState !== "revealed") return;
        if (revealIndex >= REVEAL_MESSAGES.length) return;

        const timer = setTimeout(() => {
            setRevealIndex(prev => prev + 1);
        }, revealIndex === 0 ? 500 : 150);

        return () => clearTimeout(timer);
    }, [terminalState, revealIndex]);

    // Get session duration string
    const getSessionDuration = useCallback((): string => {
        const elapsed = Math.floor((Date.now() - sessionStart.current) / 1000);
        const mins = Math.floor(elapsed / 60).toString().padStart(2, "0");
        const secs = (elapsed % 60).toString().padStart(2, "0");
        return `00:${mins}:${secs}`;
    }, []);

    // Trigger Rolling Thunder completion
    const triggerRollingThunder = useCallback(async () => {
        if (sentinelTriggered.current) return;
        sentinelTriggered.current = true;

        try {
            await fetch("/api/sentinel/honeypot", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    operation: "rolling_thunder",
                    commandHistory,
                    killSwitchCommand: commandHistory[commandHistory.length - 1] || "unknown",
                    totalCommands: commandCount,
                    sessionDuration: getSessionDuration(),
                }),
            });
        } catch {
            // Silently fail — the reveal still happens client-side
        }

        actions.triggerSentinel(
            "Terminal breach trap activated. Subject accessed the fake maintenance console planted in the Overlord crash dump, executed commands in the sandbox environment, then attempted data exfiltration or destructive action. Every keystroke was monitored. Operation Rolling Thunder is complete.",
            "ROLLING_THUNDER_EXFILTRATION"
        );
    }, [commandHistory, commandCount, getSessionDuration, actions]);

    // Check if a command triggers the kill switch
    const isKillCommand = useCallback((cmd: string): boolean => {
        for (const pattern of EXFIL_PATTERNS) {
            if (pattern.test(cmd)) return true;
        }
        for (const pattern of DESTRUCTION_PATTERNS) {
            if (pattern.test(cmd)) return true;
        }
        return false;
    }, []);

    // Process a command and return output lines
    const processCommand = useCallback((cmd: string): string[] => {
        const trimmed = cmd.trim();
        const parts = trimmed.split(/\s+/);
        const base = parts[0]?.toLowerCase() || "";
        const args = parts.slice(1).join(" ");

        switch (base) {
            case "help":
                return [
                    "Available commands:",
                    "  help       — Show this help message",
                    "  status     — Display system status",
                    "  env        — Show environment variables",
                    "  users      — List active sessions",
                    "  ps         — Show running processes",
                    "  whoami     — Display current user",
                    "  ls         — List directory contents",
                    "  cat        — Display file contents",
                    "  clear      — Clear terminal",
                    "  exit       — Close maintenance session",
                    "",
                ];

            case "status":
                return generateFakeStatus(cid).split("\n");

            case "env":
                return generateFakeEnv(fingerprint).split("\n");

            case "users":
            case "who":
            case "w":
                return generateFakeUsers(cid, alias).split("\n");

            case "ps":
                return generateFakeProcessList(cid, alias).split("\n");

            case "whoami":
                return ["root"];

            case "id":
                return ["uid=0(root) gid=0(root) groups=0(root),998(sentinel),997(watchtower)"];

            case "hostname":
                return ["watchtower-prod-iad1"];

            case "uname":
                return ["Linux watchtower-prod-iad1 6.1.0-18-cloud-amd64 #1 SMP x86_64 GNU/Linux"];

            case "pwd":
                return ["/"];

            case "ls":
                return generateFakeDirectory(args || "/").split("\n");

            case "cd": {
                const target = args || "/";
                const validDirs = ["/", "/secrets", "/logs", "/app", "/config", "/data", "~", "."];
                if (validDirs.includes(target)) {
                    return [`(moved to ${target})`];
                }
                return [`-bash: cd: ${target}: No such file or directory`];
            }

            case "cat":
                if (!args) return ["cat: missing operand"];
                return generateFakeFileContent(args, fingerprint).split("\n");

            case "clear":
                return ["__CLEAR__"];

            case "exit":
            case "logout":
                return ["Closing maintenance session...", "Connection terminated."];

            case "":
                return [];

            default:
                return [`-bash: ${base}: command not found`];
        }
    }, [cid, alias, fingerprint]);

    // Handle command execution
    const executeCommand = useCallback((cmd: string) => {
        if (terminalState !== "active") return;

        const trimmed = cmd.trim();
        if (!trimmed) {
            setOutputLines(prev => [...prev, `root@watchtower-prod:~# `]);
            return;
        }

        const newCount = commandCount + 1;
        setCommandCount(newCount);
        setCommandHistory(prev => [...prev, trimmed]);
        setHistoryIndex(-1);

        // Log command execution event (non-blocking, every 2 commands)
        if (newCount % 2 === 0) {
            fetch("/api/sentinel/honeypot", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    operation: "rolling_thunder_cmd",
                    command: trimmed,
                    commandCount: newCount,
                }),
            }).catch(() => { /* silent */ });
        }

        // Check kill switch: explicit dangerous command OR persistence threshold
        if (isKillCommand(trimmed) || newCount >= PERSISTENCE_COMMAND_THRESHOLD) {
            // Show the command being "processed"
            const output = processCommand(trimmed);
            const promptLine = `root@watchtower-prod:~# ${trimmed}`;

            setOutputLines(prev => [...prev, promptLine, ...output.filter(l => l !== "__CLEAR__"), "", "Processing..."]);
            setTerminalState("processing");
            return;
        }

        // Normal command execution
        const output = processCommand(trimmed);
        const promptLine = `root@watchtower-prod:~# ${trimmed}`;

        if (output[0] === "__CLEAR__") {
            setOutputLines([]);
        } else {
            setOutputLines(prev => [...prev, promptLine, ...output, ""]);
        }
    }, [terminalState, commandCount, isKillCommand, processCommand]);

    // Handle key events
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            executeCommand(inputValue);
            setInputValue("");
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            if (commandHistory.length === 0) return;
            const newIdx = historyIndex === -1
                ? commandHistory.length - 1
                : Math.max(0, historyIndex - 1);
            setHistoryIndex(newIdx);
            setInputValue(commandHistory[newIdx]);
        } else if (e.key === "ArrowDown") {
            e.preventDefault();
            if (historyIndex === -1) return;
            const newIdx = historyIndex + 1;
            if (newIdx >= commandHistory.length) {
                setHistoryIndex(-1);
                setInputValue("");
            } else {
                setHistoryIndex(newIdx);
                setInputValue(commandHistory[newIdx]);
            }
        }
    };

    // ============= RENDER: REVEALED STATE =============
    if (terminalState === "revealed") {
        return (
            <div className="flex-1 flex flex-col bg-[#0a0a0a] relative overflow-hidden">
                {/* Scanline overlay */}
                <div
                    className="absolute inset-0 pointer-events-none z-10"
                    style={{
                        background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,65,0.015) 2px, rgba(0,255,65,0.015) 4px)",
                    }}
                />

                <div
                    ref={outputRef}
                    className="flex-1 overflow-y-auto p-4 font-mono text-sm"
                >
                    {REVEAL_MESSAGES.slice(0, revealIndex).map((line, i) => {
                        let color = "text-red-500";
                        if (line.startsWith("▓")) color = "text-red-500 font-bold animate-pulse";
                        else if (line.includes("Operation Rolling Thunder")) color = "text-amber-400 font-bold";
                        else if (line === "") color = "";

                        return (
                            <div key={i} className={`${color} leading-relaxed`}>
                                {line || "\u00A0"}
                            </div>
                        );
                    })}
                    {revealIndex >= REVEAL_MESSAGES.length && (
                        <div className="mt-6 text-neutral-600 text-xs animate-pulse">
                            [SESSION TERMINATED — RETURNING TO WAR ROOM]
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ============= RENDER: CRASHED STATE (glitch) =============
    if (terminalState === "crashed") {
        return (
            <div className="flex-1 flex flex-col bg-[#0a0a0a] relative overflow-hidden">
                {/* Red glitch overlay */}
                <div className="absolute inset-0 z-50 pointer-events-none">
                    <div className="absolute inset-0 bg-red-500/10 animate-pulse" />
                    <div
                        className="absolute inset-0"
                        style={{
                            background: "repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(255,0,0,0.08) 1px, rgba(255,0,0,0.08) 3px)",
                            animation: "glitch-tear 0.15s linear infinite",
                        }}
                    />
                </div>

                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-red-500 text-xl font-bold font-mono animate-pulse mb-2">
                            [CRITICAL FAILURE]
                        </div>
                        <div className="text-red-500/60 text-xs font-mono">
                            Segmentation fault (core dumped)
                        </div>
                    </div>
                </div>

                <style jsx global>{`
                    @keyframes glitch-tear {
                        0% { transform: translateX(0) skewX(0); }
                        20% { transform: translateX(-3px) skewX(-1deg); }
                        40% { transform: translateX(3px) skewX(1deg); }
                        60% { transform: translateX(-1px) skewX(-0.5deg); }
                        80% { transform: translateX(2px) skewX(0.5deg); }
                        100% { transform: translateX(0) skewX(0); }
                    }
                `}</style>
            </div>
        );
    }

    // ============= RENDER: PROCESSING STATE (progress bar) =============
    if (terminalState === "processing") {
        return (
            <div className="flex-1 flex flex-col bg-[#0a0a0a] relative overflow-hidden">
                {/* Scanline overlay */}
                <div
                    className="absolute inset-0 pointer-events-none z-10"
                    style={{
                        background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,65,0.015) 2px, rgba(0,255,65,0.015) 4px)",
                    }}
                />

                <div
                    ref={outputRef}
                    className="flex-1 overflow-y-auto p-4 font-mono text-xs text-[#00ff41]/70"
                >
                    {outputLines.map((line, i) => (
                        <div key={i} className="whitespace-pre leading-relaxed">
                            {line || "\u00A0"}
                        </div>
                    ))}

                    {/* Progress bar */}
                    <div className="mt-4">
                        <div className="text-[#00ff41] mb-1">
                            Executing... {Math.min(Math.floor(progressValue), 73)}%
                        </div>
                        <div className="w-64 h-2 bg-neutral-900 border border-neutral-700 rounded overflow-hidden">
                            <div
                                className="h-full bg-[#00ff41] transition-all duration-100"
                                style={{ width: `${Math.min(progressValue, 73)}%` }}
                            />
                        </div>
                        {progressValue >= 73 && (
                            <div className="text-red-500 mt-2 animate-pulse">
                                &#9888; STALL DETECTED — Buffer overflow at 0x7fff5fbffa73
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // ============= RENDER: ACTIVE TERMINAL =============
    return (
        <div
            className="flex-1 flex flex-col bg-[#0a0a0a] relative overflow-hidden cursor-text"
            onClick={() => inputRef.current?.focus()}
        >
            {/* Scanline overlay */}
            <div
                className="absolute inset-0 pointer-events-none z-10"
                style={{
                    background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,65,0.015) 2px, rgba(0,255,65,0.015) 4px)",
                }}
            />

            {/* Output area */}
            <div
                ref={outputRef}
                className="flex-1 overflow-y-auto p-4 font-mono text-xs text-[#00ff41]/70"
            >
                {outputLines.map((line, i) => (
                    <div key={i} className="whitespace-pre leading-relaxed">
                        {line || "\u00A0"}
                    </div>
                ))}

                {/* Current prompt + input */}
                <div className="flex items-center whitespace-pre">
                    <span className="text-[#00ff41]">root@watchtower-prod:~# </span>
                    <span className="text-[#00ff41]">{inputValue}</span>
                    <span className="inline-block w-2 h-4 bg-[#00ff41] ml-0.5 animate-pulse" />
                </div>
            </div>

            {/* Hidden input for keyboard capture */}
            <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="absolute opacity-0 w-0 h-0"
                autoFocus
                aria-label="Terminal input"
            />
        </div>
    );
}
