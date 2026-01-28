"use client";

import Link from "next/link";

export default function Footer() {
    return (
        <footer className="w-full border-t border-blue-500/20 bg-neutral-950/80 backdrop-blur-sm mt-0 pt-12 pb-1">
            <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* Left Side: Brand & Context */}
                <div className="flex flex-col justify-center space-y-4">
                    <h4 className="text-gray-400 text-xs tracking-wider uppercase font-mono">
                        Andrés Henao Cybersecurity Specialist
                    </h4>
                    <h2 className="text-white font-bold text-xl tracking-tight">
                        SecOps | SOC | <span className="text-blue-500">THE WATCHTOWER</span>
                    </h2>
                </div>

                {/* Right Side: Legal Links */}
                <div className="flex flex-col md:items-end justify-center space-y-2">
                    <Link href="/legal" className="text-gray-500 hover:text-blue-400 text-xs font-mono transition-colors">
                        Legal Notice
                    </Link>
                    <Link href="/privacy" className="text-gray-500 hover:text-blue-400 text-xs font-mono transition-colors">
                        Privacy Policy
                    </Link>
                    <Link href="/terms" className="text-gray-500 hover:text-blue-400 text-xs font-mono transition-colors">
                        Terms of Service
                    </Link>
                    <Link href="/cookies" className="text-gray-500 hover:text-blue-400 text-xs font-mono transition-colors">
                        Cookie Policy
                    </Link>
                </div>
            </div>

            {/* Bottom Center: Copyright */}
            <div className="w-full text-center mt-12 pt-8 border-t border-gray-900/50">
                <p className="text-[10px] text-gray-600 font-mono">
                    © 2026 <a href="https://github.com/cryptotweezer/cryptotweezer-THE-WATCHTOWER.git" target="_blank" rel="noopener noreferrer" className="hover:text-blue-500 hover:underline transition-colors">Andres Henao</a>. All rights reserved.
                </p>
            </div>
        </footer>
    );
}
