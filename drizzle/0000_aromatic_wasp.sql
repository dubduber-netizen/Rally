CREATE TABLE `rank_matches` (
	`id` text PRIMARY KEY NOT NULL,
	`host` text NOT NULL,
	`guest` text NOT NULL,
	`host_rating` integer NOT NULL,
	`guest_rating` integer NOT NULL,
	`room` text,
	`status` text DEFAULT 'waiting' NOT NULL,
	`created` integer NOT NULL,
	`host_seen` integer NOT NULL,
	`guest_seen` integer NOT NULL,
	`host_started` integer DEFAULT 0 NOT NULL,
	`guest_started` integer DEFAULT 0 NOT NULL,
	`host_report` integer,
	`guest_report` integer,
	`winner` integer,
	`delta` integer,
	`reason` text
);
--> statement-breakpoint
CREATE TABLE `rank_players` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`rating` integer DEFAULT 1000 NOT NULL,
	`wins` integer DEFAULT 0 NOT NULL,
	`losses` integer DEFAULT 0 NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `rank_queue` (
	`player` text PRIMARY KEY NOT NULL,
	`entered` integer NOT NULL,
	`seen` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `rank_queue_seen` ON `rank_queue` (`seen`);--> statement-breakpoint
CREATE TABLE `rank_seats` (
	`player` text PRIMARY KEY NOT NULL,
	`match` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `rank_seats_match` ON `rank_seats` (`match`);