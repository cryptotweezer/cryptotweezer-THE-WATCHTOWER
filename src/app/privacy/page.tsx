import Link from "next/link";
import { Lock, Shuffle, Server, Shield, Database, ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
    return (
        <main className="min-h-screen bg-black text-gray-300 font-mono p-6 md:p-12 selection:bg-emerald-900 selection:text-white">
            <div className="max-w-4xl mx-auto space-y-12">

                {/* Header */}
                <header className="space-y-4 border-b border-white/10 pb-8">
                    <Link href="/" className="inline-flex items-center gap-2 text-xs text-red-500 hover:text-red-400 mb-4 transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        RETURN TO TERMINAL
                    </Link>
                    <div className="flex items-center gap-3">
                        <Lock className="w-8 h-8 text-emerald-600" />
                        <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-emerald-400">
                            PRIVACY & DATA GOVERNANCE
                        </h1>
                    </div>
                    <p className="text-sm text-gray-500 uppercase tracking-widest pl-11">
                        Effective Date: {new Date().toLocaleDateString()} — Protocol: <span className="text-emerald-500 font-bold">TRANSPARENT</span>
                    </p>
                </header>

                {/* Section 1: Data Collection */}
                <section className="space-y-4 relative pl-8 border-l-2 border-emerald-900/30">
                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-black border-2 border-emerald-900 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-700" />
                    </div>
                    <div className="flex items-center gap-2 text-emerald-500 font-bold uppercase tracking-wider text-sm">
                        <Server className="w-5 h-5" />
                        <h2>1. Data Collection Architecture</h2>
                    </div>
                    <div className="prose prose-invert prose-sm max-w-none text-gray-400">
                        <p>
                            Unlike traditional commercial applications, this system does not collect data for marketing or sales.
                            Data collection is exclusively focused on <strong>technical telemetry and security auditing</strong>.
                        </p>
                        <h3 className="text-emerald-400/80 text-xs uppercase tracking-wider mt-4 mb-2">Automatically Collected Metadata</h3>
                        <ul className="list-disc pl-5 space-y-1">
                            <li><strong>Network Signatures:</strong> IP Address, TCP/IP Headers, User-Agent strings.</li>
                            <li><strong>Client Telemetry:</strong> Screen resolution, browser capabilities, and rendering engine fingerprints (Canvas/WebGL).</li>
                            <li><strong>Interaction Logs:</strong> Mouse movements, keystroke timing, and navigation paths (used for Bot Detection).</li>
                        </ul>
                    </div>
                </section>

                {/* Section 2: Usage */}
                <section className="space-y-4 relative pl-8 border-l-2 border-blue-900/30">
                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-black border-2 border-blue-900 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-700" />
                    </div>
                    <div className="flex items-center gap-2 text-blue-500 font-bold uppercase tracking-wider text-sm">
                        <Database className="w-5 h-5" />
                        <h2>2. Usage of Information</h2>
                    </div>
                    <div className="prose prose-invert prose-sm max-w-none text-gray-400">
                        <p>
                            Collected data is processed purely for <strong>defensive research and system integrity</strong>:
                        </p>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <li className="bg-blue-950/20 p-4 border border-blue-900/40 rounded-sm">
                                <strong className="text-blue-400 block mb-1">Threat Intelligence</strong>
                                Analysis of attack vectors and malicious payloads to improve WAF rulesets.
                            </li>
                            <li className="bg-blue-950/20 p-4 border border-blue-900/40 rounded-sm">
                                <strong className="text-blue-400 block mb-1">Bot Mitigation</strong>
                                Differentiating human users from automated crawlers and scrapers via Arcjet analysis.
                            </li>
                        </ul>
                    </div>
                </section>

                {/* Section 3: Third Party */}
                <section className="space-y-4 relative pl-8 border-l-2 border-purple-900/30">
                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-black border-2 border-purple-900 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-700" />
                    </div>
                    <div className="flex items-center gap-2 text-purple-500 font-bold uppercase tracking-wider text-sm">
                        <Shuffle className="w-5 h-5" />
                        <h2>3. Infrastructure & Third-Party Processors</h2>
                    </div>
                    <p className="text-sm text-gray-400">
                        Data flows through strict processing pipes managed by trusted infrastructure providers. We do not sell data.
                    </p>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead>
                                <tr className="border-b border-white/10 text-purple-400">
                                    <th className="py-2">Processor</th>
                                    <th className="py-2">Role</th>
                                    <th className="py-2">Data Jurisdiction</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-500">
                                <tr className="border-b border-white/5">
                                    <td className="py-3 text-white">Vercel Inc.</td>
                                    <td className="py-3">Edge Hosting & Logs</td>
                                    <td className="py-3">USA / Global Edge</td>
                                </tr>
                                <tr className="border-b border-white/5">
                                    <td className="py-3 text-white">Arcjet</td>
                                    <td className="py-3">Security & Firewall</td>
                                    <td className="py-3">USA</td>
                                </tr>
                                <tr className="border-b border-white/5">
                                    <td className="py-3 text-white">Neon Tech</td>
                                    <td className="py-3">Encrypted Database</td>
                                    <td className="py-3">AWS Regions (USA)</td>
                                </tr>
                                <tr className="border-b border-white/5">
                                    <td className="py-3 text-white">Clerk</td>
                                    <td className="py-3">Identity Management</td>
                                    <td className="py-3">USA</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Section 4: Data Rights */}
                <section className="space-y-4 relative pl-8 border-l-2 border-gray-800">
                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-black border-2 border-gray-700 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-500" />
                    </div>
                    <div className="flex items-center gap-2 text-gray-400 font-bold uppercase tracking-wider text-sm">
                        <Shield className="w-5 h-5" />
                        <h2>4. User Rights & Retention</h2>
                    </div>
                    <div className="prose prose-invert prose-sm max-w-none text-gray-400">
                        <p>
                            <strong>Retention Period:</strong> Security logs are retained for 30 days automatically. &quot;Infamy Wall&quot; entries are permanent unless manually contested.
                        </p>
                        <p>
                            <strong>Right to Erasure (&quot;Forensic Wipe&quot;):</strong>
                            Users may initiate a session wipe directly via the application&apos;s &quot;Forensic Wipe&quot; command in the War Room.
                            This action cryptographically shreds the local session key, rendering the server-side session inaccessible.
                        </p>
                    </div>
                </section>

                {/* Footer */}
                <footer className="pt-12 border-t border-white/5 text-center">
                    <p className="text-xs text-gray-600 font-mono">
                        © {new Date().getFullYear()} SENTINEL-02. COMPLIANCE MODULE ACTIVE.
                    </p>
                </footer>
            </div>
        </main>
    );
}
