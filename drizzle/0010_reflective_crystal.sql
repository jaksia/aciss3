ALTER TABLE "custom_sounds" ADD COLUMN "new_id" UUID DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "events_to_sounds" ADD COLUMN "new_custom_sound_id" UUID;

UPDATE "events_to_sounds" ets SET "new_custom_sound_id" = cs.new_id FROM "custom_sounds" cs WHERE ets.custom_sound_id = cs.id;

ALTER TABLE "events_to_sounds" DROP CONSTRAINT IF EXISTS "events_to_sounds_custom_sound_id_custom_sounds_id_fk";
ALTER TABLE "events_to_sounds" DROP CONSTRAINT IF EXISTS "events_to_sounds_pkey";

ALTER TABLE "custom_sounds" DROP COLUMN "id";
ALTER TABLE "custom_sounds" RENAME COLUMN "new_id" TO "id";
ALTER TABLE "custom_sounds" ADD PRIMARY KEY ("id");

ALTER TABLE "events_to_sounds" DROP COLUMN "custom_sound_id";
ALTER TABLE "events_to_sounds" RENAME COLUMN "new_custom_sound_id" TO "custom_sound_id";
ALTER TABLE "events_to_sounds" ALTER COLUMN "custom_sound_id" SET NOT NULL;
ALTER TABLE "events_to_sounds" ADD PRIMARY KEY ("event_id", "custom_sound_id");

ALTER TABLE "events_to_sounds" 
ADD CONSTRAINT "events_to_sounds_custom_sound_id_fkey" 
FOREIGN KEY ("custom_sound_id") REFERENCES "custom_sounds"("id") ON DELETE CASCADE;

ALTER TABLE "locations" ADD COLUMN "new_id" UUID DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "events_to_locations" ADD COLUMN "new_location_id" UUID;
ALTER TABLE "activities" ADD COLUMN "new_location_id" UUID;

UPDATE "events_to_locations" etl SET "new_location_id" = l.new_id FROM "locations" l WHERE etl.location_id = l.id;

UPDATE "activities" a SET "new_location_id" = l.new_id FROM "locations" l WHERE a.location_id = l.id;

ALTER TABLE "events_to_locations" DROP CONSTRAINT IF EXISTS "events_to_locations_location_id_locations_id_fk";
ALTER TABLE "events_to_locations" DROP CONSTRAINT IF EXISTS "events_to_locations_pkey";
ALTER TABLE "activities" DROP CONSTRAINT IF EXISTS "activities_location_id_locations_id_fk";

ALTER TABLE "locations" DROP COLUMN "id";
ALTER TABLE "locations" RENAME COLUMN "new_id" TO "id";
ALTER TABLE "locations" ADD PRIMARY KEY ("id");

ALTER TABLE "events_to_locations" DROP COLUMN "location_id";
ALTER TABLE "events_to_locations" RENAME COLUMN "new_location_id" TO "location_id";
ALTER TABLE "events_to_locations" ALTER COLUMN "location_id" SET NOT NULL;
ALTER TABLE "events_to_locations" ADD PRIMARY KEY ("event_id", "location_id");

ALTER TABLE "activities" DROP COLUMN "location_id";
ALTER TABLE "activities" RENAME COLUMN "new_location_id" TO "location_id";
ALTER TABLE "activities" ALTER COLUMN "location_id" SET NOT NULL;

ALTER TABLE "events_to_locations" 
ADD CONSTRAINT "events_to_locations_location_id_fkey" 
FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE CASCADE;

ALTER TABLE "activities" 
ADD CONSTRAINT "activities_location_id_fkey" 
FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT;
-->statement-breakpoint