ALTER TABLE `sessions` ADD `venue` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `sessions` ADD `city` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `sessions` ADD `featured_title` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `sessions` ADD `featured_artist` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `sessions` ADD `featured_url` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `songs` ADD `genre` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `songs` ADD `decade` integer;
--> statement-breakpoint
ALTER TABLE `songs` ADD `language` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `songs` ADD `mood` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `songs` ADD `recommended` integer DEFAULT 0 NOT NULL;