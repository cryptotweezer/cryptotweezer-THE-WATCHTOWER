ALTER TABLE "user_sessions" ADD COLUMN "cid" text;--> statement-breakpoint
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_cid_unique" UNIQUE("cid");