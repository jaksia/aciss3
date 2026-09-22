CREATE TYPE "public"."ActivityLocation" AS ENUM('Jedáleň', 'Pred hl. vchodom', 'Telocvičňa', 'Spodné poschodie', 'Spoločenská miestnosť', 'Vonku');--> statement-breakpoint
CREATE TYPE "public"."ActivityType" AS ENUM('Budíček', 'Rozcvička', 'Večierka', 'Raňajky', 'Obed', 'Večera', 'Hra na dnu', 'Hra vonku', 'Športy', 'Prednášky', 'Semináre', 'Vyhodnotenie');--> statement-breakpoint
CREATE TYPE "public"."AdditionalInfo" AS ENUM('Prezúvanie', 'Striedanie kroniky/služ. dňa', 'Upracte po sebe', 'Kľudový režim');--> statement-breakpoint
CREATE TYPE "public"."ConfigurableSounds" AS ENUM('alert_start', 'additional_jingle', 'alert_end', 'delay_start', 'delay_end', 'zvolavacka', 'vecernicek');--> statement-breakpoint
CREATE TYPE "public"."ParticipantNeeds" AS ENUM('Pero na osobu', 'Papier na osobu', 'Šatka na osobu', 'Pero na družinku', 'Papier na družinku', 'Šatka na družinku', 'Fyzická sila', 'Mentálna sila', 'Teplé oblečenie', 'Nepremokavé oblečenie', 'Športové oblečenie', 'Oblečenie na zničenie');--> statement-breakpoint
CREATE TABLE "activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"name" text NOT NULL,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp NOT NULL,
	"zvolavanie" boolean DEFAULT true NOT NULL,
	"delay" integer,
	"type" "ActivityType" NOT NULL,
	"location" "ActivityLocation" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity_additional_infos" (
	"activity_id" integer NOT NULL,
	"info" "AdditionalInfo" NOT NULL,
	CONSTRAINT "activity_additional_infos_activity_id_info_pk" PRIMARY KEY("activity_id","info")
);
--> statement-breakpoint
CREATE TABLE "activity_alert_times" (
	"activity_id" integer NOT NULL,
	"minutes" integer NOT NULL,
	CONSTRAINT "activity_alert_times_activity_id_minutes_pk" PRIMARY KEY("activity_id","minutes")
);
--> statement-breakpoint
CREATE TABLE "activity_participant_needs" (
	"activity_id" integer NOT NULL,
	"need" "ParticipantNeeds" NOT NULL,
	CONSTRAINT "activity_participant_needs_activity_id_need_pk" PRIMARY KEY("activity_id","need")
);
--> statement-breakpoint
CREATE TABLE "event_sounds" (
	"event_id" integer NOT NULL,
	"type" "ConfigurableSounds" NOT NULL,
	"path" text NOT NULL,
	CONSTRAINT "event_sounds_event_id_type_pk" PRIMARY KEY("event_id","type")
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_additional_infos" ADD CONSTRAINT "activity_additional_infos_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_alert_times" ADD CONSTRAINT "activity_alert_times_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_participant_needs" ADD CONSTRAINT "activity_participant_needs_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_sounds" ADD CONSTRAINT "event_sounds_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;