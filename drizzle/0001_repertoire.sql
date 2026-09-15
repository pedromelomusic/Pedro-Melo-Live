CREATE TABLE `songs` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`artist` text NOT NULL,
	`status` text DEFAULT 'available' NOT NULL,
	`lyrics` text DEFAULT '' NOT NULL,
	`lyrics_approved` integer DEFAULT 0 NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL
);

--> statement-breakpoint
CREATE INDEX `songs_status_title` ON `songs` (`status`,`title`);
--> statement-breakpoint
ALTER TABLE `requests` ADD `song_id` text;