CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session_allowed_events" (
	"session_id" text NOT NULL,
	"event_id" integer NOT NULL,
	"expires_at" timestamp NOT NULL,
	CONSTRAINT "session_allowed_events_session_id_event_id_pk" PRIMARY KEY("session_id","event_id")
);
--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "admin_password_hash" text;--> statement-breakpoint
ALTER TABLE "session_allowed_events" ADD CONSTRAINT "session_allowed_events_session_id_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_allowed_events" ADD CONSTRAINT "session_allowed_events_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;