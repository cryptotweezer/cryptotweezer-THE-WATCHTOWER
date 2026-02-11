ALTER TABLE "user_sessions" ADD COLUMN "external_technique_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "user_sessions" ADD COLUMN "operation_desert_storm" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user_sessions" ADD COLUMN "operation_overlord" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user_sessions" ADD COLUMN "operation_rolling_thunder" boolean DEFAULT false NOT NULL;