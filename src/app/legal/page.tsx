import Link from "next/link";
import { ShieldAlert, Scale, Lock, Eye, AlertTriangle, ArrowLeft } from "lucide-react";

export default function LegalPage() {
    return (
        <main className="min-h-screen bg-black text-gray-300 font-mono p-6 md:p-12 selection:bg-red-900 selection:text-white">
            <div className="max-w-4xl mx-auto space-y-12">

                {/* Header */}
                <header className="space-y-4 border-b border-white/10 pb-8">
                    <Link href="/" className="inline-flex items-center gap-2 text-xs text-emerald-500 hover:text-emerald-400 mb-4 transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        RETURN TO TERMINAL
                    </Link>
                    <div className="flex items-center gap-3">
                        <ShieldAlert className="w-8 h-8 text-red-600" />
                        <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-red-400">
                            LEGAL COMPLIANCE & PROTOCOLS
                        </h1>
                    </div>
                    <p className="text-sm text-gray-500 uppercase tracking-widest pl-11">
                        System Status: <span className="text-red-500 font-bold">ARMED</span> — Monitoring Active
                    </p>
                </header>

                {/* Section 1: Research Purpose */}
                <section className="space-y-4 relative pl-8 border-l-2 border-emerald-900/30">
                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-black border-2 border-emerald-900 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-700" />
                    </div>
                    <div className="flex items-center gap-2 text-emerald-500 font-bold uppercase tracking-wider text-sm">
                        <Scale className="w-5 h-5" />
                        <h2>1. Research & Educational Purpose</h2>
                    </div>
                    <div className="prose prose-invert prose-sm max-w-none text-gray-400">
                        <p>
                            This infrastructure, designated as <strong>THE WATCHTOWER</strong>, operates strictly as a <strong>Cybersecurity Research Laboratory</strong>.
                        </p>
                        <p>
                            All &quot;active defense&quot; mechanisms deployed within this environment—including but not limited to honeypots, browser fingerprinting, and deception layers—are engineered for the sole purpose of analyzing adversarial behavior patterns and developing advanced threat intelligence heuristics.
                        </p>
                    </div>
                </section>

                {/* Section 2: Consent Banner */}
                <section className="space-y-4 relative pl-8 border-l-2 border-indigo-900/30">
                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-black border-2 border-indigo-900 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-700" />
                    </div>
                    <div className="flex items-center gap-2 text-indigo-500 font-bold uppercase tracking-wider text-sm">
                        <Eye className="w-5 h-5" />
                        <h2>2. Explicit Consent to Monitoring</h2>
                    </div>
                    <div className="bg-indigo-950/20 border border-indigo-900/50 p-6 rounded-sm">
                        <h3 className="text-indigo-400 font-bold text-xs uppercase mb-4 tracking-widest border-b border-indigo-900/30 pb-2">
                            Warning: Uncomplicated Access Prohibited
                        </h3>
                        <p className="mb-4 text-sm">
                            By connecting to this network node, you explicitly consent to the following surveillance protocols:
                        </p>
                        <ul className="space-y-2 text-sm">
                            <li className="flex gap-3">
                                <span className="text-indigo-500">01.</span>
                                <span><strong>Full Packet Capture:</strong> All traffic, including headers, payloads, and metadata, is logged and archived.</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="text-indigo-500">02.</span>
                                <span><strong>Behavioral Analysis:</strong> Session interactions are analyzed to generate usability and security risk scores.</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="text-indigo-500">03.</span>
                                <span><strong>Attribution & Fingerprinting:</strong> IP addresses and device signatures are collected for security auditing.</span>
                            </li>
                        </ul>
                    </div>
                </section>

                {/* Section 3: Liability */}
                <section className="space-y-4 relative pl-8 border-l-2 border-red-900/30">
                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-black border-2 border-red-900 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-700" />
                    </div>
                    <div className="flex items-center gap-2 text-red-500 font-bold uppercase tracking-wider text-sm">
                        <AlertTriangle className="w-5 h-5" />
                        <h2>3. Liability Disclaimer</h2>
                    </div>
                    <div className="prose prose-invert prose-sm max-w-none text-gray-400">
                        <p>
                            The maintainers of this repository assume <strong>NO LIABILITY</strong> for any consequences resulting from interactions with this system.
                            This includes, but is not limited to:
                        </p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Browser instability or freezing caused by heavy client-side JavaScript execution (e.g., honeypot loops).</li>
                            <li>Automatic blocklisting of IP addresses due to detected malicious activity or scanning patterns.</li>
                            <li>Psychological distress caused by &quot;Active Defense&quot; narratives, simulated system crashes, or psychological operations (PsyOps).</li>
                        </ul>
                    </div>
                </section>

                {/* Section 4: Privacy */}
                <section className="space-y-4 relative pl-8 border-l-2 border-gray-800">
                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-black border-2 border-gray-700 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-500" />
                    </div>
                    <div className="flex items-center gap-2 text-gray-400 font-bold uppercase tracking-wider text-sm">
                        <Lock className="w-5 h-5" />
                        <h2>4. Privacy & Data Handling</h2>
                    </div>
                    <div className="prose prose-invert prose-sm max-w-none text-gray-400">
                        <p>
                            While this system acts as a high-fidelity honeypot, we adhere to strict data minimization principles:
                        </p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Data is retained for <strong>security auditing and research purposes only</strong>.</li>
                            <li>Personally Identifiable Information (PII) is not targeted, except where voluntarily provided (e.g., contact forms) or where public IP attribution is required for defense validation.</li>
                        </ul>
                        <p className="text-xs text-gray-500 mt-4 italic">
                            *Unauthorized access attempts are logged and may be reported to relevant ISP abuse teams automaticall via Arcjet.*
                        </p>
                    </div>
                </section>

                {/* Footer */}
                <footer className="pt-12 border-t border-white/5 text-center">
                    <p className="text-xs text-gray-600 font-mono">
                        © {new Date().getFullYear()} SENTINEL-02. ALL RIGHTS RESERVED.
                    </p>
                </footer>
            </div>
        </main>
    );
}
