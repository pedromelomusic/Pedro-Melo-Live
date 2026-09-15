CREATE TABLE `export_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`scope` text NOT NULL,
	`snapshot` integer NOT NULL,
	`total` integer NOT NULL,
	`upper_row` integer NOT NULL,
	`cursor` integer DEFAULT 0 NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	`state` text DEFAULT 'pending' NOT NULL,
	`upload_id` text NOT NULL,
	`parts` text DEFAULT '[]' NOT NULL,
	`buffer_key` text DEFAULT '' NOT NULL,
	`lease` integer DEFAULT 0 NOT NULL,
	`expires` integer NOT NULL,
	`error` text DEFAULT '' NOT NULL
);

--> statement-breakpoint
CREATE INDEX `export_jobs_expires` ON `export_jobs` (`expires`);