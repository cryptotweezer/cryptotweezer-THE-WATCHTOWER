CREATE TABLE "infamy_wall" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fingerprint" text NOT NULL,
	"alias" text NOT NULL,
	"message" text NOT NULL,
	"risk_score" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
