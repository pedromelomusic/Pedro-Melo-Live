CREATE TABLE `requests` (
	`id` text PRIMARY KEY NOT NULL,
	`song` text NOT NULL,
	`name` text NOT NULL,
	`created` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`client` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `requests_created` ON `requests` (`created`);--> statement-breakpoint
CREATE INDEX `requests_client_created` ON `requests` (`client`,`created`);--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
