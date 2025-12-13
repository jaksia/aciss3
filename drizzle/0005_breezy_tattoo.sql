DELETE FROM "session";--> statement-breakpoint

ALTER TABLE "session" ALTER COLUMN "id" SET DATA TYPE varchar(64);--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN "socket_code_hash" varchar(64) NOT NULL;