CREATE TABLE `database_revision` (
	`id` integer PRIMARY KEY NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL
);

--> statement-breakpoint
CREATE TABLE `restore_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`base_revision` integer NOT NULL,
	`source_key` text NOT NULL,
	`safety_key` text NOT NULL,
	`hash` text NOT NULL,
	`summary` text NOT NULL,
	`expires` integer NOT NULL,
	`applied` integer DEFAULT 0 NOT NULL,
	`nonce` text
);

--> statement-breakpoint
CREATE TABLE `tips` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text,
	`request_id` text,
	`song_id` text,
	`provider` text NOT NULL,
	`expected_cents` integer NOT NULL,
	`received_cents` integer DEFAULT 0 NOT NULL,
	`refunded_cents` integer DEFAULT 0 NOT NULL,
	`paid_votes` integer DEFAULT 0 NOT NULL,
	`state` text DEFAULT 'pending' NOT NULL,
	`external_ref` text,
	`created` integer NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL
);

--> statement-breakpoint
CREATE UNIQUE INDEX `tips_provider_reference` ON `tips` (`provider`,`external_ref`);
--> statement-breakpoint
CREATE INDEX `tips_session_created` ON `tips` (`session_id`,`created`);
--> statement-breakpoint
INSERT OR IGNORE INTO database_revision(id,revision) VALUES (1,0);
CREATE TRIGGER revision_songs_insert AFTER INSERT ON songs BEGIN UPDATE database_revision SET revision=revision+1 WHERE id=1; END;
CREATE TRIGGER revision_songs_update AFTER UPDATE ON songs BEGIN UPDATE database_revision SET revision=revision+1 WHERE id=1; END;
CREATE TRIGGER revision_songs_delete AFTER DELETE ON songs BEGIN UPDATE database_revision SET revision=revision+1 WHERE id=1; END;
CREATE TRIGGER revision_sessions_insert AFTER INSERT ON sessions BEGIN UPDATE database_revision SET revision=revision+1 WHERE id=1; END;
CREATE TRIGGER revision_sessions_update AFTER UPDATE ON sessions BEGIN UPDATE database_revision SET revision=revision+1 WHERE id=1; END;
CREATE TRIGGER revision_sessions_delete AFTER DELETE ON sessions BEGIN UPDATE database_revision SET revision=revision+1 WHERE id=1; END;
CREATE TRIGGER revision_session_songs_insert AFTER INSERT ON session_songs BEGIN UPDATE database_revision SET revision=revision+1 WHERE id=1; END;
CREATE TRIGGER revision_session_songs_update AFTER UPDATE ON session_songs BEGIN UPDATE database_revision SET revision=revision+1 WHERE id=1; END;
CREATE TRIGGER revision_session_songs_delete AFTER DELETE ON session_songs BEGIN UPDATE database_revision SET revision=revision+1 WHERE id=1; END;
CREATE TRIGGER revision_requests_insert AFTER INSERT ON requests BEGIN UPDATE database_revision SET revision=revision+1 WHERE id=1; END;
CREATE TRIGGER revision_requests_update AFTER UPDATE ON requests BEGIN UPDATE database_revision SET revision=revision+1 WHERE id=1; END;
CREATE TRIGGER revision_requests_delete AFTER DELETE ON requests BEGIN UPDATE database_revision SET revision=revision+1 WHERE id=1; END;
CREATE TRIGGER revision_metrics_insert AFTER INSERT ON metrics BEGIN UPDATE database_revision SET revision=revision+1 WHERE id=1; END;
CREATE TRIGGER revision_metrics_update AFTER UPDATE ON metrics BEGIN UPDATE database_revision SET revision=revision+1 WHERE id=1; END;
CREATE TRIGGER revision_metrics_delete AFTER DELETE ON metrics BEGIN UPDATE database_revision SET revision=revision+1 WHERE id=1; END;
CREATE TRIGGER revision_tips_insert AFTER INSERT ON tips BEGIN UPDATE database_revision SET revision=revision+1 WHERE id=1; END;
CREATE TRIGGER revision_tips_update AFTER UPDATE ON tips BEGIN UPDATE database_revision SET revision=revision+1 WHERE id=1; END;
CREATE TRIGGER revision_tips_delete AFTER DELETE ON tips BEGIN UPDATE database_revision SET revision=revision+1 WHERE id=1; END;
CREATE TRIGGER revision_settings_insert AFTER INSERT ON settings WHEN NEW.key IN ('links','active_session','site_content') BEGIN UPDATE database_revision SET revision=revision+1 WHERE id=1; END;
CREATE TRIGGER revision_settings_update AFTER UPDATE ON settings WHEN NEW.key IN ('links','active_session','site_content') BEGIN UPDATE database_revision SET revision=revision+1 WHERE id=1; END;
CREATE TRIGGER revision_settings_delete AFTER DELETE ON settings WHEN OLD.key IN ('links','active_session','site_content') BEGIN UPDATE database_revision SET revision=revision+1 WHERE id=1; END;
