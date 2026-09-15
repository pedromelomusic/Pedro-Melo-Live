CREATE TABLE `contact_challenges` (
	`id` text PRIMARY KEY NOT NULL,
	`subscription_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`expires` integer NOT NULL,
	`confirmed` integer DEFAULT 0 NOT NULL
);

--> statement-breakpoint
CREATE INDEX `contact_challenges_token` ON `contact_challenges` (`token_hash`);
--> statement-breakpoint
CREATE INDEX `contact_challenges_expires` ON `contact_challenges` (`expires`);