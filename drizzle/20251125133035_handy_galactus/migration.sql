CREATE TYPE "public"."EventStyles" AS ENUM('default', 'Pikomat', 'Pikofyz', 'Kockatý víkend');--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "style" "EventStyles" DEFAULT 'default' NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "location" text;