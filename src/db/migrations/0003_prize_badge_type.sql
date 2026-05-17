ALTER TYPE "public"."prize_type" ADD VALUE 'badge';--> statement-breakpoint
ALTER TABLE "prizes" ADD COLUMN "badge_id" uuid REFERENCES "public"."badges"("id") ON DELETE set null;
