CREATE TABLE "events_to_locations" (
	"event_id" integer NOT NULL,
	"location_id" integer NOT NULL,
	CONSTRAINT "events_to_locations_event_id_location_id_pk" PRIMARY KEY("event_id","location_id")
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"content" text NOT NULL,
	"path" text NOT NULL,
	"is_static" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "location_id" integer;--> statement-breakpoint
ALTER TABLE "events_to_locations" ADD CONSTRAINT "events_to_locations_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events_to_locations" ADD CONSTRAINT "events_to_locations_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "start_before_end" CHECK ("activities"."start_time" < "activities"."end_time");
ALTER TABLE "activities" ADD CONSTRAINT "positive_or_null_delay" CHECK (("activities"."delay" is null or "activities"."delay" > 0));

--> statement-breakpoint
INSERT INTO "locations" ("name", "content", "path", "is_static") VALUES
	('Spoločenská miestnosť', 'v spoločenskej miestnosti', '/sounds/activities/locations/common_room.mp3', true),
	('Jedáleň', 'v jedálni', '/sounds/activities/locations/canteen.mp3', true),
	('Pred hl. vchodom', 'pred hlavným vchodom', '/sounds/activities/locations/main_entrance.mp3', true),
	('Telocvičňa', 'v telocvični', '/sounds/activities/locations/gym.mp3', true),
	('Spodné poschodie', 'na spodnom poschodí', '/sounds/activities/locations/lower_floor.mp3', true),
	('Vonku', 'vonku', '/sounds/activities/locations/outside.mp3', true);

--> statement-breakpoint
UPDATE "activities" SET "location_id" = (SELECT "loc"."id" FROM "locations" "loc" WHERE CAST("activities"."location" AS text) = "loc"."name");
UPDATE "activities" SET "location_id" = 1 WHERE "location_id" IS NULL;

--> statement-breakpoint
ALTER TABLE "activities" ALTER COLUMN "location_id" SET NOT NULL;
ALTER TABLE "activities" DROP COLUMN "location";
DROP TYPE "public"."ActivityLocation";
--> statement-breakpoint