CREATE TABLE `draft_orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`status` text DEFAULT 'pendiente' NOT NULL,
	`items_json` text NOT NULL,
	`total` real DEFAULT 0 NOT NULL,
	`device_name` text,
	`created_at` text DEFAULT (datetime('now','localtime')) NOT NULL
);
--> statement-breakpoint
ALTER TABLE `sales` ADD `audit_image_path` text;--> statement-breakpoint
ALTER TABLE `sales` ADD `afip_invoice_type` integer;--> statement-breakpoint
ALTER TABLE `sales` ADD `afip_invoice_number` text;--> statement-breakpoint
ALTER TABLE `sales` ADD `afip_cae` text;--> statement-breakpoint
ALTER TABLE `sales` ADD `afip_cae_expiration` text;--> statement-breakpoint
ALTER TABLE `sales` ADD `afip_doc_type` integer;--> statement-breakpoint
ALTER TABLE `sales` ADD `afip_doc_number` text;