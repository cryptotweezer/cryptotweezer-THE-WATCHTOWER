import { db } from "@/db";
import { securityEvents, userSessions } from "@/db/schema";
import { eq, and, desc, gt } from "drizzle-orm";
import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(req: Request) {
    // Resolve fingerprint from cookie (Edge-compatible — parse from raw header)
    const cookieHeader = req.headers.get("cookie") || "";
    const match = cookieHeader.match(/watchtower_node_id=([^;]+)/);
    const fingerprint = match?.[1];

    if (!fingerprint) {
        return NextResponse.json({ error: "No identity" }, { status: 401 });
    }

    // Parse cursor
    const url = new URL(req.url);
    const since = url.searchParams.get("since");

    try {
        // Query session
        const sessions = await db.select().from(userSessions)
            .where(eq(userSessions.fingerprint, fingerprint)).limit(1);

        if (sessions.length === 0) {
            return NextResponse.json({ error: "Session not found" }, { status: 404 });
        }

        const session = sessions[0];

        // Dynamic risk cap
        let riskCap = 40;
        if (session.operationDesertStorm) riskCap = 60;
        if (session.operationOverlord) riskCap = 80;
        if (session.operationRollingThunder) riskCap = 90;

        // Query new events since cursor
        let events: {
            id: string;
            eventType: string;
            timestamp: Date;
            payload: string | null;
            riskScoreImpact: number;
            route: string | null;
        }[] = [];

        if (since) {
            events = await db.select({
                id: securityEvents.id,
                eventType: securityEvents.eventType,
                timestamp: securityEvents.timestamp,
                payload: securityEvents.payload,
                riskScoreImpact: securityEvents.riskScoreImpact,
                route: securityEvents.route,
            }).from(securityEvents)
                .where(and(
                    eq(securityEvents.fingerprint, fingerprint),
                    gt(securityEvents.timestamp, new Date(since))
                ))
                .orderBy(desc(securityEvents.timestamp))
                .limit(10);
        }

        return NextResponse.json({
            events,
            riskScore: session.riskScore,
            riskCap,
            operations: {
                desertStorm: session.operationDesertStorm,
                overlord: session.operationOverlord,
                rollingThunder: session.operationRollingThunder,
            },
            uniqueTechniqueCount: session.uniqueTechniqueCount,
            externalTechniqueCount: session.externalTechniqueCount,
        }, {
            headers: {
                "Cache-Control": "no-store",
            },
        });
    } catch (err) {
        console.error("[SYNC] DB query failed:", (err as Error).message);
        return NextResponse.json(
            { error: "Service temporarily unavailable" },
            { status: 503, headers: { "Cache-Control": "no-store", "Retry-After": "10" } }
        );
    }
}
