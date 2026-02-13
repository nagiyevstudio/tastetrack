-- MySQL Database Schema
-- Import this into your MySQL database (e.g. using phpMyAdmin)

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

CREATE TABLE IF NOT EXISTS `categories` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` text NOT NULL,
  `icon` text NOT NULL,
  `sort_order` int(11) DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `categories` (`id`, `name`, `icon`, `sort_order`) VALUES
(1, 'Dairy', '🥛', 0),
(2, 'Meat & Sausage', '🥩', 0),
(3, 'Fish & Seafood', '🐟', 0),
(4, 'Bread & Bakery', '🍞', 0),
(5, 'Fruits & Vegetables', '🥗', 0),
(6, 'Grains & Pasta', '🌾', 0),
(7, 'Sweets & Snacks', '🍫', 0),
(8, 'Drinks', '🥤', 0),
(9, 'Ready Meals', '🍱', 0);

CREATE TABLE IF NOT EXISTS `products` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `barcode` varchar(255) NOT NULL,
  `name` text NOT NULL,
  `category_id` bigint(20) NOT NULL,
  `photo` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `barcode` (`barcode`),
  KEY `category_id` (`category_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `product_records` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `product_id` int(11) NOT NULL,
  `rating` int(11) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `notes` text DEFAULT NULL,
  `record_date` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `product_id` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE `product_records`
  ADD CONSTRAINT `product_records_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

-- Single-password auth config (no user system).
-- Store SHA256(password + pepper-from-backend-config.php) in password_hash.
CREATE TABLE IF NOT EXISTS `app_auth` (
  `id` tinyint(1) NOT NULL DEFAULT 1,
  `password_hash` char(64) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `app_auth` (`id`, `password_hash`)
VALUES (1, NULL)
ON DUPLICATE KEY UPDATE `id` = `id`;
