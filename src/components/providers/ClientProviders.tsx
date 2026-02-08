"use client";

import { SentinelProvider } from "@/contexts/SentinelContext";
import { ReactNode } from "react";

export default function ClientProviders({ children }: { children: ReactNode }) {
    return (
        <SentinelProvider>
            {children}
        </SentinelProvider>
    );
}
