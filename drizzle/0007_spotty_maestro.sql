ALTER TABLE "threads" ALTER COLUMN "model" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "thinking" text;--> statement-breakpoint
ALTER TABLE "messages" DROP COLUMN "model";--> statement-breakpoint
ALTER TABLE "messages" DROP COLUMN "max_prompt_length";--> statement-breakpoint
ALTER TABLE "messages" DROP COLUMN "generation_time_ms";--> statement-breakpoint
ALTER TABLE "messages" DROP COLUMN "tool_call_counts";