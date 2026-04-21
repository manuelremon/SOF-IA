CREATE TABLE `app_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` text DEFAULT (datetime('now','localtime')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer,
	`entity_type` text NOT NULL,
	`entity_id` integer NOT NULL,
	`action` text NOT NULL,
	`old_value` text,
	`new_value` text,
	`notes` text,
	`created_at` text DEFAULT (datetime('now','localtime')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `businesses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`industry` text,
	`logo_path` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (datetime('now','localtime')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now','localtime')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `cash_movements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`register_id` integer,
	`type` text NOT NULL,
	`amount` real NOT NULL,
	`description` text,
	`created_at` text DEFAULT (datetime('now','localtime')) NOT NULL,
	FOREIGN KEY (`register_id`) REFERENCES `cash_registers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `cash_registers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer,
	`opened_at` text DEFAULT (datetime('now','localtime')) NOT NULL,
	`closed_at` text,
	`opening_amount` real DEFAULT 0 NOT NULL,
	`closing_amount` real,
	`expected_amount` real,
	`difference` real,
	`cash_sales` real DEFAULT 0 NOT NULL,
	`card_sales` real DEFAULT 0 NOT NULL,
	`transfer_sales` real DEFAULT 0 NOT NULL,
	`total_sales` real DEFAULT 0 NOT NULL,
	`sales_count` integer DEFAULT 0 NOT NULL,
	`notes` text,
	`status` text DEFAULT 'abierta' NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`color` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (datetime('now','localtime')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `customer_account_movements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`customer_account_id` integer NOT NULL,
	`sale_id` integer,
	`type` text NOT NULL,
	`amount` real NOT NULL,
	`description` text,
	`created_at` text DEFAULT (datetime('now','localtime')) NOT NULL,
	FOREIGN KEY (`customer_account_id`) REFERENCES `customer_accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`sale_id`) REFERENCES `sales`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `customer_accounts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`customer_id` integer NOT NULL,
	`balance` real DEFAULT 0 NOT NULL,
	`credit_limit` real DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (datetime('now','localtime')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now','localtime')) NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `customer_accounts_customer_id_unique` ON `customer_accounts` (`customer_id`);--> statement-breakpoint
CREATE TABLE `customers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`phone` text,
	`email` text,
	`address` text,
	`notes` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (datetime('now','localtime')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now','localtime')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `draft_orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`status` text DEFAULT 'pendiente' NOT NULL,
	`items_json` text NOT NULL,
	`total` real DEFAULT 0 NOT NULL,
	`device_name` text,
	`created_at` text DEFAULT (datetime('now','localtime')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `goods_receipt_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`goods_receipt_id` integer NOT NULL,
	`purchase_order_item_id` integer NOT NULL,
	`product_id` integer NOT NULL,
	`quantity_received` real NOT NULL,
	`unit_cost` real,
	`expiration_date` text,
	FOREIGN KEY (`goods_receipt_id`) REFERENCES `goods_receipts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`purchase_order_item_id`) REFERENCES `purchase_order_items`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `goods_receipts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`purchase_order_id` integer NOT NULL,
	`user_id` integer,
	`receipt_number` text NOT NULL,
	`supplier_remito` text,
	`supplier_invoice` text,
	`total_amount` real,
	`payment_method` text,
	`notes` text,
	`created_at` text DEFAULT (datetime('now','localtime')) NOT NULL,
	FOREIGN KEY (`purchase_order_id`) REFERENCES `purchase_orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`category_id` integer,
	`name` text NOT NULL,
	`description` text,
	`brand` text,
	`presentation` text,
	`barcode` text,
	`sku` text,
	`cost_price` real DEFAULT 0 NOT NULL,
	`sale_price` real DEFAULT 0 NOT NULL,
	`stock` real DEFAULT 0 NOT NULL,
	`min_stock` real DEFAULT 0 NOT NULL,
	`unit` text DEFAULT 'unidad' NOT NULL,
	`image_path` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (datetime('now','localtime')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now','localtime')) NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `purchase_order_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`purchase_order_id` integer NOT NULL,
	`product_id` integer NOT NULL,
	`product_name` text NOT NULL,
	`quantity_ordered` real NOT NULL,
	`quantity_received` real DEFAULT 0 NOT NULL,
	`unit_cost` real NOT NULL,
	`line_total` real NOT NULL,
	FOREIGN KEY (`purchase_order_id`) REFERENCES `purchase_orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `purchase_orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`supplier_id` integer NOT NULL,
	`user_id` integer,
	`order_number` text NOT NULL,
	`status` text DEFAULT 'borrador' NOT NULL,
	`order_date` text DEFAULT (date('now','localtime')) NOT NULL,
	`expected_date` text,
	`subtotal` real DEFAULT 0 NOT NULL,
	`notes` text,
	`created_at` text DEFAULT (datetime('now','localtime')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now','localtime')) NOT NULL,
	FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sale_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`sale_id` integer NOT NULL,
	`product_id` integer NOT NULL,
	`product_name` text NOT NULL,
	`quantity` real NOT NULL,
	`unit_price` real NOT NULL,
	`discount_type` text,
	`discount_value` real DEFAULT 0 NOT NULL,
	`discount_total` real DEFAULT 0 NOT NULL,
	`line_total` real NOT NULL,
	FOREIGN KEY (`sale_id`) REFERENCES `sales`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sales` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`customer_id` integer,
	`user_id` integer,
	`receipt_number` text NOT NULL,
	`subtotal` real DEFAULT 0 NOT NULL,
	`tax_total` real DEFAULT 0 NOT NULL,
	`discount_type` text,
	`discount_value` real DEFAULT 0 NOT NULL,
	`discount_total` real DEFAULT 0 NOT NULL,
	`total` real DEFAULT 0 NOT NULL,
	`amount_tendered` real DEFAULT 0 NOT NULL,
	`change` real DEFAULT 0 NOT NULL,
	`payment_method` text DEFAULT 'efectivo' NOT NULL,
	`status` text DEFAULT 'completada' NOT NULL,
	`notes` text,
	`audit_image_path` text,
	`afip_invoice_type` integer,
	`afip_invoice_number` text,
	`afip_cae` text,
	`afip_cae_expiration` text,
	`afip_doc_type` integer,
	`afip_doc_number` text,
	`created_at` text DEFAULT (datetime('now','localtime')) NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `supplier_products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`supplier_id` integer NOT NULL,
	`product_id` integer NOT NULL,
	`supplier_code` text,
	`supplier_price` real DEFAULT 0 NOT NULL,
	`notes` text,
	`created_at` text DEFAULT (datetime('now','localtime')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now','localtime')) NOT NULL,
	FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `suppliers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`cuit` text,
	`phone` text,
	`email` text,
	`address` text,
	`notes` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (datetime('now','localtime')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now','localtime')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user_businesses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`business_id` integer NOT NULL,
	`created_at` text DEFAULT (datetime('now','localtime')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`pin` text NOT NULL,
	`role` text DEFAULT 'vendedor' NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (datetime('now','localtime')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now','localtime')) NOT NULL
);
