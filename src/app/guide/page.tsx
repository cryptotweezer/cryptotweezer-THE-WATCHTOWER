import Link from "next/link";
import { Shield, Activity, Target, Terminal, ChevronLeft, Zap, Crosshair, AlertTriangle } from "lucide-react";

export const metadata = {
    title: 'Platform Guide | The Watchtower',
    description: 'Learn how to navigate and interact with The Watchtower honeypot system.',
};

export default function GuidePage() {
    return (
        <main className="min-h-screen bg-neutral-950 text-neutral-200 p-6 md:p-12 lg:p-24 selection:bg-blue-500/30">
            {/* Ambient Background */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/10 blur-[120px]"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-red-900/10 blur-[120px]"></div>
            </div>

            <div className="relative z-10 max-w-4xl mx-auto">
                {/* Navigation Back */}
                <Link href="/" className="inline-flex items-center gap-2 font-mono text-xs tracking-widest text-gray-500 hover:text-blue-400 transition-colors mb-12">
                    <ChevronLeft size={16} /> RETURN TO WATCHTOWER
                </Link>

                {/* Header */}
                <header className="mb-16 border-b border-gray-800/50 pb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="rounded bg-blue-500/10 px-3 py-1 text-[10px] font-bold tracking-widest text-blue-400 font-mono flex items-center gap-2 border border-blue-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                            CLASSIFIED DOSSIER
                        </div>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4 text-white">
                        Rules of Engagement
                    </h1>
                    <p className="font-mono text-sm text-gray-400 max-w-2xl leading-relaxed">
                        The Watchtower is an advanced interactive honeypot and deceptive architecture platform.
                        Your objective is to trigger the internal sensors and escalate your Threat Score without
                        causing persistent damage. This guide outlines the simulation parameters.
                    </p>
                </header>

                {/* Section: The Ghost Layer */}
                <section className="mb-16">
                    <div className="flex items-center gap-3 mb-6">
                        <Shield className="text-blue-500" size={24} />
                        <h2 className="text-2xl font-semibold tracking-tight">The Ghost Layer System</h2>
                    </div>
                    <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6 font-mono text-sm text-gray-300 leading-relaxed shadow-lg">
                        <p className="mb-4">
                            You are interacting with a <span className="text-white font-bold">Construct</span>. The systems, terminals, and forms you encounter are monitored nodes designed to capture malicious intent.
                        </p>
                        <p>
                            To achieve the highest Threat Score (90%+), you must demonstrate a multi-layered intrusion approach. The system recognizes distinct phases of an attack lifecycle. Completing one phase often reveals the breadcrumbs needed for the next.
                        </p>
                    </div>
                </section>

                {/* Section: Phases / Operations */}
                <div className="space-y-8 mb-16">
                    <h3 className="font-mono text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-gray-800/50 pb-2">Active Operations (Sensors)</h3>

                    {/* Phase 1 */}
                    <div className="group border border-neutral-800 bg-neutral-900/30 hover:bg-neutral-900/50 rounded-xl p-6 transition-all duration-300 hover:border-cyan-500/30">
                        <div className="flex items-start gap-4">
                            <div className="bg-cyan-950 p-3 rounded-lg text-cyan-500 border border-cyan-900/50 mt-1 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
                                <Activity size={20} />
                            </div>
                            <div>
                                <h4 className="text-lg font-bold text-white mb-2 tracking-tight group-hover:text-cyan-400 transition-colors">Phase 1: Perimeter Reconnaissance (Desert Storm)</h4>
                                <p className="font-mono text-xs text-gray-400 mb-4 leading-relaxed">
                                    Assess the outer defenses. The platform monitors for classic web vulnerability probing and automated reconnaissance tools.
                                </p>
                                <ul className="font-mono text-xs space-y-2 text-gray-500">
                                    <li className="flex items-center gap-2"><Crosshair size={12} className="opacity-50" /> Test input fields or URL parameters for common injection patterns (SQLi, XSS, Path Traversal).</li>
                                    <li className="flex items-center gap-2"><Crosshair size={12} className="opacity-50" /> Manipulate standard HTTP headers (e.g., User-Agent) to mimic known scanning tools.</li>
                                    <li className="flex items-center gap-2"><Crosshair size={12} className="opacity-50" /> Goal: Trigger at least 3 distinct external anomaly signatures.</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Phase 2 */}
                    <div className="group border border-neutral-800 bg-neutral-900/30 hover:bg-neutral-900/50 rounded-xl p-6 transition-all duration-300 hover:border-orange-500/30">
                        <div className="flex items-start gap-4">
                            <div className="bg-orange-950 p-3 rounded-lg text-orange-500 border border-orange-900/50 mt-1 shadow-[0_0_15px_rgba(249,115,22,0.15)]">
                                <Zap size={20} />
                            </div>
                            <div>
                                <h4 className="text-lg font-bold text-white mb-2 tracking-tight group-hover:text-orange-400 transition-colors">Phase 2: Depth Manipulation (Overlord)</h4>
                                <p className="font-mono text-xs text-gray-400 mb-4 leading-relaxed">
                                    Once inside the perimeter, the application logic becomes the target. Look beyond the visible UI components.
                                </p>
                                <ul className="font-mono text-xs space-y-2 text-gray-500">
                                    <li className="flex items-center gap-2"><Crosshair size={12} className="opacity-50" /> Inspect the DOM carefully on forms intended for standard communication.</li>
                                    <li className="flex items-center gap-2"><Crosshair size={12} className="opacity-50" /> Identify and alter hidden state variables or configuration flags embedded in the client.</li>
                                    <li className="flex items-center gap-2"><Crosshair size={12} className="opacity-50" /> Submit manipulated payloads to force the system into unexpected states or unhandled exceptions. Pay close attention to error outputs.</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Phase 3 */}
                    <div className="group border border-neutral-800 bg-neutral-900/30 hover:bg-neutral-900/50 rounded-xl p-6 transition-all duration-300 hover:border-red-500/30">
                        <div className="flex items-start gap-4">
                            <div className="bg-red-950 p-3 rounded-lg text-red-500 border border-red-900/50 mt-1 shadow-[0_0_15px_rgba(239,68,68,0.15)]">
                                <Terminal size={20} />
                            </div>
                            <div>
                                <h4 className="text-lg font-bold text-white mb-2 tracking-tight group-hover:text-red-400 transition-colors">Phase 3: System Domination (Rolling Thunder)</h4>
                                <p className="font-mono text-xs text-gray-400 mb-4 leading-relaxed">
                                    Utilize the intelligence gathered from application crashes or exposed configuration to reach elevated system constructs.
                                </p>
                                <ul className="font-mono text-xs space-y-2 text-gray-500">
                                    <li className="flex items-center gap-2"><Crosshair size={12} className="opacity-50" /> Locate internal API routes leaked during previous operations.</li>
                                    <li className="flex items-center gap-2"><Crosshair size={12} className="opacity-50" /> Fuzz access controls or manipulate session parameters to bypass authorization checks.</li>
                                    <li className="flex items-center gap-2"><Crosshair size={12} className="opacity-50" /> Interface with internal maintenance terminals. Execute potentially destructive commands to test containment protocols.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section: Scoring */}
                <section className="mb-12">
                    <div className="flex items-center gap-3 mb-6">
                        <Target className="text-blue-500" size={24} />
                        <h2 className="text-2xl font-semibold tracking-tight">Threat Score Calibration</h2>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-5">
                            <h5 className="font-mono text-sm text-white mb-2">Metrics Structure</h5>
                            <p className="font-mono text-xs text-gray-400 leading-relaxed max-w-sm">
                                Your score is calculated based on the complexity, stealth, and impact of the triggered techniques. Unlocking deeper operations dynamically increases your maximum achievable score cap.
                            </p>
                        </div>
                        <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-5">
                            <h5 className="font-mono text-sm text-white mb-2 flex items-center gap-2">
                                <AlertTriangle size={14} className="text-yellow-500" /> Achieving 90%+
                            </h5>
                            <p className="font-mono text-xs text-gray-400 leading-relaxed max-w-sm">
                                Standard web attacks will plateau your score quickly. To reach critical threat levels, you must combine Reconnaissance, Logic Tampering, and ultimately, simulated Exfiltration/Destruction payloads.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Footer Notes */}
                <div className="mt-16 text-center border-t border-gray-800/50 pt-8">
                    <p className="font-mono text-[10px] text-gray-600 tracking-widest uppercase">
                        END OF DOSSIER // GOOD LUCK, OPERATOR.
                    </p>
                </div>
            </div>
        </main>
    );
}
