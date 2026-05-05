ALTER TABLE "custom_sounds" ADD COLUMN "flags" integer DEFAULT 0 NOT NULL;
UPDATE "custom_sounds" SET "flags" = 2 WHERE "default" = true;
ALTER TABLE "custom_sounds" DROP COLUMN "default";--> statement-breakpoint

ALTER TABLE "locations" ADD COLUMN "flags" integer DEFAULT 0 NOT NULL;
UPDATE "locations" SET "flags" = 1 WHERE "is_static" = true;
ALTER TABLE "locations" DROP COLUMN "is_static";--> statement-breakpoint