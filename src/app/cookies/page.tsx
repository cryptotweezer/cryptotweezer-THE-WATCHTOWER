import Link from "next/link";
import { Cookie, ShieldCheck, Database, Info, ArrowLeft } from "lucide-react";

export default function CookiesPage() {
    return (
        <main className="min-h-screen bg-black text-gray-300 font-mono p-6 md:p-12 selection:bg-orange-900 selection:text-white">
            <div className="max-w-4xl mx-auto space-y-12">

                {/* Header */}
                <header className="space-y-4 border-b border-white/10 pb-8">
                    <Link href="/" className="inline-flex items-center gap-2 text-xs text-orange-500 hover:text-orange-400 mb-4 transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        RETURN TO TERMINAL
                    </Link>
                    <div className="flex items-center gap-3">
                        <Cookie className="w-8 h-8 text-orange-600" />
                        <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-orange-400">
                            COOKIES & LOCAL STORAGE
                        </h1>
                    </div>
                    <p className="text-sm text-gray-500 uppercase tracking-widest pl-11">
                        Policy Status: <span className="text-orange-500 font-bold">STRICTLY NECESSARY</span>
                    </p>
                </header>

                {/* Section 1: Overview */}
                <section className="space-y-4 relative pl-8 border-l-2 border-orange-900/30">
                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-black border-2 border-orange-900 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-700" />
                    </div>
                    <div className="flex items-center gap-2 text-orange-500 font-bold uppercase tracking-wider text-sm">
                        <Info className="w-5 h-5" />
                        <h2>1. No Tracking Philosophy</h2>
                    </div>
                    <div className="prose prose-invert prose-sm max-w-none text-gray-400">
                        <p>
                            <strong>THE WATCHTOWER</strong> does <span className="text-orange-400">NOT</span> use third-party advertising cookies, marketing trackers, or cross-site fingerprinting beacons for commercial purposes.
                        </p>
                        <p>
                            We utilize a minimal set of &quot;Strictly Necessary&quot; identifiers required for the system&apos;s security architecture and core functionality.
                        </p>
                    </div>
                </section>

                {/* Section 2: Active Cookies */}
                <section className="space-y-4 relative pl-8 border-l-2 border-blue-900/30">
                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-black border-2 border-blue-900 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-700" />
                    </div>
                    <div className="flex items-center gap-2 text-blue-500 font-bold uppercase tracking-wider text-sm">
                        <Database className="w-5 h-5" />
                        <h2>2. Active Storage Registry</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead>
                                <tr className="border-b border-white/10 text-blue-400">
                                    <th className="py-2">Name</th>
                                    <th className="py-2">Type</th>
                                    <th className="py-2">Purpose</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-500">
                                <tr className="border-b border-white/5">
                                    <td className="py-3 text-white font-mono">__clerk_db_jwt</td>
                                    <td className="py-3">Cookie</td>
                                    <td className="py-3">Authentication & Session Management.</td>
                                </tr>
                                <tr className="border-b border-white/5">
                                    <td className="py-3 text-white font-mono">aj-fps</td>
                                    <td className="py-3">Local Storage</td>
                                    <td className="py-3">Arcjet Fingerprint for Bot Detection.</td>
                                </tr>
                                <tr className="border-b border-white/5">
                                    <td className="py-3 text-white font-mono">watchtower_node_id</td>
                                    <td className="py-3">Cookie</td>
                                    <td className="py-3">Anonymous device identifier for Risk Scoring.</td>
                                </tr>
                                <tr className="border-b border-white/5">
                                    <td className="py-3 text-white font-mono">sentinel_chat_history</td>
                                    <td className="py-3">Session Storage</td>
                                    <td className="py-3">Temporary buffer for AI chat context.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Section 3: Management */}
                <section className="space-y-4 relative pl-8 border-l-2 border-gray-800">
                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-black border-2 border-gray-700 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-500" />
                    </div>
                    <div className="flex items-center gap-2 text-gray-400 font-bold uppercase tracking-wider text-sm">
                        <ShieldCheck className="w-5 h-5" />
                        <h2>3. Cookie Management</h2>
                    </div>
                    <div className="prose prose-invert prose-sm max-w-none text-gray-400">
                        <p>
                            Since these tokens are essential for the operation of the &quot;Active Defense&quot; modules, blocking them via browser settings may result in:
                        </p>
                        <ul className="list-disc pl-5 space-y-1 text-red-400/80">
                            <li>Immediate disconnection from the WebSocket stream.</li>
                            <li>False-positive flagging as a &quot;Bot&quot; or &quot;Scraper&quot; by the Arcjet firewall.</li>
                            <li>Inability to access the War Room dashboard.</li>
                        </ul>
                    </div>
                </section>

                {/* Footer */}
                <footer className="pt-12 border-t border-white/5 text-center">
                    <p className="text-xs text-gray-600 font-mono">
                        © {new Date().getFullYear()} SENTINEL-02. STORAGE AUDIT COMPLETE.
                    </p>
                </footer>
            </div>
        </main>
    );
}
