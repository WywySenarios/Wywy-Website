CREATE TABLE IF NOT EXISTS `geolocation_fixes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`latitude` real NOT NULL,
	`longitude` real NOT NULL,
	`accuracy` real,
	`altitude` real,
	`altitude_accuracy` real,
	`speed` real,
	`heading` real,
	`timestamp` integer NOT NULL,
	`captured_at` integer NOT NULL,
	`forwarded_at` integer,
	`retry_count` integer DEFAULT 0 NOT NULL
);
