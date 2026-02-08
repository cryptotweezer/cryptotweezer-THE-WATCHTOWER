ALTER TABLE "security_events" ALTER COLUMN "event_type" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "security_events" ADD COLUMN "route" text;--> statement-breakpoint
ALTER TABLE "user_sessions" ADD COLUMN "routing_probe_count" integer DEFAULT 0 NOT NULL;