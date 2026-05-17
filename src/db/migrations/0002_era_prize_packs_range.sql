-- Replace position with positionFrom/positionTo to support prize ranges
DROP TABLE IF EXISTS "era_prize_packs";
CREATE TABLE "era_prize_packs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "era_id" uuid NOT NULL,
  "pack_id" uuid NOT NULL,
  "position_from" integer NOT NULL,
  "position_to" integer NOT NULL,
  CONSTRAINT "era_prize_packs_era_id_fkey" FOREIGN KEY ("era_id") REFERENCES "eras"("id") ON DELETE CASCADE,
  CONSTRAINT "era_prize_packs_pack_id_fkey" FOREIGN KEY ("pack_id") REFERENCES "prize_packs"("id") ON DELETE CASCADE
);
