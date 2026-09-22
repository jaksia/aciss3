CREATE TABLE "custom_sounds" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" "ConfigurableSounds" NOT NULL,
	"description" char(64),
	"path" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events_to_sounds" (
	"event_id" integer NOT NULL,
	"custom_sound_id" integer NOT NULL,
	"sound_key" "ConfigurableSounds" NOT NULL,
	CONSTRAINT "events_to_sounds_event_id_custom_sound_id_pk" PRIMARY KEY("event_id","custom_sound_id"),
	CONSTRAINT "one_sound_key_per_event" UNIQUE("event_id","sound_key")
);
--> statement-breakpoint
DROP TABLE "event_sounds" CASCADE;--> statement-breakpoint
ALTER TABLE "events_to_sounds" ADD CONSTRAINT "events_to_sounds_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events_to_sounds" ADD CONSTRAINT "events_to_sounds_custom_sound_id_custom_sounds_id_fk" FOREIGN KEY ("custom_sound_id") REFERENCES "public"."custom_sounds"("id") ON DELETE cascade ON UPDATE no action;