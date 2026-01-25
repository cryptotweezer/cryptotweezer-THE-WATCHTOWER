CREATE TYPE "public"."action_taken" AS ENUM('Blocked', 'Allowed', 'Flagged', 'Tarpit');--> statement-breakpoint
CREATE TYPE "public"."event_type" AS ENUM('SQLi', 'XSS', 'Bot', 'RateLimit', 'AccessControl', 'PromptInjection');--> statement-breakpoint
CREATE TABLE "research_leaderboard" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fingerprint" text NOT NULL,
	"points" integer DEFAULT 0 NOT NULL,
	"achievements" text[],
	"discovery_date" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "security_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fingerprint" text,
	"event_type" "event_type" NOT NULL,
	"payload" text,
	"risk_score_impact" integer DEFAULT 0 NOT NULL,
	"action_taken" "action_taken" NOT NULL,
	"ip_address" text,
	"location" text,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_sessions" (
	"fingerprint" text PRIMARY KEY NOT NULL,
	"alias" text NOT NULL,
	"risk_score" integer DEFAULT 0 NOT NULL,
	"first_seen" timestamp DEFAULT now() NOT NULL,
	"last_seen" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "research_leaderboard" ADD CONSTRAINT "research_leaderboard_fingerprint_user_sessions_fingerprint_fk" FOREIGN KEY ("fingerprint") REFERENCES "public"."user_sessions"("fingerprint") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "security_events" ADD CONSTRAINT "security_events_fingerprint_user_sessions_fingerprint_fk" FOREIGN KEY ("fingerprint") REFERENCES "public"."user_sessions"("fingerprint") ON DELETE no action ON UPDATE no action;