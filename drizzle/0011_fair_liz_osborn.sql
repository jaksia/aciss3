CREATE TYPE "public"."ApiKeyActionTypes" AS ENUM('pull', 'upload');--> statement-breakpoint
CREATE TABLE "api_key_actions" (
	"id" serial PRIMARY KEY NOT NULL,
	"api_key_id" uuid NOT NULL,
	"type" "ApiKeyActionTypes" NOT NULL,
	"ip_address" "inet" NOT NULL,
	"sound_id" uuid,
	"location_id" uuid,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "exactly_one_object" CHECK (
        (CASE WHEN "api_key_actions"."sound_id" IS NULL THEN 0 ELSE 1 END +
         CASE WHEN "api_key_actions"."location_id" IS NULL THEN 0 ELSE 1 END) = 1
    )
);
--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(64) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"read_access" boolean DEFAULT false NOT NULL,
	"write_access" boolean DEFAULT false NOT NULL,
	"revoked" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "api_key_actions" ADD CONSTRAINT "api_key_actions_api_key_id_api_keys_id_fk" FOREIGN KEY ("api_key_id") REFERENCES "public"."api_keys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_key_actions" ADD CONSTRAINT "api_key_actions_sound_id_custom_sounds_id_fk" FOREIGN KEY ("sound_id") REFERENCES "public"."custom_sounds"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_key_actions" ADD CONSTRAINT "api_key_actions_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE set null ON UPDATE no action;