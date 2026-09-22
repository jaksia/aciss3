ALTER TYPE "public"."EventStyles" ADD VALUE 'Riešky';--> statement-breakpoint
ALTER TYPE "public"."EventStyles" ADD VALUE 'KSP';--> statement-breakpoint
ALTER TYPE "public"."EventStyles" ADD VALUE 'FKS';--> statement-breakpoint
ALTER TYPE "public"."EventStyles" ADD VALUE 'KMS';--> statement-breakpoint

DELETE FROM "activity_additional_infos" WHERE "info" = 'Upracte po sebe';

ALTER TYPE "AdditionalInfo" RENAME TO "AdditionalInfo_old";

CREATE TYPE "AdditionalInfo" AS ENUM('Prezúvanie', 'Striedanie kroniky/služ. dňa', 'Kľudový režim');

ALTER TABLE "activity_additional_infos" 
  ALTER COLUMN "info" TYPE "AdditionalInfo" 
  USING "info"::text::"AdditionalInfo";

DROP TYPE "AdditionalInfo_old";--> statement-breakpoint