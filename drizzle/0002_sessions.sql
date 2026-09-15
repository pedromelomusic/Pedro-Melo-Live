CREATE TABLE `session_songs` (
	`session_id` text NOT NULL,
	`song_id` text NOT NULL,
	`status` text DEFAULT 'available' NOT NULL,
	`in_setlist` integer DEFAULT 0 NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`session_id`, `song_id`)
);

--> statement-breakpoint
CREATE INDEX `session_songs_order` ON `session_songs` (`session_id`,`in_setlist`,`position`);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`date` text DEFAULT '' NOT NULL,
	`created` integer NOT NULL,
	`requests_open` integer DEFAULT 1 NOT NULL,
	`now_song_id` text,
	`archived` integer DEFAULT 0 NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL
);

--> statement-breakpoint
ALTER TABLE `requests` ADD `session_id` text;
--> statement-breakpoint
CREATE INDEX `requests_session_created_id` ON `requests` (`session_id`,`created`,`id`);