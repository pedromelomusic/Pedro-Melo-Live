CREATE TABLE `metrics` (
	`day` text NOT NULL,
	`session_id` text NOT NULL,
	`event` text NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`day`, `session_id`, `event`)
);

--> statement-breakpoint
CREATE TABLE `outbox` (
	`id` text PRIMARY KEY NOT NULL,
	`destination` text NOT NULL,
	`event` text NOT NULL,
	`payload` text NOT NULL,
	`subscription_id` text,
	`created` integer NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`next_attempt` integer DEFAULT 0 NOT NULL,
	`lease` integer DEFAULT 0 NOT NULL
);

--> statement-breakpoint
CREATE INDEX `outbox_due` ON `outbox` (`next_attempt`,`lease`);
--> statement-breakpoint
CREATE INDEX `outbox_created` ON `outbox` (`created`);
--> statement-breakpoint
CREATE TABLE `rate_buckets` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`expires` integer NOT NULL
);

--> statement-breakpoint
CREATE INDEX `rate_buckets_expires` ON `rate_buckets` (`expires`);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`channel` text NOT NULL,
	`contact` text NOT NULL,
	`session_id` text,
	`created` integer NOT NULL,
	`expires` integer NOT NULL,
	`policy` text NOT NULL,
	`token_hash` text NOT NULL
);

--> statement-breakpoint
CREATE INDEX `subscriptions_expires` ON `subscriptions` (`expires`);
--> statement-breakpoint
CREATE INDEX `subscriptions_token` ON `subscriptions` (`token_hash`);
--> statement-breakpoint
ALTER TABLE `sessions` ADD `mode` text DEFAULT 'concert' NOT NULL;