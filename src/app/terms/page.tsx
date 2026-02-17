import Link from "next/link";
import { FileText, Gavel, Hand, ShieldBan, Terminal, ArrowLeft } from "lucide-react";

export default function TermsPage() {
    return (
        <main className="min-h-screen bg-black text-gray-300 font-mono p-6 md:p-12 selection:bg-amber-900 selection:text-white">
            <div className="max-w-4xl mx-auto space-y-12">

                {/* Header */}
                <header className="space-y-4 border-b border-white/10 pb-8">
                    <Link href="/" className="inline-flex items-center gap-2 text-xs text-amber-500 hover:text-amber-400 mb-4 transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        RETURN TO TERMINAL
                    </Link>
                    <div className="flex items-center gap-3">
                        <FileText className="w-8 h-8 text-amber-600" />
                        <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-600 to-amber-400">
                            TERMS OF SERVICE
                        </h1>
                    </div>
                    <p className="text-sm text-gray-500 uppercase tracking-widest pl-11">
                        Last Revised: {new Date().toLocaleDateString()} — Protocol: <span className="text-amber-500 font-bold">BINDING</span>
                    </p>
                </header>

                {/* Section 1: Acceptance */}
                <section className="space-y-4 relative pl-8 border-l-2 border-amber-900/30">
                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-black border-2 border-amber-900 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-700" />
                    </div>
                    <div className="flex items-center gap-2 text-amber-500 font-bold uppercase tracking-wider text-sm">
                        <Hand className="w-5 h-5" />
                        <h2>1. Acceptance of Terms</h2>
                    </div>
                    <div className="prose prose-invert prose-sm max-w-none text-gray-400">
                        <p>
                            By initializing a connection to <strong>THE WATCHTOWER</strong> (hereinafter &quot;The System&quot;), you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
                        </p>
                        <p className="text-amber-400/80">
                            If you do not agree to these terms, you must terminate your session immediately using the `exit` command or by closing your browser tab.
                        </p>
                    </div>
                </section>

                {/* Section 2: Authorized Use */}
                <section className="space-y-4 relative pl-8 border-l-2 border-green-900/30">
                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-black border-2 border-green-900 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-700" />
                    </div>
                    <div className="flex items-center gap-2 text-green-500 font-bold uppercase tracking-wider text-sm">
                        <Terminal className="w-5 h-5" />
                        <h2>2. Authorized Use & Rules of Engagement</h2>
                    </div>
                    <div className="prose prose-invert prose-sm max-w-none text-gray-400">
                        <p>
                            You are granted a limited, revocable, non-exclusive license to access The System for the following purposes:
                        </p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li><strong>Security Research:</strong> Exploring the &quot;Defense in Depth&quot; architecture.</li>
                            <li><strong>Authorized Testing:</strong> Interacting with designated honeypot modules (&quot;Operation Overlord&quot;, &quot;Rolling Thunder&quot;).</li>
                            <li><strong>Educational Audit:</strong> Reviewing the open-source implementation of the security stack.</li>
                        </ul>
                    </div>
                </section>

                {/* Section 3: Prohibited Conduct */}
                <section className="space-y-4 relative pl-8 border-l-2 border-red-900/30">
                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-black border-2 border-red-900 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-700" />
                    </div>
                    <div className="flex items-center gap-2 text-red-500 font-bold uppercase tracking-wider text-sm">
                        <ShieldBan className="w-5 h-5" />
                        <h2>3. Prohibited Conduct (Rules of Engagement)</h2>
                    </div>
                    <div className="prose prose-invert prose-sm max-w-none text-gray-400">
                        <p>
                            While this system encourages &quot;Red Teaming&quot;, the following actions are strictly prohibited and will result in an immediate IP ban:
                        </p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li><strong>Destructive Testing:</strong> Any attempt to permanently delete data (outside of the allowed &quot;Forensic Wipe&quot; feature) or crash the hosting infrastructure (DDoS).</li>
                            <li><strong>Lateral Movement:</strong> Attempting to pivot from this container to the underlying Vercel/AWS infrastructure.</li>
                            <li><strong>Harassment:</strong> Injecting hate speech or illegal content into the &quot;Wall of Infamy&quot; or Leaderboard.</li>
                        </ul>
                    </div>
                </section>

                {/* Section 4: Disclaimer */}
                <section className="space-y-4 relative pl-8 border-l-2 border-gray-800">
                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-black border-2 border-gray-700 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-500" />
                    </div>
                    <div className="flex items-center gap-2 text-gray-400 font-bold uppercase tracking-wider text-sm">
                        <Gavel className="w-5 h-5" />
                        <h2>4. Disclaimer of Warranties</h2>
                    </div>
                    <div className="prose prose-invert prose-sm max-w-none text-gray-400">
                        <p>
                            THE SYSTEM IS PROVIDED &quot;AS IS&quot;, WITHOUT WARRANTY OF ANY KIND.
                        </p>
                        <p>
                            We do not warrant that the system will be uninterrupted, error-free, or free of harmful components (specifically referring to the simulated malware payloads used in the honeypot modules). You assume full responsibility for your interactions with this research environment.
                        </p>
                    </div>
                </section>

                {/* Footer */}
                <footer className="pt-12 border-t border-white/5 text-center">
                    <p className="text-xs text-gray-600 font-mono">
                        © {new Date().getFullYear()} SENTINEL-02. GOVERNANCE PROTOCOL SIGNED.
                    </p>
                </footer>
            </div>
        </main>
    );
}
