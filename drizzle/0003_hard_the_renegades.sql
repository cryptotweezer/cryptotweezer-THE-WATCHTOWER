ALTER TABLE "user_sessions" ADD COLUMN "clerk_id" text;--> statement-breakpoint
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_clerk_id_unique" UNIQUE("clerk_id");