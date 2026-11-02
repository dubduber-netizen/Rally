CREATE TABLE `relay_matches` (
	`id` text PRIMARY KEY NOT NULL,
	`host` text NOT NULL,
	`guest` text NOT NULL,
	`host_data` text,
	`guest_data` text,
	`host_seq` integer DEFAULT 0 NOT NULL,
	`guest_seq` integer DEFAULT 0 NOT NULL,
	`host_seen` integer DEFAULT 0 NOT NULL,
	`guest_seen` integer DEFAULT 0 NOT NULL,
	`expires` integer NOT NULL
);
