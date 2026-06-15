-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Jun 15, 2026 at 10:49 AM
-- Server version: 10.4.28-MariaDB
-- PHP Version: 8.2.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `quan_ly_gym`
--

-- --------------------------------------------------------

--
-- Table structure for table `audit_logs`
--

CREATE TABLE `audit_logs` (
  `id` bigint(20) NOT NULL,
  `actor_id` int(11) DEFAULT NULL,
  `actor_name` varchar(100) DEFAULT NULL,
  `actor_role` varchar(20) DEFAULT NULL,
  `action` varchar(80) NOT NULL,
  `entity_type` varchar(80) NOT NULL,
  `entity_id` varchar(80) DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `ip_address` varchar(64) DEFAULT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `audit_logs`
--

INSERT INTO `audit_logs` (`id`, `actor_id`, `actor_name`, `actor_role`, `action`, `entity_type`, `entity_id`, `metadata`, `ip_address`, `user_agent`, `created_at`) VALUES
(1, 4, 'Quản trị viên', 'admin', 'pt_session.deduct', 'registration', '58', '{\"member_id\":26,\"trainer_id\":null,\"note\":\"Hoàn thành buổi tập\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-05-14 10:41:12'),
(2, 4, 'Quản trị viên', 'admin', 'invoice.confirm_payment', 'registration', '73', '{\"payment_method\":\"Chuyển khoản\",\"product_count\":2}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-05-26 15:16:58'),
(3, 18, 'staff', 'staff', 'member.delete', 'member', '30', NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-05-26 15:27:48'),
(4, 18, 'staff', 'staff', 'invoice.cancel', 'registration', '74', '{\"discount_code_id\":null}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-05-28 09:47:38'),
(5, 4, 'Quản trị viên', 'admin', 'settings.update', 'system_settings', 'global', '{\"changed_fields\":[\"gym_name\"]}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-06-01 14:20:05'),
(6, 4, 'Quản trị viên', 'admin', 'settings.update', 'system_settings', 'global', '{\"changed_fields\":[\"gym_name\",\"address\"]}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-06-01 14:20:54'),
(7, 4, 'Quản trị viên', 'admin', 'settings.update', 'system_settings', 'global', '{\"changed_fields\":[\"map_embed_url\"]}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-06-01 14:22:20'),
(8, 4, 'Quản trị viên', 'admin', 'settings.update', 'system_settings', 'global', '{\"changed_fields\":[\"bank_account\"]}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-06-02 13:37:50'),
(9, 4, 'Quản trị viên', 'admin', 'invoice.create', 'registration', '75', '{\"member_id\":26,\"discount_code_id\":null,\"product_count\":1}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-06-02 13:38:03'),
(10, 4, 'Quản trị viên', 'admin', 'invoice.confirm_payment', 'registration', '75', '{\"payment_method\":\"Chuyển khoản\",\"product_count\":1}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-06-02 13:39:04'),
(11, 4, 'Quản trị viên', 'admin', 'package.create', 'package', '6', '{\"package_name\":\"Gói Test\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-06-02 13:40:39'),
(12, 4, 'Quản trị viên', 'admin', 'package.delete', 'package', '6', NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-06-02 13:40:54'),
(13, 4, 'Quản trị viên', 'admin', 'checkin.create', 'checkin', '25', '{\"member_id\":3}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-06-02 13:54:20'),
(14, 4, 'Quản trị viên', 'admin', 'checkin.checkout', 'checkin', '25', NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-06-02 13:55:41'),
(15, 4, 'Quản trị viên', 'admin', 'checkin.create', 'checkin', '26', '{\"member_id\":3}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-06-02 13:55:47'),
(16, 4, 'Quản trị viên', 'admin', 'checkin.checkout', 'checkin', '26', NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-06-02 13:55:52'),
(17, 18, 'staff', 'staff', 'invoice.create', 'registration', '76', '{\"member_id\":null,\"discount_code_id\":null,\"product_count\":1}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-06-02 14:16:53'),
(18, 18, 'staff', 'staff', 'invoice.auto_confirm_payment', 'registration', '76', '{\"payment_method\":\"Chuyển khoản tự động\",\"transaction_id\":\"MOCK-1780384631352-4076a293\",\"product_count\":1}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-06-02 14:17:11'),
(19, 4, 'Quản trị viên', 'admin', 'invoice.create', 'registration', '77', '{\"member_id\":null,\"discount_code_id\":null,\"product_count\":1}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-06-02 14:20:41'),
(20, 4, 'Quản trị viên', 'admin', 'invoice.auto_confirm_payment', 'registration', '77', '{\"payment_method\":\"Chuyển khoản tự động\",\"transaction_id\":\"MOCK-1780385030917-b3c1e69b\",\"product_count\":1}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-06-02 14:23:50'),
(21, 1, 'Nguyễn Văn A', 'member', 'booking.create', 'booking', '23', '{\"member_id\":1,\"trainer_id\":null,\"start_time\":\"2026-06-02 14:30:00\",\"end_time\":\"2026-06-02 16:30:00\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-06-02 14:29:09'),
(22, 1, 'Nguyễn Văn A', 'member', 'invoice.self_service_create', 'registration', '78', '{\"member_id\":1,\"package_id\":1,\"package_name\":\"Gói 1 Tháng Cơ Bản\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-06-02 15:02:11'),
(23, 1, 'Nguyễn Văn A', 'member', 'invoice.cancel', 'registration', '78', NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-06-02 15:09:54'),
(24, 1, 'Nguyễn Văn A', 'member', 'invoice.self_service_create', 'registration', '79', '{\"member_id\":1,\"package_id\":2,\"package_name\":\"Gói 3 Tháng Tiết Kiệm\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-06-02 15:09:57'),
(25, 1, 'Nguyễn Văn A', 'member', 'invoice.cancel', 'registration', '79', NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-06-02 15:15:28'),
(26, 1, 'Nguyễn Văn A', 'member', 'invoice.self_service_create', 'registration', '80', '{\"member_id\":1,\"package_id\":2,\"package_name\":\"Gói 3 Tháng Tiết Kiệm\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-06-02 15:15:51'),
(27, 1, 'Nguyễn Văn A', 'member', 'invoice.auto_confirm_payment', 'registration', '80', '{\"payment_method\":\"Chuyển khoản tự động\",\"transaction_id\":\"MOCK-1780388156656-58e33f96\",\"product_count\":0}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-06-02 15:15:56'),
(28, 10, 'Trần H', 'member', 'invoice.self_service_create', 'registration', '81', '{\"member_id\":10,\"package_id\":2,\"package_name\":\"Gói 3 Tháng Tiết Kiệm\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-06-02 15:29:02'),
(29, 10, 'Trần H', 'member', 'invoice.auto_confirm_payment', 'registration', '81', '{\"payment_method\":\"Chuyển khoản tự động\",\"transaction_id\":\"MOCK-1780388972361-e62574bf\",\"product_count\":0}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-06-02 15:29:32'),
(30, 2, 'Trần Thị B', 'member', 'invoice.self_service_create', 'registration', '82', '{\"member_id\":2,\"package_id\":2,\"package_name\":\"Gói 3 Tháng Tiết Kiệm\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-06-04 08:57:21'),
(31, 2, 'Trần Thị B', 'member', 'invoice.auto_confirm_payment', 'registration', '82', '{\"payment_method\":\"MoMo\",\"transaction_id\":\"MOCK-1780540010403-53e03713\",\"product_count\":0}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-06-04 09:26:50'),
(32, 9, 'Mạc I', 'member', 'invoice.self_service_create', 'registration', '83', '{\"member_id\":9,\"package_id\":1,\"package_name\":\"Gói 1 Tháng Cơ Bản\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-06-04 10:05:50'),
(33, 9, 'Mạc I', 'member', 'invoice.cancel', 'registration', '83', NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-06-04 10:06:51'),
(34, 9, 'Mạc I', 'member', 'invoice.self_service_create', 'registration', '84', '{\"member_id\":9,\"package_id\":3,\"package_name\":\"Gói 6 Tháng VIP\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-06-04 10:06:55'),
(35, 9, 'Mạc I', 'member', 'invoice.cancel', 'registration', '84', NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-06-04 10:07:07'),
(36, 9, 'Mạc I', 'member', 'invoice.self_service_create', 'registration', '85', '{\"member_id\":9,\"package_id\":1,\"package_name\":\"Gói 1 Tháng Cơ Bản\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-06-04 10:07:48'),
(37, 9, 'Mạc I', 'member', 'invoice.cancel', 'registration', '85', NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-06-04 10:11:03'),
(38, 9, 'Mạc I', 'member', 'invoice.self_service_create', 'registration', '86', '{\"member_id\":9,\"package_id\":2,\"package_name\":\"Gói 3 Tháng Tiết Kiệm\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-06-04 10:11:07'),
(39, 9, 'Mạc I', 'member', 'invoice.cancel', 'registration', '86', NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-06-04 10:24:31'),
(40, 9, 'Mạc I', 'member', 'invoice.self_service_create', 'registration', '87', '{\"member_id\":9,\"package_id\":3,\"package_name\":\"Gói 6 Tháng VIP\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-06-04 10:24:34'),
(41, 9, 'Mạc I', 'member', 'invoice.cancel', 'registration', '87', NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-06-04 10:27:01'),
(42, 4, 'Quản trị viên', 'admin', 'invoice.create', 'registration', '88', '{\"member_id\":null,\"discount_code_id\":null,\"product_count\":1}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-06-04 10:27:33'),
(43, 4, 'Quản trị viên', 'admin', 'member.update', 'member', '26', '{\"fullname\":\"Lương Chí Dũng\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-06-04 10:32:52'),
(44, 4, 'Quản trị viên', 'admin', 'membership.reminder', 'registration', '68', '{\"fullname\":\"Lương Chí Dũng\",\"package_name\":\"Gói 1 Tháng Cơ Bản\",\"expiration_date\":\"11/6/2026\",\"email\":\"trankhai132905@gmail.com\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-06-04 10:33:04'),
(45, 13, 'Như Hoa', 'member', 'invoice.self_service_create', 'registration', '89', '{\"member_id\":13,\"package_id\":2,\"package_name\":\"Gói 3 Tháng Tiết Kiệm\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-06-04 10:39:59'),
(46, 13, 'Như Hoa', 'member', 'invoice.cancel', 'registration', '89', NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-06-04 10:41:52'),
(47, 13, 'Như Hoa', 'member', 'invoice.self_service_create', 'registration', '90', '{\"member_id\":13,\"package_id\":3,\"package_name\":\"Gói 6 Tháng VIP\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-06-04 11:18:53'),
(48, 13, 'Như Hoa', 'member', 'invoice.auto_confirm_payment', 'registration', '90', '{\"payment_method\":\"MoMo\",\"transaction_id\":\"MOCK-1780546747318-758c7b82\",\"product_count\":0}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-06-04 11:19:07'),
(49, 4, 'Quản trị viên', 'admin', 'invoice.cancel', 'registration', '88', '{\"discount_code_id\":null}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-06-04 11:19:31'),
(50, 4, 'Quản trị viên', 'admin', 'invoice.create', 'registration', '91', '{\"member_id\":null,\"discount_code_id\":null,\"product_count\":1}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-06-04 11:20:51'),
(51, 4, 'Quản trị viên', 'admin', 'invoice.cancel', 'registration', '91', '{\"discount_code_id\":null}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-06-04 11:27:27'),
(52, 4, 'Quản trị viên', 'admin', 'invoice.create', 'registration', '92', '{\"member_id\":null,\"discount_code_id\":null,\"product_count\":1}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-06-04 11:27:30'),
(53, 4, 'Quản trị viên', 'admin', 'invoice.cancel', 'registration', '92', '{\"discount_code_id\":null}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-06-04 11:27:34'),
(54, 4, 'Quản trị viên', 'admin', 'invoice.create', 'registration', '93', '{\"member_id\":null,\"discount_code_id\":null,\"product_count\":1}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-06-04 11:51:27'),
(55, 4, 'Quản trị viên', 'admin', 'invoice.cancel', 'registration', '93', '{\"discount_code_id\":null}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-06-04 11:52:14'),
(56, 3, 'Trần Văn Khải', 'member', 'booking.create', 'booking', '24', '{\"member_id\":3,\"trainer_id\":4,\"start_time\":\"2026-06-08 15:00:00\",\"end_time\":\"2026-06-08 16:30:00\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-06-08 14:34:09'),
(57, 31, 'Nguyễn Nguyên', 'member', 'invoice.self_service_create', 'registration', '94', '{\"member_id\":31,\"package_id\":1,\"package_name\":\"Gói 1 Tháng Cơ Bản\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-06-08 14:35:28'),
(58, 4, 'Quản trị viên', 'admin', 'invoice.create', 'registration', '95', '{\"member_id\":null,\"discount_code_id\":null,\"product_count\":1}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-06-08 14:38:03'),
(59, 4, 'Quản trị viên', 'admin', 'product.update', 'product', '5', '{\"product_name\":\"Test\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-06-08 15:08:49'),
(60, 4, 'Quản trị viên', 'admin', 'invoice.create', 'registration', '96', '{\"member_id\":null,\"discount_code_id\":null,\"product_count\":1}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-06-08 15:08:56'),
(61, 4, 'Quản trị viên', 'admin', 'invoice.create', 'registration', '97', '{\"member_id\":null,\"discount_code_id\":null,\"product_count\":1}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-06-08 15:20:53'),
(62, 4, 'Quản trị viên', 'admin', 'invoice.create', 'registration', '98', '{\"member_id\":null,\"discount_code_id\":null,\"product_count\":1}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-06-08 15:21:58'),
(63, 4, 'Quản trị viên', 'admin', 'invoice.create', 'registration', '99', '{\"member_id\":null,\"discount_code_id\":null,\"product_count\":1}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-06-08 15:22:12'),
(64, 4, 'Quản trị viên', 'admin', 'invoice.create', 'registration', '100', '{\"member_id\":null,\"discount_code_id\":null,\"product_count\":1}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-06-08 15:30:59'),
(65, 32, 'Tân', 'member', 'invoice.self_service_create', 'registration', '101', '{\"member_id\":32,\"package_id\":5,\"package_name\":\"Gói 12 tháng \"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-06-08 15:34:48'),
(66, 4, 'Quản trị viên', 'admin', 'invoice.create', 'registration', '102', '{\"member_id\":null,\"discount_code_id\":null,\"product_count\":1}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-06-08 16:16:10'),
(67, 4, 'Quản trị viên', 'admin', 'invoice.cancel', 'registration', '103', '{\"discount_code_id\":null}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-06-09 14:36:19'),
(68, 4, 'Quản trị viên', 'admin', 'invoice.cancel', 'registration', '102', '{\"discount_code_id\":null}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-06-09 14:36:31'),
(69, 32, 'Tân', 'member', 'membership.cancel_checkout', 'registration', '101', NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-06-09 14:51:24'),
(70, 32, 'Tân', 'member', 'membership.self_register', 'registration', '104', '{\"package_id\":1}', '115.79.137.96', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-06-09 15:44:50'),
(71, 4, 'Quản trị viên', 'admin', 'invoice.cancel', 'registration', '105', '{\"discount_code_id\":null}', '203.205.26.141', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-06-09 15:46:21'),
(72, 4, 'Quản trị viên', 'admin', 'invoice.cancel', 'registration', '104', '{\"discount_code_id\":null}', '203.205.26.141', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-06-09 15:46:24'),
(73, 32, 'Tân', 'member', 'membership.self_register', 'registration', '106', '{\"package_id\":1}', '203.205.26.141', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-06-09 15:46:39'),
(74, 33, 'Tạ Tốn', 'member', 'membership.self_register', 'registration', '107', '{\"package_id\":1}', '115.79.138.76', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-06-09 16:00:37'),
(75, 34, 'Lò Rèn', 'member', 'membership.self_register', 'registration', '109', '{\"package_id\":1}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-06-09 16:09:32'),
(76, 4, 'Quản trị viên', 'admin', 'invoice.cancel', 'registration', '109', '{\"discount_code_id\":null}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-06-09 16:10:14'),
(77, 34, 'Lò Rèn', 'member', 'membership.self_register', 'registration', '111', '{\"package_id\":1}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-06-09 16:19:39'),
(78, 4, 'Quản trị viên', 'admin', 'invoice.confirm_payment', 'registration', '114', '{\"payment_method\":\"Tiền mặt\",\"product_count\":1}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-06-09 16:27:56'),
(79, 36, 'đại', 'member', 'membership.self_register', 'registration', '118', '{\"package_id\":1}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-06-11 10:08:28'),
(80, 18, 'staff', 'staff', 'invoice.cancel', 'registration', '119', '{\"discount_code_id\":null}', '203.205.32.58', 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_7_16 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6.2 Mobile/15E148 Safari/604.1', '2026-06-11 10:14:43'),
(81, 3, 'Trần Văn Khải', 'member', 'membership.upgrade_register', 'registration', '120', '{\"from_registration_id\":55,\"from_package_id\":2,\"to_package_id\":5,\"credit_amount\":623077,\"amount_due\":3876923}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-06-11 11:06:25'),
(82, 3, 'Trần Văn Khải', 'member', 'membership.cancel_checkout', 'registration', '120', NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-06-11 11:06:53'),
(83, 33, 'Tạ Tốn', 'member', 'membership.upgrade_register', 'registration', '121', '{\"from_registration_id\":107,\"from_package_id\":1,\"to_package_id\":2,\"credit_amount\":9333,\"amount_due\":1340667}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-06-11 11:26:13'),
(84, 33, 'Tạ Tốn', 'member', 'membership.cancel_checkout', 'registration', '121', NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-06-11 11:27:41'),
(85, 33, 'Tạ Tốn', 'member', 'membership.upgrade_register', 'registration', '122', '{\"from_registration_id\":107,\"from_package_id\":1,\"to_package_id\":3,\"credit_amount\":9333,\"amount_due\":2490667}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-06-11 11:27:51'),
(86, 33, 'Tạ Tốn', 'member', 'membership.cancel_checkout', 'registration', '122', NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-06-11 11:28:18'),
(87, 33, 'Tạ Tốn', 'member', 'membership.upgrade_register', 'registration', '123', '{\"from_registration_id\":107,\"from_package_id\":1,\"to_package_id\":2,\"credit_amount\":9333,\"amount_due\":1340667}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-06-11 11:31:03'),
(88, 3, 'Trần Văn Khải', 'member', 'membership.upgrade_register', 'registration', '124', '{\"from_registration_id\":55,\"from_package_id\":2,\"to_package_id\":3,\"credit_amount\":623077,\"amount_due\":1876923}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-06-11 11:33:29'),
(89, 3, 'Trần Văn Khải', 'member', 'membership.cancel_checkout', 'registration', '124', NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-06-11 11:35:37'),
(90, 3, 'Trần Văn Khải', 'member', 'membership.upgrade_register', 'registration', '125', '{\"from_registration_id\":55,\"from_package_id\":2,\"to_package_id\":5,\"credit_amount\":623077,\"amount_due\":3876923}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-06-11 11:35:58'),
(91, 3, 'Trần Văn Khải', 'member', 'membership.cancel_checkout', 'registration', '125', NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-06-11 11:36:27'),
(92, 4, 'Quản trị viên', 'admin', 'invoice.cancel', 'registration', '126', '{\"discount_code_id\":null}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-06-15 15:11:44');

-- --------------------------------------------------------

--
-- Table structure for table `bank_transactions`
--

CREATE TABLE `bank_transactions` (
  `id` bigint(20) NOT NULL,
  `provider` varchar(30) NOT NULL,
  `transaction_id` varchar(120) NOT NULL,
  `registration_id` int(11) DEFAULT NULL,
  `amount` decimal(12,2) NOT NULL,
  `transfer_content` varchar(255) DEFAULT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'received',
  `raw_payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`raw_payload`)),
  `received_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `bank_transactions`
--

INSERT INTO `bank_transactions` (`id`, `provider`, `transaction_id`, `registration_id`, `amount`, `transfer_content`, `status`, `raw_payload`, `received_at`) VALUES
(1, 'mock', 'MOCK-1780384631352-4076a293', 76, 1850000.00, 'GYMBRO 76', 'paid', '{\"provider\":\"mock\",\"transactionId\":\"MOCK-1780384631352-4076a293\",\"amount\":1850000,\"transferContent\":\"GYMBRO 76\"}', '2026-06-02 14:17:11'),
(2, 'mock', 'MOCK-1780385030917-b3c1e69b', 77, 170000.00, 'GYMBRO 77', 'paid', '{\"provider\":\"mock\",\"transactionId\":\"MOCK-1780385030917-b3c1e69b\",\"amount\":170000,\"transferContent\":\"GYMBRO 77\"}', '2026-06-02 14:23:50'),
(3, 'mock', 'MOCK-1780388156656-58e33f96', 80, 1350000.00, 'GYMBRO 80', 'paid', '{\"provider\":\"mock\",\"transactionId\":\"MOCK-1780388156656-58e33f96\",\"amount\":1350000,\"transferContent\":\"GYMBRO 80\"}', '2026-06-02 15:15:56'),
(4, 'mock', 'MOCK-1780388972361-e62574bf', 81, 1350000.00, 'GYMBRO 81', 'paid', '{\"provider\":\"mock\",\"transactionId\":\"MOCK-1780388972361-e62574bf\",\"amount\":1350000,\"transferContent\":\"GYMBRO 81\"}', '2026-06-02 15:29:32'),
(5, 'mock', 'MOCK-1780540010403-53e03713', 82, 1350000.00, 'GYMBRO 82', 'paid', '{\"provider\":\"mock\",\"transactionId\":\"MOCK-1780540010403-53e03713\",\"amount\":1350000,\"transferContent\":\"GYMBRO 82\",\"paymentMethod\":\"MoMo\"}', '2026-06-04 09:26:50'),
(6, 'mock', 'MOCK-1780546747318-758c7b82', 90, 2500000.00, 'GYMBRO 90', 'paid', '{\"provider\":\"mock\",\"transactionId\":\"MOCK-1780546747318-758c7b82\",\"amount\":2500000,\"transferContent\":\"GYMBRO 90\",\"paymentMethod\":\"MoMo\"}', '2026-06-04 11:19:07');

-- --------------------------------------------------------

--
-- Table structure for table `bookings`
--

CREATE TABLE `bookings` (
  `id` int(11) NOT NULL,
  `member_id` int(11) NOT NULL,
  `trainer_id` int(11) DEFAULT NULL,
  `start_time` datetime NOT NULL,
  `end_time` datetime NOT NULL,
  `title` varchar(120) NOT NULL DEFAULT 'Buổi tập',
  `note` varchar(255) DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'booked',
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `bookings`
--

INSERT INTO `bookings` (`id`, `member_id`, `trainer_id`, `start_time`, `end_time`, `title`, `note`, `status`, `created_at`) VALUES
(1, 3, 5, '2026-05-01 05:00:00', '2026-05-01 08:00:00', 'Buổi tập Ngực', NULL, 'cancelled', '2026-04-30 15:24:27'),
(2, 3, NULL, '2026-05-01 03:30:00', '2026-05-01 04:00:00', 'Buổi tập', NULL, 'cancelled', '2026-04-30 15:24:37'),
(3, 3, NULL, '2026-05-01 03:00:00', '2026-05-01 03:30:00', 'Buổi tập Chân', NULL, 'cancelled', '2026-04-30 15:24:46'),
(4, 3, NULL, '2026-05-02 00:30:00', '2026-05-02 04:30:00', 'Buổi tập Chân', NULL, 'booked', '2026-04-30 15:24:57'),
(5, 3, NULL, '2026-04-30 10:00:00', '2026-04-30 12:00:00', 'Buổi tập', NULL, 'booked', '2026-04-30 15:25:49'),
(6, 3, 4, '2026-05-01 15:30:00', '2026-05-01 17:00:00', 'Buổi tập Tay', NULL, 'booked', '2026-04-30 16:22:39'),
(7, 3, NULL, '2026-05-01 13:08:00', '2026-05-01 15:29:00', 'Buổi tập', NULL, 'booked', '2026-04-30 16:23:49'),
(8, 3, NULL, '2026-04-30 16:25:00', '2026-04-30 17:00:00', 'Buổi tập', NULL, 'booked', '2026-04-30 16:24:14'),
(9, 3, 1, '2026-05-06 11:30:00', '2026-05-06 13:30:00', 'Buổi tập Chân', NULL, 'booked', '2026-05-05 13:27:55'),
(10, 3, NULL, '2026-05-05 13:30:00', '2026-05-05 15:00:00', 'Buổi tập', NULL, 'booked', '2026-05-05 13:28:20'),
(11, 15, 4, '2026-05-07 13:00:00', '2026-05-07 15:00:00', 'Buổi tập', NULL, 'booked', '2026-05-07 08:49:33'),
(12, 3, 5, '2026-05-07 13:00:00', '2026-05-07 15:00:00', 'Buổi tập', NULL, 'cancelled', '2026-05-07 08:50:12'),
(13, 3, 4, '2026-05-07 15:00:00', '2026-05-07 17:00:00', 'Buổi tập', NULL, 'cancelled', '2026-05-07 08:50:34'),
(14, 3, 1, '2026-05-09 15:00:00', '2026-05-09 17:00:00', 'Buổi tập', NULL, 'booked', '2026-05-09 14:21:11'),
(15, 3, NULL, '2026-05-11 07:30:00', '2026-05-11 09:30:00', 'Buổi tập', NULL, 'booked', '2026-05-10 17:24:40'),
(16, 3, 1, '2026-05-12 07:30:00', '2026-05-12 09:30:00', 'Buổi tập Tay', NULL, 'cancelled', '2026-05-10 17:24:53'),
(17, 3, 4, '2026-05-14 07:30:00', '2026-05-14 09:30:00', 'Buổi tập Cardio', NULL, 'booked', '2026-05-10 17:25:17'),
(18, 3, 5, '2026-05-27 07:00:00', '2026-05-27 09:30:00', 'Buổi tập Tay', NULL, 'booked', '2026-05-26 15:44:21'),
(19, 3, NULL, '2026-05-26 16:30:00', '2026-05-26 18:30:00', 'Buổi tập Ngực', NULL, 'cancelled', '2026-05-26 15:44:45'),
(20, 5, NULL, '2026-05-28 10:30:00', '2026-05-28 12:00:00', 'Buổi tập', NULL, 'booked', '2026-05-28 10:22:32'),
(21, 8, 4, '2026-05-28 10:30:00', '2026-05-28 12:30:00', 'Buổi tập', NULL, 'booked', '2026-05-28 10:22:53'),
(22, 26, NULL, '2026-05-28 10:30:00', '2026-05-28 14:30:00', 'Buổi tập', NULL, 'booked', '2026-05-28 10:23:12'),
(23, 1, NULL, '2026-06-02 14:30:00', '2026-06-02 16:30:00', 'Buổi tập', NULL, 'booked', '2026-06-02 14:29:09'),
(24, 3, 4, '2026-06-08 15:00:00', '2026-06-08 16:30:00', 'Buổi tập', NULL, 'booked', '2026-06-08 14:34:09');

-- --------------------------------------------------------

--
-- Table structure for table `checkin_history`
--

CREATE TABLE `checkin_history` (
  `id` int(11) NOT NULL,
  `member_id` int(11) NOT NULL,
  `checkin_time` timestamp NOT NULL DEFAULT current_timestamp(),
  `checkout_time` datetime DEFAULT NULL,
  `status` enum('Success','Expired','Not Found') DEFAULT 'Success',
  `note` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `checkin_history`
--

INSERT INTO `checkin_history` (`id`, `member_id`, `checkin_time`, `checkout_time`, `status`, `note`) VALUES
(1, 3, '2026-04-21 08:54:59', '2026-04-30 15:21:46', 'Success', 'Hợp lệ'),
(2, 3, '2026-04-21 08:55:13', '2026-04-30 15:21:45', 'Success', 'Hợp lệ'),
(3, 3, '2026-04-21 08:58:56', '2026-04-30 15:21:45', 'Success', 'Hợp lệ'),
(4, 3, '2026-04-23 04:11:42', '2026-04-30 15:21:44', 'Success', 'Hợp lệ'),
(6, 3, '2026-04-30 08:22:02', '2026-04-30 15:27:22', 'Success', 'Hợp lệ'),
(7, 26, '2026-04-30 08:22:57', '2026-04-30 15:28:15', 'Success', 'Hợp lệ'),
(8, 3, '2026-04-30 08:27:48', '2026-04-30 15:28:04', 'Success', 'Hợp lệ'),
(9, 3, '2026-04-30 08:28:08', '2026-04-30 15:28:11', 'Success', 'Hợp lệ'),
(10, 3, '2026-04-30 09:24:27', '2026-04-30 22:47:32', 'Success', 'Hợp lệ'),
(11, 3, '2026-05-05 06:25:43', '2026-05-05 13:26:23', 'Success', 'Hợp lệ'),
(12, 26, '2026-05-05 06:25:54', '2026-05-05 13:26:21', 'Success', 'Hợp lệ'),
(13, 3, '2026-05-05 07:16:22', '2026-05-05 15:20:43', 'Success', 'Hợp lệ'),
(14, 26, '2026-05-05 07:16:27', '2026-05-05 15:20:43', 'Success', 'Hợp lệ'),
(15, 3, '2026-05-09 07:13:50', '2026-05-09 14:24:19', 'Success', 'Hợp lệ'),
(16, 3, '2026-05-11 09:02:59', '2026-05-11 20:16:03', 'Success', 'Hợp lệ'),
(17, 3, '2026-05-11 14:45:16', '2026-05-11 21:45:19', 'Success', 'Hợp lệ'),
(18, 26, '2026-05-11 14:45:26', '2026-05-11 21:45:28', 'Success', 'Hợp lệ'),
(19, 3, '2026-05-18 08:25:46', '2026-05-18 15:47:00', 'Success', 'Hợp lệ'),
(20, 3, '2026-05-26 08:10:01', '2026-05-26 16:13:20', 'Success', 'Hợp lệ'),
(21, 26, '2026-05-26 08:10:19', '2026-05-26 16:13:19', 'Success', 'Hợp lệ'),
(22, 8, '2026-05-26 08:10:40', '2026-05-26 16:13:18', 'Success', 'Hợp lệ'),
(23, 14, '2026-05-26 08:11:36', '2026-05-26 16:13:19', 'Success', 'Hợp lệ'),
(24, 21, '2026-05-26 08:12:19', '2026-05-26 16:13:17', 'Success', 'Hợp lệ'),
(25, 3, '2026-06-02 06:54:20', '2026-06-02 13:55:41', 'Success', 'Hợp lệ'),
(26, 3, '2026-06-02 06:55:47', '2026-06-02 13:55:52', 'Success', 'Hợp lệ'),
(27, 36, '2026-06-11 03:13:18', '2026-06-15 15:13:06', 'Success', 'Hợp lệ');

-- --------------------------------------------------------

--
-- Table structure for table `contact_messages`
--

CREATE TABLE `contact_messages` (
  `id` int(11) NOT NULL,
  `fullname` varchar(150) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `subject` varchar(255) DEFAULT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `contact_messages`
--

INSERT INTO `contact_messages` (`id`, `fullname`, `email`, `phone`, `subject`, `message`, `is_read`, `created_at`) VALUES
(3, 'TRAN VAN KHAI', 'khai.2274802010367@vanlanguni.vn', '0866108697', NULL, '123 zuqw', 1, '2026-05-14 09:55:05');

-- --------------------------------------------------------

--
-- Table structure for table `discount_codes`
--

CREATE TABLE `discount_codes` (
  `id` int(11) NOT NULL,
  `code` varchar(40) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `discount_type` enum('percent','fixed') NOT NULL DEFAULT 'percent',
  `discount_value` decimal(12,2) NOT NULL,
  `min_amount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `max_discount` decimal(12,2) DEFAULT NULL,
  `valid_from` date DEFAULT NULL,
  `valid_to` date DEFAULT NULL,
  `usage_limit` int(11) DEFAULT NULL,
  `used_count` int(11) NOT NULL DEFAULT 0,
  `is_birthday` tinyint(1) NOT NULL DEFAULT 0,
  `member_id` int(11) DEFAULT NULL,
  `status` enum('active','disabled') NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `discount_codes`
--

INSERT INTO `discount_codes` (`id`, `code`, `description`, `discount_type`, `discount_value`, `min_amount`, `max_discount`, `valid_from`, `valid_to`, `usage_limit`, `used_count`, `is_birthday`, `member_id`, `status`, `created_at`) VALUES
(5, 'LE30T4', 'Khuyến Mãi ', 'percent', 10.00, 0.00, NULL, '2026-04-30', '2026-05-10', 10, 1, 0, NULL, 'active', '2026-05-10 15:58:14'),
(24, 'BDAY-29-202605', 'Quà sinh nhật tháng 5 cho Thông', 'percent', 15.00, 0.00, NULL, '2026-05-01', '2026-05-31', 1, 0, 1, 29, 'active', '2026-05-12 14:50:29'),
(151, 'TRE18', 'Khuyến Mãi Khách Hàng Trẻ', 'percent', 20.00, 500000.00, NULL, '2026-05-26', NULL, NULL, 0, 0, NULL, 'active', '2026-05-26 15:29:10'),
(184, 'BDAY-3-202606', 'Quà sinh nhật tháng 6 cho Trần Văn Khải', 'percent', 15.00, 0.00, NULL, '2026-06-01', '2026-06-30', 1, 0, 1, 3, 'active', '2026-06-09 14:42:48'),
(190, 'BDAY-32-202606', 'Quà sinh nhật tháng 6 cho Tân', 'percent', 15.00, 0.00, NULL, '2026-06-01', '2026-06-30', 1, 0, 1, 32, 'active', '2026-06-09 14:53:10');

-- --------------------------------------------------------

--
-- Table structure for table `members`
--

CREATE TABLE `members` (
  `id` int(11) NOT NULL,
  `fullname` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(120) DEFAULT NULL,
  `gender` enum('Nam','Nữ','Khác') DEFAULT NULL,
  `join_date` date DEFAULT curdate(),
  `password` varchar(255) DEFAULT '123456',
  `role` enum('admin','member','staff') DEFAULT 'member',
  `address` varchar(255) DEFAULT NULL,
  `cccd` varchar(20) DEFAULT NULL,
  `hometown` varchar(100) DEFAULT NULL,
  `height` float DEFAULT NULL,
  `weight` float DEFAULT NULL,
  `birth_year` int(11) DEFAULT NULL,
  `birth_date` date DEFAULT NULL,
  `avatar_url` varchar(500) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `members`
--

INSERT INTO `members` (`id`, `fullname`, `phone`, `email`, `gender`, `join_date`, `password`, `role`, `address`, `cccd`, `hometown`, `height`, `weight`, `birth_year`, `birth_date`, `avatar_url`) VALUES
(1, 'Nguyễn Văn A', '0123456789', 'trankhai132905@gmail.com', 'Nam', '2026-04-06', '$2b$10$1lxeN45EhK.iSfrwLbIcyeJYxdIUPLeZh5xdScIcPxo19ooGyFRJC', 'member', '31/579', NULL, 'Quy Nhơn', NULL, NULL, NULL, NULL, NULL),
(2, 'Trần Thị B', '0908887776', NULL, 'Nữ', '2026-04-06', '$2b$10$peJ3xdzlH5e/dPvAZufl3.eOyb3suphoZcxy5LptIGx86Wiq7Koem', 'member', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(3, 'Trần Văn Khải', '0866108697', 'trankhai132905@gmail.com', 'Nam', '2026-04-06', '$2b$10$26mIzP398fu4MnRe60g1gOHZevSeAb9cRoTXdr.VTxappkKpJ9.YC', 'member', '69/68 Đặng Thùy Trâm, P. 13, Q. Bình Thạnh, Tp. HCM', '052204007482', 'Quy Nhơn', 170, 92, 2004, '2004-06-11', '/uploads/avatars/54e997ccaaf117224f673cb2e2127db1.jpg'),
(4, 'Quản trị viên', 'admin', NULL, 'Nam', '2026-04-07', '$2b$10$2TtljbTlOaugUSggueBrf.KkehrcqB1/Fab8c5Z7PhjpgBtE2.V16', 'admin', NULL, NULL, NULL, 200, 50, NULL, NULL, NULL),
(5, 'Lê Hoàng C', '0866111225', NULL, 'Nữ', '2026-04-07', '123456', 'member', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(8, 'Hoàng Trung y', '0866111223', NULL, 'Nam', '2026-04-13', '$2b$10$KAvV20PYPnUgUnsivpz4PeC7YfoKW/5rwK/paw2cWcIqTYb8.npWC', 'member', NULL, NULL, NULL, 172, 80, 2000, '2000-01-01', NULL),
(9, 'Mạc I', '0866108694', NULL, 'Nam', '2026-04-14', '$2b$10$yVFS9qDkIBbCPIgGZ4bvgurdDLOcYTAXknJ0SG/nLFfx6pRRBifiy', 'member', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(10, 'Trần H', '0987654216', NULL, 'Nam', '2026-04-14', '$2b$10$W6ae9Ol.FFvX.Q3kqOL3uuXxx//YduS7sTQU0TqPj3om60lPJYK4i', 'member', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(13, 'Như Hoa', '0987654321', NULL, 'Nữ', '2026-04-14', '$2b$10$A1odpMKM0Vx5y4KxMLLEWujL8BwtS39EPD5G1hSvHMmXblUMKjWxa', 'member', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(14, 'Trương M', '0678123494', NULL, 'Nữ', '2026-04-14', '$2b$10$6ynr6qCaJl/S0WQS1Duzb.csGE6sEefA0S7pSqn4X23oRuI41tyqy', 'member', NULL, NULL, NULL, 170, 85, NULL, NULL, NULL),
(15, 'Test', '012345432', NULL, 'Nam', '2026-04-20', '$2b$10$XjSIdVO0fYt7G6nYoZiMXOoVAicklkDjJKOfowBflkhAxzIy8kWMS', 'member', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(17, 'Khaaa', '0389123789', NULL, 'Nam', '2026-04-21', '$2b$10$z//kWNBSGJZr70EWkT5SBuTzmqiZF.LO6yI0B9Aa.Y.O0FvHcE.om', 'member', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(18, 'staff', 'staff', NULL, 'Nam', '2026-04-23', '$2b$10$cR1Jr3B4OHyhYmAXx2RyIeJLwZA/PJuTgVTn9yHh/HlGHa9v.rj5O', 'staff', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(21, 'Lê Kiên', '038765431', NULL, 'Nam', '2026-04-28', '$2b$10$mUUVpkQpaPmGkbPb.lta9.P4quuN96.ndfTFjvX/VdnYwvsarcOc6', 'member', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(26, 'Lương Chí Dũng', '0987656789', 'trankhai132905@gmail.com', 'Nam', '2026-04-30', '$2b$10$6V34keaFqxEg8N24XHklV.XhX/HOA1hg58wEgs7v8PL/AVbYs2fU6', 'member', '31/579', NULL, 'Quy Nhơn', NULL, NULL, NULL, NULL, NULL),
(28, 'Kiên', '0866103123', 'bikute734@gmail.com', 'Nam', '2026-05-11', '$2b$10$QFzV.zNi6X210uLRnkJo5.8BMEldVngy/7Ux7SIZiu8e0a34vZF1m', 'member', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(29, 'Thông', '0783709530', 'thongnguyen17082002@gmail.com', 'Nam', '2026-05-12', '$2b$10$0tA57eQ1.fnMEnLabsZzJuxkiOjplehaLBWvEvG8F0YoWEhCjzoKq', 'member', NULL, NULL, NULL, NULL, NULL, 2026, '2026-05-07', NULL),
(31, 'Nguyễn Nguyên', '0866198697', 'nguyennguyen@gmail.com', 'Nam', '2026-06-08', '$2b$10$8fixqm81Nm6b0ut6.f6cIuNiSYylf2ei2btFtIzRad73FxMKNl2o6', 'member', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(32, 'Tân', '0866108691', 'trankhai132905@gmail.com', 'Nam', '2026-06-08', '$2b$10$X0Ap.PWfVOtFp/0sHkhyJOKWSMaObFc0DZ57qlQVtQk2WtX9avkTe', 'member', NULL, NULL, NULL, NULL, NULL, 2000, '2000-06-11', NULL),
(33, 'Tạ Tốn', '0866108692', 'trankhai132905@gmail.com', 'Nữ', '2026-06-09', '$2b$10$mFGkXr4R8XIHipn6mmsVheUcTGEmMhZR7yI2BgeXvAx6gbJzItV4u', 'member', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(34, 'Lò Rèn', '0866108693', 'trankhai132905@gmail.com', 'Nữ', '2026-06-09', '$2b$10$cK.U53dBraLskLyAwcDf6O2zm3vl/C5LB.7zhz8MqSId6/3gmqoyq', 'member', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(36, 'đại', '0866108695', 'nguyennguyen@gmail.com', 'Nam', '2026-06-11', '$2b$10$ZcLr9ms3gpDGa8JDTk1HYOnn7iTiI74uEeX/5BgM2YuoXcbGf3bKu', 'member', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `momo_payments`
--

CREATE TABLE `momo_payments` (
  `id` bigint(20) NOT NULL,
  `registration_id` int(11) NOT NULL,
  `order_id` varchar(200) NOT NULL,
  `request_id` varchar(50) NOT NULL,
  `amount` bigint(20) NOT NULL,
  `pay_url` text DEFAULT NULL,
  `deeplink` text DEFAULT NULL,
  `qr_code_url` text DEFAULT NULL,
  `result_code` int(11) DEFAULT NULL,
  `message` varchar(255) DEFAULT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'created',
  `raw_request` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`raw_request`)),
  `raw_response` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`raw_response`)),
  `raw_ipn` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`raw_ipn`)),
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `momo_payments`
--

INSERT INTO `momo_payments` (`id`, `registration_id`, `order_id`, `request_id`, `amount`, `pay_url`, `deeplink`, `qr_code_url`, `result_code`, `message`, `status`, `raw_request`, `raw_response`, `raw_ipn`, `created_at`, `updated_at`) VALUES
(5, 90, 'GB90-1780546733097', 'REQ901780546733097', 2500000, 'https://test-payment.momo.vn/v2/gateway/pay?t=TU9NT1lKVjIyMDI2MDYwNF9URVNUfEdCOTAtMTc4MDU0NjczMzA5Nw&s=668e159b6e4f69aa47354b15fe7252275a833f38423bf308464ad89492754ae3', NULL, NULL, 0, 'Thành công.', 'pending', '{\"partnerCode\":\"MOMOYJV220260604_TEST\",\"partnerName\":\"GYM BRO\",\"storeId\":\"GYMBRO\",\"requestId\":\"REQ901780546733097\",\"amount\":2500000,\"orderId\":\"GB90-1780546733097\",\"orderInfo\":\"GYM BRO invoice 90\",\"redirectUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/membership/checkout/momo-return/90\",\"ipnUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/webhooks/momo\",\"requestType\":\"captureWallet\",\"extraData\":\"eyJyZWdpc3RyYXRpb25JZCI6OTAsIm1lbWJlcklkIjoxM30=\",\"lang\":\"vi\",\"signature\":\"822170913e21d9a46aaee18aaff33ba55bff3fa792d769247de0de4681cb914a\"}', '{\"partnerCode\":\"MOMOYJV220260604_TEST\",\"orderId\":\"GB90-1780546733097\",\"requestId\":\"REQ901780546733097\",\"amount\":2500000,\"responseTime\":1780546733338,\"message\":\"Thành công.\",\"resultCode\":0,\"payUrl\":\"https://test-payment.momo.vn/v2/gateway/pay?t=TU9NT1lKVjIyMDI2MDYwNF9URVNUfEdCOTAtMTc4MDU0NjczMzA5Nw&s=668e159b6e4f69aa47354b15fe7252275a833f38423bf308464ad89492754ae3\"}', NULL, '2026-06-04 11:18:53', '2026-06-04 11:18:53'),
(6, 94, 'GB94-1780904128741', 'REQ941780904128741', 500000, 'https://test-payment.momo.vn/v2/gateway/pay?t=TU9NT1lKVjIyMDI2MDYwNF9URVNUfEdCOTQtMTc4MDkwNDEyODc0MQ&s=4853f6f0ba31fd3c1602f7f9d4ca69f4bf69dd98d771b3866b9ce6534c44aa56', NULL, NULL, 0, 'Thành công.', 'pending', '{\"partnerCode\":\"MOMOYJV220260604_TEST\",\"partnerName\":\"GYM BRO\",\"storeId\":\"GYMBRO\",\"requestId\":\"REQ941780904128741\",\"amount\":500000,\"orderId\":\"GB94-1780904128741\",\"orderInfo\":\"GYM BRO invoice 94\",\"redirectUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/membership/checkout/momo-return/94\",\"ipnUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/webhooks/momo\",\"requestType\":\"captureWallet\",\"extraData\":\"eyJyZWdpc3RyYXRpb25JZCI6OTQsIm1lbWJlcklkIjozMX0=\",\"lang\":\"vi\",\"signature\":\"38138ce5da232c5c31f62ed4bef64036ca21af08ade336713e5fb461f15b01a1\"}', '{\"partnerCode\":\"MOMOYJV220260604_TEST\",\"orderId\":\"GB94-1780904128741\",\"requestId\":\"REQ941780904128741\",\"amount\":500000,\"responseTime\":1780904129065,\"message\":\"Thành công.\",\"resultCode\":0,\"payUrl\":\"https://test-payment.momo.vn/v2/gateway/pay?t=TU9NT1lKVjIyMDI2MDYwNF9URVNUfEdCOTQtMTc4MDkwNDEyODc0MQ&s=4853f6f0ba31fd3c1602f7f9d4ca69f4bf69dd98d771b3866b9ce6534c44aa56\"}', NULL, '2026-06-08 14:35:28', '2026-06-08 14:35:28'),
(7, 97, 'GB97-1780906854179', 'REQ971780906854179', 1000, NULL, NULL, NULL, 13, 'Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.', 'failed', '{\"partnerCode\":\"MOMOYJV220260604\",\"partnerName\":\"GYM BRO\",\"storeId\":\"GYMBRO\",\"requestId\":\"REQ971780906854179\",\"amount\":1000,\"orderId\":\"GB97-1780906854179\",\"orderInfo\":\"GYM BRO invoice 97\",\"redirectUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/registrations/checkout/momo-return/97\",\"ipnUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/webhooks/momo\",\"requestType\":\"captureWallet\",\"extraData\":\"eyJyZWdpc3RyYXRpb25JZCI6OTcsIm1lbWJlcklkIjpudWxsLCJzb3VyY2UiOiJwb3MifQ==\",\"lang\":\"vi\",\"signature\":\"0833e8374ddb89d6de4ac623991b1e5b5996ceab5dddad6f319eb1a686289493\"}', '{\"responseTime\":1780906854892,\"message\":\"Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.\",\"resultCode\":13}', NULL, '2026-06-08 15:20:54', '2026-06-08 15:20:54'),
(8, 97, 'GB97-1780906858185', 'REQ971780906858185', 1000, NULL, NULL, NULL, 13, 'Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.', 'failed', '{\"partnerCode\":\"MOMOYJV220260604\",\"partnerName\":\"GYM BRO\",\"storeId\":\"GYMBRO\",\"requestId\":\"REQ971780906858185\",\"amount\":1000,\"orderId\":\"GB97-1780906858185\",\"orderInfo\":\"GYM BRO invoice 97\",\"redirectUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/registrations/checkout/momo-return/97\",\"ipnUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/webhooks/momo\",\"requestType\":\"captureWallet\",\"extraData\":\"eyJyZWdpc3RyYXRpb25JZCI6OTcsIm1lbWJlcklkIjpudWxsLCJzb3VyY2UiOiJwb3MifQ==\",\"lang\":\"vi\",\"signature\":\"f68bf6405ef166dfeea1b45c1cab01625a48ee2303ba23f3345d60ff45995a44\"}', '{\"responseTime\":1780906858327,\"message\":\"Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.\",\"resultCode\":13}', NULL, '2026-06-08 15:20:58', '2026-06-08 15:20:58'),
(9, 97, 'GB97-1780906858294', 'REQ971780906858294', 1000, NULL, NULL, NULL, 13, 'Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.', 'failed', '{\"partnerCode\":\"MOMOYJV220260604\",\"partnerName\":\"GYM BRO\",\"storeId\":\"GYMBRO\",\"requestId\":\"REQ971780906858294\",\"amount\":1000,\"orderId\":\"GB97-1780906858294\",\"orderInfo\":\"GYM BRO invoice 97\",\"redirectUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/registrations/checkout/momo-return/97\",\"ipnUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/webhooks/momo\",\"requestType\":\"captureWallet\",\"extraData\":\"eyJyZWdpc3RyYXRpb25JZCI6OTcsIm1lbWJlcklkIjpudWxsLCJzb3VyY2UiOiJwb3MifQ==\",\"lang\":\"vi\",\"signature\":\"acd4a10280a9deb03c4fb4d06d6a005b12a2792dc4fd709c5c5635edbf8c8059\"}', '{\"responseTime\":1780906858429,\"message\":\"Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.\",\"resultCode\":13}', NULL, '2026-06-08 15:20:58', '2026-06-08 15:20:58'),
(10, 98, 'GB98-1780906918343', 'REQ981780906918343', 1000, NULL, NULL, NULL, 13, 'Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.', 'failed', '{\"partnerCode\":\"MOMOYJV220260604\",\"partnerName\":\"GYM BRO\",\"storeId\":\"GYMBRO\",\"requestId\":\"REQ981780906918343\",\"amount\":1000,\"orderId\":\"GB98-1780906918343\",\"orderInfo\":\"GYM BRO invoice 98\",\"redirectUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/registrations/checkout/momo-return/98\",\"ipnUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/webhooks/momo\",\"requestType\":\"captureWallet\",\"extraData\":\"eyJyZWdpc3RyYXRpb25JZCI6OTgsIm1lbWJlcklkIjpudWxsLCJzb3VyY2UiOiJwb3MifQ==\",\"lang\":\"vi\",\"signature\":\"263ba0cba9e3dc95260fef123a6d77fe7089ff1ae9d3afa4ed918a709b5d99ee\"}', '{\"responseTime\":1780906918597,\"message\":\"Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.\",\"resultCode\":13}', NULL, '2026-06-08 15:21:58', '2026-06-08 15:21:58'),
(11, 99, 'GB99-1780906932916', 'REQ991780906932916', 1000, NULL, NULL, NULL, 13, 'Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.', 'failed', '{\"partnerCode\":\"MOMOYJV220260604\",\"partnerName\":\"GYM BRO\",\"storeId\":\"GYMBRO\",\"requestId\":\"REQ991780906932916\",\"amount\":1000,\"orderId\":\"GB99-1780906932916\",\"orderInfo\":\"GYM BRO invoice 99\",\"redirectUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/registrations/checkout/momo-return/99\",\"ipnUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/webhooks/momo\",\"requestType\":\"captureWallet\",\"extraData\":\"eyJyZWdpc3RyYXRpb25JZCI6OTksIm1lbWJlcklkIjpudWxsLCJzb3VyY2UiOiJwb3MifQ==\",\"lang\":\"vi\",\"signature\":\"a923a16d1a3723c86413bce6707c3876010fe3b0267bb26fc9bc8f3b7ad2a354\"}', '{\"responseTime\":1780906933093,\"message\":\"Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.\",\"resultCode\":13}', NULL, '2026-06-08 15:22:12', '2026-06-08 15:22:12'),
(12, 99, 'GB99-1780906937006', 'REQ991780906937006', 1000, NULL, NULL, NULL, 13, 'Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.', 'failed', '{\"partnerCode\":\"MOMOYJV220260604\",\"partnerName\":\"GYM BRO\",\"storeId\":\"GYMBRO\",\"requestId\":\"REQ991780906937006\",\"amount\":1000,\"orderId\":\"GB99-1780906937006\",\"orderInfo\":\"GYM BRO invoice 99\",\"redirectUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/registrations/checkout/momo-return/99\",\"ipnUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/webhooks/momo\",\"requestType\":\"captureWallet\",\"extraData\":\"eyJyZWdpc3RyYXRpb25JZCI6OTksIm1lbWJlcklkIjpudWxsLCJzb3VyY2UiOiJwb3MifQ==\",\"lang\":\"vi\",\"signature\":\"0ef0f4228f20316696b9225ccc4af521bc44794d73019bd6854c297e1982466e\"}', '{\"responseTime\":1780906937170,\"message\":\"Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.\",\"resultCode\":13}', NULL, '2026-06-08 15:22:17', '2026-06-08 15:22:17'),
(13, 99, 'GB99-1780906937086', 'REQ991780906937086', 1000, NULL, NULL, NULL, 13, 'Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.', 'failed', '{\"partnerCode\":\"MOMOYJV220260604\",\"partnerName\":\"GYM BRO\",\"storeId\":\"GYMBRO\",\"requestId\":\"REQ991780906937086\",\"amount\":1000,\"orderId\":\"GB99-1780906937086\",\"orderInfo\":\"GYM BRO invoice 99\",\"redirectUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/registrations/checkout/momo-return/99\",\"ipnUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/webhooks/momo\",\"requestType\":\"captureWallet\",\"extraData\":\"eyJyZWdpc3RyYXRpb25JZCI6OTksIm1lbWJlcklkIjpudWxsLCJzb3VyY2UiOiJwb3MifQ==\",\"lang\":\"vi\",\"signature\":\"73f71efaf3bd4d5cc9f2bff37fe57b781951fba2ff08e3e43eb99cd5f3d3ed13\"}', '{\"responseTime\":1780906937206,\"message\":\"Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.\",\"resultCode\":13}', NULL, '2026-06-08 15:22:17', '2026-06-08 15:22:17'),
(14, 100, 'GB100-1780907460081', 'REQ1001780907460081', 1000, NULL, NULL, NULL, 13, 'Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.', 'failed', '{\"partnerCode\":\"MOMOYJV220260604\",\"partnerName\":\"GYM BRO\",\"storeId\":\"GYMBRO\",\"requestId\":\"REQ1001780907460081\",\"amount\":1000,\"orderId\":\"GB100-1780907460081\",\"orderInfo\":\"GYM BRO invoice 100\",\"redirectUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/registrations/checkout/momo-return/100\",\"ipnUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/webhooks/momo\",\"requestType\":\"captureWallet\",\"extraData\":\"eyJyZWdpc3RyYXRpb25JZCI6MTAwLCJtZW1iZXJJZCI6bnVsbCwic291cmNlIjoicG9zIn0=\",\"lang\":\"vi\",\"signature\":\"0630b6ba521195e451a34896b62e945c6e0fca01e364020c59ef800c3ad2c77f\"}', '{\"responseTime\":1780907460295,\"message\":\"Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.\",\"resultCode\":13}', NULL, '2026-06-08 15:31:00', '2026-06-08 15:31:00'),
(15, 100, 'GB100-1780907463557', 'REQ1001780907463557', 1000, NULL, NULL, NULL, 13, 'Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.', 'failed', '{\"partnerCode\":\"MOMOYJV220260604\",\"partnerName\":\"GYM BRO\",\"storeId\":\"GYMBRO\",\"requestId\":\"REQ1001780907463557\",\"amount\":1000,\"orderId\":\"GB100-1780907463557\",\"orderInfo\":\"GYM BRO invoice 100\",\"redirectUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/registrations/checkout/momo-return/100\",\"ipnUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/webhooks/momo\",\"requestType\":\"captureWallet\",\"extraData\":\"eyJyZWdpc3RyYXRpb25JZCI6MTAwLCJtZW1iZXJJZCI6bnVsbCwic291cmNlIjoicG9zIn0=\",\"lang\":\"vi\",\"signature\":\"b312681c3aff2d53d9a6389f3689bdc9170cd5e995576c905774247b42a330c5\"}', '{\"responseTime\":1780907463682,\"message\":\"Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.\",\"resultCode\":13}', NULL, '2026-06-08 15:31:03', '2026-06-08 15:31:03'),
(16, 100, 'GB100-1780907463612', 'REQ1001780907463612', 1000, NULL, NULL, NULL, 13, 'Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.', 'failed', '{\"partnerCode\":\"MOMOYJV220260604\",\"partnerName\":\"GYM BRO\",\"storeId\":\"GYMBRO\",\"requestId\":\"REQ1001780907463612\",\"amount\":1000,\"orderId\":\"GB100-1780907463612\",\"orderInfo\":\"GYM BRO invoice 100\",\"redirectUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/registrations/checkout/momo-return/100\",\"ipnUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/webhooks/momo\",\"requestType\":\"captureWallet\",\"extraData\":\"eyJyZWdpc3RyYXRpb25JZCI6MTAwLCJtZW1iZXJJZCI6bnVsbCwic291cmNlIjoicG9zIn0=\",\"lang\":\"vi\",\"signature\":\"51cdb5ca740fc20f595c7309364a69932e5a97ee2a518380e583accb1dbfc7da\"}', '{\"responseTime\":1780907463746,\"message\":\"Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.\",\"resultCode\":13}', NULL, '2026-06-08 15:31:03', '2026-06-08 15:31:03'),
(17, 100, 'GB100-1780907469673', 'REQ1001780907469673', 1000, NULL, NULL, NULL, 13, 'Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.', 'failed', '{\"partnerCode\":\"MOMOYJV220260604\",\"partnerName\":\"GYM BRO\",\"storeId\":\"GYMBRO\",\"requestId\":\"REQ1001780907469673\",\"amount\":1000,\"orderId\":\"GB100-1780907469673\",\"orderInfo\":\"GYM BRO invoice 100\",\"redirectUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/registrations/checkout/momo-return/100\",\"ipnUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/webhooks/momo\",\"requestType\":\"captureWallet\",\"extraData\":\"eyJyZWdpc3RyYXRpb25JZCI6MTAwLCJtZW1iZXJJZCI6bnVsbCwic291cmNlIjoicG9zIn0=\",\"lang\":\"vi\",\"signature\":\"1cf02d09a0241356297cae3be4624b00cbd270804def3739c72e47d0465d04ca\"}', '{\"responseTime\":1780907469844,\"message\":\"Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.\",\"resultCode\":13}', NULL, '2026-06-08 15:31:09', '2026-06-08 15:31:09'),
(18, 100, 'GB100-1780907470542', 'REQ1001780907470542', 1000, NULL, NULL, NULL, 13, 'Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.', 'failed', '{\"partnerCode\":\"MOMOYJV220260604\",\"partnerName\":\"GYM BRO\",\"storeId\":\"GYMBRO\",\"requestId\":\"REQ1001780907470542\",\"amount\":1000,\"orderId\":\"GB100-1780907470542\",\"orderInfo\":\"GYM BRO invoice 100\",\"redirectUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/registrations/checkout/momo-return/100\",\"ipnUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/webhooks/momo\",\"requestType\":\"captureWallet\",\"extraData\":\"eyJyZWdpc3RyYXRpb25JZCI6MTAwLCJtZW1iZXJJZCI6bnVsbCwic291cmNlIjoicG9zIn0=\",\"lang\":\"vi\",\"signature\":\"502760cd6ee9d72dcbedd9bfb6dfe155ed25a9f79279403e90fdd4212f3b7c33\"}', '{\"responseTime\":1780907470717,\"message\":\"Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.\",\"resultCode\":13}', NULL, '2026-06-08 15:31:10', '2026-06-08 15:31:10'),
(19, 101, 'GB101-1780907688819', 'REQ1011780907688819', 4500000, NULL, NULL, NULL, 13, 'Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.', 'failed', '{\"partnerCode\":\"MOMOYJV220260604\",\"partnerName\":\"GYM BRO\",\"storeId\":\"GYMBRO\",\"requestId\":\"REQ1011780907688819\",\"amount\":4500000,\"orderId\":\"GB101-1780907688819\",\"orderInfo\":\"GYM BRO invoice 101\",\"redirectUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/membership/checkout/momo-return/101\",\"ipnUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/webhooks/momo\",\"requestType\":\"captureWallet\",\"extraData\":\"eyJyZWdpc3RyYXRpb25JZCI6MTAxLCJtZW1iZXJJZCI6MzIsInNvdXJjZSI6Im1lbWJlcnNoaXAifQ==\",\"lang\":\"vi\",\"signature\":\"7b7fd2f37e302ec6e73084cc13eafcd8e7e8f38f93451bd88a92a7ceabdbfa9e\"}', '{\"responseTime\":1780907689007,\"message\":\"Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.\",\"resultCode\":13}', NULL, '2026-06-08 15:34:48', '2026-06-08 15:34:48'),
(20, 101, 'GB101-1780907695927', 'REQ1011780907695927', 4500000, NULL, NULL, NULL, 13, 'Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.', 'failed', '{\"partnerCode\":\"MOMOYJV220260604\",\"partnerName\":\"GYM BRO\",\"storeId\":\"GYMBRO\",\"requestId\":\"REQ1011780907695927\",\"amount\":4500000,\"orderId\":\"GB101-1780907695927\",\"orderInfo\":\"GYM BRO invoice 101\",\"redirectUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/membership/checkout/momo-return/101\",\"ipnUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/webhooks/momo\",\"requestType\":\"captureWallet\",\"extraData\":\"eyJyZWdpc3RyYXRpb25JZCI6MTAxLCJtZW1iZXJJZCI6MzIsInNvdXJjZSI6Im1lbWJlcnNoaXAifQ==\",\"lang\":\"vi\",\"signature\":\"05ff512be178d607883ddb90474b47c0bdf5e5882d34c434daea1a5da3ddbbbd\"}', '{\"responseTime\":1780907696103,\"message\":\"Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.\",\"resultCode\":13}', NULL, '2026-06-08 15:34:56', '2026-06-08 15:34:56'),
(21, 101, 'GB101-1780907696018', 'REQ1011780907696018', 4500000, NULL, NULL, NULL, 13, 'Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.', 'failed', '{\"partnerCode\":\"MOMOYJV220260604\",\"partnerName\":\"GYM BRO\",\"storeId\":\"GYMBRO\",\"requestId\":\"REQ1011780907696018\",\"amount\":4500000,\"orderId\":\"GB101-1780907696018\",\"orderInfo\":\"GYM BRO invoice 101\",\"redirectUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/membership/checkout/momo-return/101\",\"ipnUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/webhooks/momo\",\"requestType\":\"captureWallet\",\"extraData\":\"eyJyZWdpc3RyYXRpb25JZCI6MTAxLCJtZW1iZXJJZCI6MzIsInNvdXJjZSI6Im1lbWJlcnNoaXAifQ==\",\"lang\":\"vi\",\"signature\":\"4e80447d6351af23048c94adc9a9113d2fd23f8354c2a7f538127562ab7eaf71\"}', '{\"responseTime\":1780907696150,\"message\":\"Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.\",\"resultCode\":13}', NULL, '2026-06-08 15:34:56', '2026-06-08 15:34:56'),
(22, 101, 'GB101-1780907697193', 'REQ1011780907697193', 4500000, NULL, NULL, NULL, 13, 'Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.', 'failed', '{\"partnerCode\":\"MOMOYJV220260604\",\"partnerName\":\"GYM BRO\",\"storeId\":\"GYMBRO\",\"requestId\":\"REQ1011780907697193\",\"amount\":4500000,\"orderId\":\"GB101-1780907697193\",\"orderInfo\":\"GYM BRO invoice 101\",\"redirectUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/membership/checkout/momo-return/101\",\"ipnUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/webhooks/momo\",\"requestType\":\"captureWallet\",\"extraData\":\"eyJyZWdpc3RyYXRpb25JZCI6MTAxLCJtZW1iZXJJZCI6MzIsInNvdXJjZSI6Im1lbWJlcnNoaXAifQ==\",\"lang\":\"vi\",\"signature\":\"6ada760a81fb27866f189d436132bf7a37c6a0c622332936e8522bb943b19d89\"}', '{\"responseTime\":1780907697327,\"message\":\"Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.\",\"resultCode\":13}', NULL, '2026-06-08 15:34:57', '2026-06-08 15:34:57'),
(23, 101, 'GB101-1780907697226', 'REQ1011780907697226', 4500000, NULL, NULL, NULL, 13, 'Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.', 'failed', '{\"partnerCode\":\"MOMOYJV220260604\",\"partnerName\":\"GYM BRO\",\"storeId\":\"GYMBRO\",\"requestId\":\"REQ1011780907697226\",\"amount\":4500000,\"orderId\":\"GB101-1780907697226\",\"orderInfo\":\"GYM BRO invoice 101\",\"redirectUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/membership/checkout/momo-return/101\",\"ipnUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/webhooks/momo\",\"requestType\":\"captureWallet\",\"extraData\":\"eyJyZWdpc3RyYXRpb25JZCI6MTAxLCJtZW1iZXJJZCI6MzIsInNvdXJjZSI6Im1lbWJlcnNoaXAifQ==\",\"lang\":\"vi\",\"signature\":\"860fd4172f9250cd9249e809a7e1c9581aec961a3457465eb8e819ea689769e7\"}', '{\"responseTime\":1780907697350,\"message\":\"Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.\",\"resultCode\":13}', NULL, '2026-06-08 15:34:57', '2026-06-08 15:34:57'),
(24, 101, 'GB101-1780907699125', 'REQ1011780907699125', 4500000, NULL, NULL, NULL, 13, 'Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.', 'failed', '{\"partnerCode\":\"MOMOYJV220260604\",\"partnerName\":\"GYM BRO\",\"storeId\":\"GYMBRO\",\"requestId\":\"REQ1011780907699125\",\"amount\":4500000,\"orderId\":\"GB101-1780907699125\",\"orderInfo\":\"GYM BRO invoice 101\",\"redirectUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/membership/checkout/momo-return/101\",\"ipnUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/webhooks/momo\",\"requestType\":\"captureWallet\",\"extraData\":\"eyJyZWdpc3RyYXRpb25JZCI6MTAxLCJtZW1iZXJJZCI6MzIsInNvdXJjZSI6Im1lbWJlcnNoaXAifQ==\",\"lang\":\"vi\",\"signature\":\"7880b004ebd68078a4a3514e8ff7b3af93d97380a87cda64056a9bc1b1733829\"}', '{\"responseTime\":1780907699248,\"message\":\"Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.\",\"resultCode\":13}', NULL, '2026-06-08 15:34:59', '2026-06-08 15:34:59'),
(25, 101, 'GB101-1780907699160', 'REQ1011780907699160', 4500000, NULL, NULL, NULL, 13, 'Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.', 'failed', '{\"partnerCode\":\"MOMOYJV220260604\",\"partnerName\":\"GYM BRO\",\"storeId\":\"GYMBRO\",\"requestId\":\"REQ1011780907699160\",\"amount\":4500000,\"orderId\":\"GB101-1780907699160\",\"orderInfo\":\"GYM BRO invoice 101\",\"redirectUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/membership/checkout/momo-return/101\",\"ipnUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/webhooks/momo\",\"requestType\":\"captureWallet\",\"extraData\":\"eyJyZWdpc3RyYXRpb25JZCI6MTAxLCJtZW1iZXJJZCI6MzIsInNvdXJjZSI6Im1lbWJlcnNoaXAifQ==\",\"lang\":\"vi\",\"signature\":\"b3c1d425b83b6e38be8e5355367a12508017cb628d1be4d5b825d48275652724\"}', '{\"responseTime\":1780907699283,\"message\":\"Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.\",\"resultCode\":13}', NULL, '2026-06-08 15:34:59', '2026-06-08 15:34:59'),
(26, 101, 'GB101-1780907699358', 'REQ1011780907699358', 4500000, NULL, NULL, NULL, 13, 'Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.', 'failed', '{\"partnerCode\":\"MOMOYJV220260604\",\"partnerName\":\"GYM BRO\",\"storeId\":\"GYMBRO\",\"requestId\":\"REQ1011780907699358\",\"amount\":4500000,\"orderId\":\"GB101-1780907699358\",\"orderInfo\":\"GYM BRO invoice 101\",\"redirectUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/membership/checkout/momo-return/101\",\"ipnUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/webhooks/momo\",\"requestType\":\"captureWallet\",\"extraData\":\"eyJyZWdpc3RyYXRpb25JZCI6MTAxLCJtZW1iZXJJZCI6MzIsInNvdXJjZSI6Im1lbWJlcnNoaXAifQ==\",\"lang\":\"vi\",\"signature\":\"e8d570ac174e58c6ca9f8d2d2e3937a45337d22713e3e20d00b92a34da82420d\"}', '{\"responseTime\":1780907699506,\"message\":\"Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.\",\"resultCode\":13}', NULL, '2026-06-08 15:34:59', '2026-06-08 15:34:59'),
(27, 101, 'GB101-1780907699413', 'REQ1011780907699413', 4500000, NULL, NULL, NULL, 13, 'Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.', 'failed', '{\"partnerCode\":\"MOMOYJV220260604\",\"partnerName\":\"GYM BRO\",\"storeId\":\"GYMBRO\",\"requestId\":\"REQ1011780907699413\",\"amount\":4500000,\"orderId\":\"GB101-1780907699413\",\"orderInfo\":\"GYM BRO invoice 101\",\"redirectUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/membership/checkout/momo-return/101\",\"ipnUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/webhooks/momo\",\"requestType\":\"captureWallet\",\"extraData\":\"eyJyZWdpc3RyYXRpb25JZCI6MTAxLCJtZW1iZXJJZCI6MzIsInNvdXJjZSI6Im1lbWJlcnNoaXAifQ==\",\"lang\":\"vi\",\"signature\":\"d40e0a379e3cc0e5d58f2494dbd33d14524186809496a2066f07ad02c35a13e1\"}', '{\"responseTime\":1780907699544,\"message\":\"Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.\",\"resultCode\":13}', NULL, '2026-06-08 15:34:59', '2026-06-08 15:34:59'),
(28, 101, 'GB101-1780907700077', 'REQ1011780907700077', 4500000, NULL, NULL, NULL, 13, 'Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.', 'failed', '{\"partnerCode\":\"MOMOYJV220260604\",\"partnerName\":\"GYM BRO\",\"storeId\":\"GYMBRO\",\"requestId\":\"REQ1011780907700077\",\"amount\":4500000,\"orderId\":\"GB101-1780907700077\",\"orderInfo\":\"GYM BRO invoice 101\",\"redirectUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/membership/checkout/momo-return/101\",\"ipnUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/webhooks/momo\",\"requestType\":\"captureWallet\",\"extraData\":\"eyJyZWdpc3RyYXRpb25JZCI6MTAxLCJtZW1iZXJJZCI6MzIsInNvdXJjZSI6Im1lbWJlcnNoaXAifQ==\",\"lang\":\"vi\",\"signature\":\"4bb79fe3fb964dd81d8258e01c817551d25769de80c2224a8c7a81c89b45ee26\"}', '{\"responseTime\":1780907700210,\"message\":\"Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.\",\"resultCode\":13}', NULL, '2026-06-08 15:35:00', '2026-06-08 15:35:00'),
(29, 101, 'GB101-1780907700106', 'REQ1011780907700106', 4500000, NULL, NULL, NULL, 13, 'Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.', 'failed', '{\"partnerCode\":\"MOMOYJV220260604\",\"partnerName\":\"GYM BRO\",\"storeId\":\"GYMBRO\",\"requestId\":\"REQ1011780907700106\",\"amount\":4500000,\"orderId\":\"GB101-1780907700106\",\"orderInfo\":\"GYM BRO invoice 101\",\"redirectUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/membership/checkout/momo-return/101\",\"ipnUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/webhooks/momo\",\"requestType\":\"captureWallet\",\"extraData\":\"eyJyZWdpc3RyYXRpb25JZCI6MTAxLCJtZW1iZXJJZCI6MzIsInNvdXJjZSI6Im1lbWJlcnNoaXAifQ==\",\"lang\":\"vi\",\"signature\":\"8f733b1ab7978f66c93270817cb64883056e36779277337e6553ef8f0d3c921b\"}', '{\"responseTime\":1780907700237,\"message\":\"Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.\",\"resultCode\":13}', NULL, '2026-06-08 15:35:00', '2026-06-08 15:35:00'),
(30, 101, 'GB101-1780907703909', 'REQ1011780907703909', 4500000, NULL, NULL, NULL, 13, 'Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.', 'failed', '{\"partnerCode\":\"MOMOYJV220260604\",\"partnerName\":\"GYM BRO\",\"storeId\":\"GYMBRO\",\"requestId\":\"REQ1011780907703909\",\"amount\":4500000,\"orderId\":\"GB101-1780907703909\",\"orderInfo\":\"GYM BRO invoice 101\",\"redirectUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/membership/checkout/momo-return/101\",\"ipnUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/webhooks/momo\",\"requestType\":\"captureWallet\",\"extraData\":\"eyJyZWdpc3RyYXRpb25JZCI6MTAxLCJtZW1iZXJJZCI6MzIsInNvdXJjZSI6Im1lbWJlcnNoaXAifQ==\",\"lang\":\"vi\",\"signature\":\"95c385e67806f44daef1a8e0af4cf12cc3f15e1749497d3d5058d726311f1bdc\"}', '{\"responseTime\":1780907704034,\"message\":\"Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.\",\"resultCode\":13}', NULL, '2026-06-08 15:35:03', '2026-06-08 15:35:03'),
(31, 101, 'GB101-1780907703952', 'REQ1011780907703952', 4500000, NULL, NULL, NULL, 13, 'Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.', 'failed', '{\"partnerCode\":\"MOMOYJV220260604\",\"partnerName\":\"GYM BRO\",\"storeId\":\"GYMBRO\",\"requestId\":\"REQ1011780907703952\",\"amount\":4500000,\"orderId\":\"GB101-1780907703952\",\"orderInfo\":\"GYM BRO invoice 101\",\"redirectUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/membership/checkout/momo-return/101\",\"ipnUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/webhooks/momo\",\"requestType\":\"captureWallet\",\"extraData\":\"eyJyZWdpc3RyYXRpb25JZCI6MTAxLCJtZW1iZXJJZCI6MzIsInNvdXJjZSI6Im1lbWJlcnNoaXAifQ==\",\"lang\":\"vi\",\"signature\":\"9bcbdece10e198514a66aec1a11e5819d41e1783b2f78bc1240b3906af4d3e85\"}', '{\"responseTime\":1780907704076,\"message\":\"Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.\",\"resultCode\":13}', NULL, '2026-06-08 15:35:03', '2026-06-08 15:35:03'),
(32, 101, 'GB101-1780907704710', 'REQ1011780907704710', 4500000, NULL, NULL, NULL, 13, 'Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.', 'failed', '{\"partnerCode\":\"MOMOYJV220260604\",\"partnerName\":\"GYM BRO\",\"storeId\":\"GYMBRO\",\"requestId\":\"REQ1011780907704710\",\"amount\":4500000,\"orderId\":\"GB101-1780907704710\",\"orderInfo\":\"GYM BRO invoice 101\",\"redirectUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/membership/checkout/momo-return/101\",\"ipnUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/webhooks/momo\",\"requestType\":\"captureWallet\",\"extraData\":\"eyJyZWdpc3RyYXRpb25JZCI6MTAxLCJtZW1iZXJJZCI6MzIsInNvdXJjZSI6Im1lbWJlcnNoaXAifQ==\",\"lang\":\"vi\",\"signature\":\"01b5a9fea710adb49e27f35fa4b405d971f8be6315168de63ae3091a2c8f6053\"}', '{\"responseTime\":1780907704837,\"message\":\"Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.\",\"resultCode\":13}', NULL, '2026-06-08 15:35:04', '2026-06-08 15:35:04'),
(33, 101, 'GB101-1780907704777', 'REQ1011780907704777', 4500000, NULL, NULL, NULL, 13, 'Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.', 'failed', '{\"partnerCode\":\"MOMOYJV220260604\",\"partnerName\":\"GYM BRO\",\"storeId\":\"GYMBRO\",\"requestId\":\"REQ1011780907704777\",\"amount\":4500000,\"orderId\":\"GB101-1780907704777\",\"orderInfo\":\"GYM BRO invoice 101\",\"redirectUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/membership/checkout/momo-return/101\",\"ipnUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/webhooks/momo\",\"requestType\":\"captureWallet\",\"extraData\":\"eyJyZWdpc3RyYXRpb25JZCI6MTAxLCJtZW1iZXJJZCI6MzIsInNvdXJjZSI6Im1lbWJlcnNoaXAifQ==\",\"lang\":\"vi\",\"signature\":\"f20cbb19ddf817fcf1b1477d9a558bc9a0e1bfd718555702a9ea633a3078713e\"}', '{\"responseTime\":1780907704908,\"message\":\"Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.\",\"resultCode\":13}', NULL, '2026-06-08 15:35:04', '2026-06-08 15:35:04'),
(34, 101, 'GB101-1780907705550', 'REQ1011780907705550', 4500000, NULL, NULL, NULL, 13, 'Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.', 'failed', '{\"partnerCode\":\"MOMOYJV220260604\",\"partnerName\":\"GYM BRO\",\"storeId\":\"GYMBRO\",\"requestId\":\"REQ1011780907705550\",\"amount\":4500000,\"orderId\":\"GB101-1780907705550\",\"orderInfo\":\"GYM BRO invoice 101\",\"redirectUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/membership/checkout/momo-return/101\",\"ipnUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/webhooks/momo\",\"requestType\":\"captureWallet\",\"extraData\":\"eyJyZWdpc3RyYXRpb25JZCI6MTAxLCJtZW1iZXJJZCI6MzIsInNvdXJjZSI6Im1lbWJlcnNoaXAifQ==\",\"lang\":\"vi\",\"signature\":\"8f1c5bfcff4ec230c3951c92b7d2363207f9dcef3db64fcd80cad67058af4be9\"}', '{\"responseTime\":1780907705674,\"message\":\"Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.\",\"resultCode\":13}', NULL, '2026-06-08 15:35:05', '2026-06-08 15:35:05'),
(35, 101, 'GB101-1780907705597', 'REQ1011780907705597', 4500000, NULL, NULL, NULL, 13, 'Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.', 'failed', '{\"partnerCode\":\"MOMOYJV220260604\",\"partnerName\":\"GYM BRO\",\"storeId\":\"GYMBRO\",\"requestId\":\"REQ1011780907705597\",\"amount\":4500000,\"orderId\":\"GB101-1780907705597\",\"orderInfo\":\"GYM BRO invoice 101\",\"redirectUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/membership/checkout/momo-return/101\",\"ipnUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/webhooks/momo\",\"requestType\":\"captureWallet\",\"extraData\":\"eyJyZWdpc3RyYXRpb25JZCI6MTAxLCJtZW1iZXJJZCI6MzIsInNvdXJjZSI6Im1lbWJlcnNoaXAifQ==\",\"lang\":\"vi\",\"signature\":\"6ab067c7e00dab0e36e59413f729bbbc326e0fda7540ae34d377b0e4f2d93cc7\"}', '{\"responseTime\":1780907705736,\"message\":\"Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.\",\"resultCode\":13}', NULL, '2026-06-08 15:35:05', '2026-06-08 15:35:05'),
(36, 101, 'GB101-1780907706409', 'REQ1011780907706409', 4500000, NULL, NULL, NULL, 13, 'Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.', 'failed', '{\"partnerCode\":\"MOMOYJV220260604\",\"partnerName\":\"GYM BRO\",\"storeId\":\"GYMBRO\",\"requestId\":\"REQ1011780907706409\",\"amount\":4500000,\"orderId\":\"GB101-1780907706409\",\"orderInfo\":\"GYM BRO invoice 101\",\"redirectUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/membership/checkout/momo-return/101\",\"ipnUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/webhooks/momo\",\"requestType\":\"captureWallet\",\"extraData\":\"eyJyZWdpc3RyYXRpb25JZCI6MTAxLCJtZW1iZXJJZCI6MzIsInNvdXJjZSI6Im1lbWJlcnNoaXAifQ==\",\"lang\":\"vi\",\"signature\":\"c78bf4dd0f58196a7275b7097b0e7e2add336238b8f346bf62ebe5fb2d4afd0c\"}', '{\"responseTime\":1780907706544,\"message\":\"Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.\",\"resultCode\":13}', NULL, '2026-06-08 15:35:06', '2026-06-08 15:35:06'),
(37, 101, 'GB101-1780907706442', 'REQ1011780907706442', 4500000, NULL, NULL, NULL, 13, 'Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.', 'failed', '{\"partnerCode\":\"MOMOYJV220260604\",\"partnerName\":\"GYM BRO\",\"storeId\":\"GYMBRO\",\"requestId\":\"REQ1011780907706442\",\"amount\":4500000,\"orderId\":\"GB101-1780907706442\",\"orderInfo\":\"GYM BRO invoice 101\",\"redirectUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/membership/checkout/momo-return/101\",\"ipnUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/webhooks/momo\",\"requestType\":\"captureWallet\",\"extraData\":\"eyJyZWdpc3RyYXRpb25JZCI6MTAxLCJtZW1iZXJJZCI6MzIsInNvdXJjZSI6Im1lbWJlcnNoaXAifQ==\",\"lang\":\"vi\",\"signature\":\"cb8ef0eb3176167f6364fd19798c1f0c3eff1209b3197bb2cfc1289762718541\"}', '{\"responseTime\":1780907706568,\"message\":\"Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.\",\"resultCode\":13}', NULL, '2026-06-08 15:35:06', '2026-06-08 15:35:06'),
(38, 101, 'GB101-1780907707108', 'REQ1011780907707108', 4500000, NULL, NULL, NULL, 13, 'Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.', 'failed', '{\"partnerCode\":\"MOMOYJV220260604\",\"partnerName\":\"GYM BRO\",\"storeId\":\"GYMBRO\",\"requestId\":\"REQ1011780907707108\",\"amount\":4500000,\"orderId\":\"GB101-1780907707108\",\"orderInfo\":\"GYM BRO invoice 101\",\"redirectUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/membership/checkout/momo-return/101\",\"ipnUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/webhooks/momo\",\"requestType\":\"captureWallet\",\"extraData\":\"eyJyZWdpc3RyYXRpb25JZCI6MTAxLCJtZW1iZXJJZCI6MzIsInNvdXJjZSI6Im1lbWJlcnNoaXAifQ==\",\"lang\":\"vi\",\"signature\":\"7d8eea7992df81c0767b129df2a4f20950200a430628e5e97111a33b0450e68d\"}', '{\"responseTime\":1780907707232,\"message\":\"Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.\",\"resultCode\":13}', NULL, '2026-06-08 15:35:07', '2026-06-08 15:35:07'),
(39, 101, 'GB101-1780907707158', 'REQ1011780907707158', 4500000, NULL, NULL, NULL, 13, 'Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.', 'failed', '{\"partnerCode\":\"MOMOYJV220260604\",\"partnerName\":\"GYM BRO\",\"storeId\":\"GYMBRO\",\"requestId\":\"REQ1011780907707158\",\"amount\":4500000,\"orderId\":\"GB101-1780907707158\",\"orderInfo\":\"GYM BRO invoice 101\",\"redirectUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/membership/checkout/momo-return/101\",\"ipnUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/webhooks/momo\",\"requestType\":\"captureWallet\",\"extraData\":\"eyJyZWdpc3RyYXRpb25JZCI6MTAxLCJtZW1iZXJJZCI6MzIsInNvdXJjZSI6Im1lbWJlcnNoaXAifQ==\",\"lang\":\"vi\",\"signature\":\"9147c58c682c7dfdcc67921df9c433c670257b372f195da7fda0e0a0e190db2b\"}', '{\"responseTime\":1780907707301,\"message\":\"Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.\",\"resultCode\":13}', NULL, '2026-06-08 15:35:07', '2026-06-08 15:35:07'),
(40, 101, 'GB101-1780907707835', 'REQ1011780907707835', 4500000, NULL, NULL, NULL, 13, 'Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.', 'failed', '{\"partnerCode\":\"MOMOYJV220260604\",\"partnerName\":\"GYM BRO\",\"storeId\":\"GYMBRO\",\"requestId\":\"REQ1011780907707835\",\"amount\":4500000,\"orderId\":\"GB101-1780907707835\",\"orderInfo\":\"GYM BRO invoice 101\",\"redirectUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/membership/checkout/momo-return/101\",\"ipnUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/webhooks/momo\",\"requestType\":\"captureWallet\",\"extraData\":\"eyJyZWdpc3RyYXRpb25JZCI6MTAxLCJtZW1iZXJJZCI6MzIsInNvdXJjZSI6Im1lbWJlcnNoaXAifQ==\",\"lang\":\"vi\",\"signature\":\"d551eeb8130e11e3d1525ee75c1914d9030c1043ee90961946ab1e3fb567d4b8\"}', '{\"responseTime\":1780907707982,\"message\":\"Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.\",\"resultCode\":13}', NULL, '2026-06-08 15:35:07', '2026-06-08 15:35:07'),
(41, 101, 'GB101-1780907707884', 'REQ1011780907707884', 4500000, NULL, NULL, NULL, 13, 'Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.', 'failed', '{\"partnerCode\":\"MOMOYJV220260604\",\"partnerName\":\"GYM BRO\",\"storeId\":\"GYMBRO\",\"requestId\":\"REQ1011780907707884\",\"amount\":4500000,\"orderId\":\"GB101-1780907707884\",\"orderInfo\":\"GYM BRO invoice 101\",\"redirectUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/membership/checkout/momo-return/101\",\"ipnUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/webhooks/momo\",\"requestType\":\"captureWallet\",\"extraData\":\"eyJyZWdpc3RyYXRpb25JZCI6MTAxLCJtZW1iZXJJZCI6MzIsInNvdXJjZSI6Im1lbWJlcnNoaXAifQ==\",\"lang\":\"vi\",\"signature\":\"048dd881668a6ead50d7d5bbfa71125340bd71e2f7fc1d0e50ac4b33613d702f\"}', '{\"responseTime\":1780907708007,\"message\":\"Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.\",\"resultCode\":13}', NULL, '2026-06-08 15:35:07', '2026-06-08 15:35:07'),
(42, 101, 'GB101-1780907920397', 'REQ1011780907920397', 4500000, NULL, NULL, NULL, 13, 'Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.', 'failed', '{\"endpoint\":\"https://payment.momo.vn/v2/gateway/api/create\",\"partnerCode\":\"MOMOYJV220260604\",\"partnerName\":\"GYM BRO\",\"storeId\":\"GYMBRO\",\"requestId\":\"REQ1011780907920397\",\"amount\":4500000,\"orderId\":\"GB101-1780907920397\",\"orderInfo\":\"GYM BRO invoice 101\",\"redirectUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/membership/checkout/momo-return/101\",\"ipnUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/webhooks/momo\",\"requestType\":\"captureWallet\",\"extraData\":\"eyJyZWdpc3RyYXRpb25JZCI6MTAxLCJtZW1iZXJJZCI6MzIsInNvdXJjZSI6Im1lbWJlcnNoaXAifQ==\",\"lang\":\"vi\",\"signature\":\"1814d4a4d041dc8f4f1bb47551d75d5e4bc09b75ff699cdee34b012dba57b629\"}', '{\"responseTime\":1780907920624,\"message\":\"Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.\",\"resultCode\":13}', NULL, '2026-06-08 15:38:40', '2026-06-08 15:38:40'),
(43, 101, 'GB101-1780907996842', 'REQ1011780907996842', 4500000, NULL, NULL, NULL, 13, 'Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.', 'failed', '{\"endpoint\":\"https://payment.momo.vn/v2/gateway/api/create\",\"partnerCode\":\"MOMOYJV220260604\",\"partnerName\":\"GYM BRO\",\"storeId\":\"GYMBRO\",\"requestId\":\"REQ1011780907996842\",\"amount\":4500000,\"orderId\":\"GB101-1780907996842\",\"orderInfo\":\"GYM BRO invoice 101\",\"redirectUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/membership/checkout/momo-return/101\",\"ipnUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/webhooks/momo\",\"requestType\":\"captureWallet\",\"extraData\":\"eyJyZWdpc3RyYXRpb25JZCI6MTAxLCJtZW1iZXJJZCI6MzIsInNvdXJjZSI6Im1lbWJlcnNoaXAifQ==\",\"lang\":\"vi\",\"signature\":\"637973e149c5a7933323924eb1b5cf2450e21e3f806cca994fec652d9a5d4b05\"}', '{\"responseTime\":1780907997071,\"message\":\"Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.\",\"resultCode\":13}', NULL, '2026-06-08 15:39:56', '2026-06-08 15:39:56'),
(44, 101, 'GB101-1780907996974', 'REQ1011780907996974', 4500000, NULL, NULL, NULL, 13, 'Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.', 'failed', '{\"endpoint\":\"https://payment.momo.vn/v2/gateway/api/create\",\"partnerCode\":\"MOMOYJV220260604\",\"partnerName\":\"GYM BRO\",\"storeId\":\"GYMBRO\",\"requestId\":\"REQ1011780907996974\",\"amount\":4500000,\"orderId\":\"GB101-1780907996974\",\"orderInfo\":\"GYM BRO invoice 101\",\"redirectUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/membership/checkout/momo-return/101\",\"ipnUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/webhooks/momo\",\"requestType\":\"captureWallet\",\"extraData\":\"eyJyZWdpc3RyYXRpb25JZCI6MTAxLCJtZW1iZXJJZCI6MzIsInNvdXJjZSI6Im1lbWJlcnNoaXAifQ==\",\"lang\":\"vi\",\"signature\":\"8cbe2cd2e59af0f6ed87a493408603973e4d49f07225ce35e602ae762ffaa5e3\"}', '{\"responseTime\":1780907997111,\"message\":\"Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.\",\"resultCode\":13}', NULL, '2026-06-08 15:39:57', '2026-06-08 15:39:57'),
(45, 101, 'GB101-1780907997009', 'REQ1011780907997009', 4500000, NULL, NULL, NULL, 13, 'Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.', 'failed', '{\"endpoint\":\"https://payment.momo.vn/v2/gateway/api/create\",\"partnerCode\":\"MOMOYJV220260604\",\"partnerName\":\"GYM BRO\",\"storeId\":\"GYMBRO\",\"requestId\":\"REQ1011780907997009\",\"amount\":4500000,\"orderId\":\"GB101-1780907997009\",\"orderInfo\":\"GYM BRO invoice 101\",\"redirectUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/membership/checkout/momo-return/101\",\"ipnUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/webhooks/momo\",\"requestType\":\"captureWallet\",\"extraData\":\"eyJyZWdpc3RyYXRpb25JZCI6MTAxLCJtZW1iZXJJZCI6MzIsInNvdXJjZSI6Im1lbWJlcnNoaXAifQ==\",\"lang\":\"vi\",\"signature\":\"c232b6ab909050c81d5e15359a4881f52125c66e156b74f0adf20bcd5b1ee136\"}', '{\"responseTime\":1780907997191,\"message\":\"Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.\",\"resultCode\":13}', NULL, '2026-06-08 15:39:57', '2026-06-08 15:39:57'),
(46, 101, 'GB101-1780907997129', 'REQ1011780907997129', 4500000, NULL, NULL, NULL, 13, 'Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.', 'failed', '{\"endpoint\":\"https://payment.momo.vn/v2/gateway/api/create\",\"partnerCode\":\"MOMOYJV220260604\",\"partnerName\":\"GYM BRO\",\"storeId\":\"GYMBRO\",\"requestId\":\"REQ1011780907997129\",\"amount\":4500000,\"orderId\":\"GB101-1780907997129\",\"orderInfo\":\"GYM BRO invoice 101\",\"redirectUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/membership/checkout/momo-return/101\",\"ipnUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/webhooks/momo\",\"requestType\":\"captureWallet\",\"extraData\":\"eyJyZWdpc3RyYXRpb25JZCI6MTAxLCJtZW1iZXJJZCI6MzIsInNvdXJjZSI6Im1lbWJlcnNoaXAifQ==\",\"lang\":\"vi\",\"signature\":\"cf429520a73c47e9058b5ec2a1064105a13a102e60e97d6053ab118976269e87\"}', '{\"responseTime\":1780907997254,\"message\":\"Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.\",\"resultCode\":13}', NULL, '2026-06-08 15:39:57', '2026-06-08 15:39:57'),
(47, 101, 'GB101-1780907996327', 'REQ1011780907996327', 4500000, NULL, NULL, NULL, 13, 'Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.', 'failed', '{\"endpoint\":\"https://payment.momo.vn/v2/gateway/api/create\",\"partnerCode\":\"MOMOYJV220260604\",\"partnerName\":\"GYM BRO\",\"storeId\":\"GYMBRO\",\"requestId\":\"REQ1011780907996327\",\"amount\":4500000,\"orderId\":\"GB101-1780907996327\",\"orderInfo\":\"GYM BRO invoice 101\",\"redirectUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/membership/checkout/momo-return/101\",\"ipnUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/webhooks/momo\",\"requestType\":\"captureWallet\",\"extraData\":\"eyJyZWdpc3RyYXRpb25JZCI6MTAxLCJtZW1iZXJJZCI6MzIsInNvdXJjZSI6Im1lbWJlcnNoaXAifQ==\",\"lang\":\"vi\",\"signature\":\"c33034c2fbbfff56ac0b93b2a49740d2debda9cc210c81bcf7d699f130097ed5\"}', '{\"responseTime\":1780907997643,\"message\":\"Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.\",\"resultCode\":13}', NULL, '2026-06-08 15:39:57', '2026-06-08 15:39:57'),
(48, 101, 'GB101-1780908567803', 'REQ1011780908567803', 4500000, NULL, NULL, NULL, 13, 'Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.', 'failed', '{\"endpoint\":\"https://payment.momo.vn/v2/gateway/api/create\",\"partnerCode\":\"MOMOYJV220260604\",\"partnerName\":\"GYMBRO\",\"storeId\":\"GYMBRO\",\"requestId\":\"REQ1011780908567803\",\"amount\":4500000,\"orderId\":\"GB101-1780908567803\",\"orderInfo\":\"GYM BRO invoice 101\",\"redirectUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/membership/checkout/momo-return/101\",\"ipnUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/webhooks/momo\",\"requestType\":\"captureWallet\",\"extraData\":\"eyJyZWdpc3RyYXRpb25JZCI6MTAxLCJtZW1iZXJJZCI6MzIsInNvdXJjZSI6Im1lbWJlcnNoaXAifQ==\",\"lang\":\"vi\",\"signature\":\"f4931871aa3938b50d4b3f9a4b11f99407636f47c498519516c56b028da7345a\"}', '{\"responseTime\":1780908567991,\"message\":\"Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.\",\"resultCode\":13}', NULL, '2026-06-08 15:49:27', '2026-06-08 15:49:27'),
(49, 101, 'GB101-1780908569426', 'REQ1011780908569426', 4500000, NULL, NULL, NULL, 13, 'Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.', 'failed', '{\"endpoint\":\"https://payment.momo.vn/v2/gateway/api/create\",\"partnerCode\":\"MOMOYJV220260604\",\"partnerName\":\"GYMBRO\",\"storeId\":\"GYMBRO\",\"requestId\":\"REQ1011780908569426\",\"amount\":4500000,\"orderId\":\"GB101-1780908569426\",\"orderInfo\":\"GYM BRO invoice 101\",\"redirectUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/membership/checkout/momo-return/101\",\"ipnUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/webhooks/momo\",\"requestType\":\"captureWallet\",\"extraData\":\"eyJyZWdpc3RyYXRpb25JZCI6MTAxLCJtZW1iZXJJZCI6MzIsInNvdXJjZSI6Im1lbWJlcnNoaXAifQ==\",\"lang\":\"vi\",\"signature\":\"7179498585ccb4b8c2007e71c930c9bfdcad19a9daed09216c46b86e3bbfdcf7\"}', '{\"responseTime\":1780908569527,\"message\":\"Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.\",\"resultCode\":13}', NULL, '2026-06-08 15:49:29', '2026-06-08 15:49:29'),
(50, 101, 'GB101-1780908569470', 'REQ1011780908569470', 4500000, NULL, NULL, NULL, 13, 'Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.', 'failed', '{\"endpoint\":\"https://payment.momo.vn/v2/gateway/api/create\",\"partnerCode\":\"MOMOYJV220260604\",\"partnerName\":\"GYMBRO\",\"storeId\":\"GYMBRO\",\"requestId\":\"REQ1011780908569470\",\"amount\":4500000,\"orderId\":\"GB101-1780908569470\",\"orderInfo\":\"GYM BRO invoice 101\",\"redirectUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/membership/checkout/momo-return/101\",\"ipnUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/webhooks/momo\",\"requestType\":\"captureWallet\",\"extraData\":\"eyJyZWdpc3RyYXRpb25JZCI6MTAxLCJtZW1iZXJJZCI6MzIsInNvdXJjZSI6Im1lbWJlcnNoaXAifQ==\",\"lang\":\"vi\",\"signature\":\"d0f13a4f4ca366013dc0a01139353ca5a1b1d2b3889341e5ceb8c30cbc72e34b\"}', '{\"responseTime\":1780908569571,\"message\":\"Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.\",\"resultCode\":13}', NULL, '2026-06-08 15:49:29', '2026-06-08 15:49:29'),
(51, 101, 'GB101-1780908570226', 'REQ1011780908570226', 4500000, NULL, NULL, NULL, 13, 'Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.', 'failed', '{\"endpoint\":\"https://payment.momo.vn/v2/gateway/api/create\",\"partnerCode\":\"MOMOYJV220260604\",\"partnerName\":\"GYMBRO\",\"storeId\":\"GYMBRO\",\"requestId\":\"REQ1011780908570226\",\"amount\":4500000,\"orderId\":\"GB101-1780908570226\",\"orderInfo\":\"GYM BRO invoice 101\",\"redirectUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/membership/checkout/momo-return/101\",\"ipnUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/webhooks/momo\",\"requestType\":\"captureWallet\",\"extraData\":\"eyJyZWdpc3RyYXRpb25JZCI6MTAxLCJtZW1iZXJJZCI6MzIsInNvdXJjZSI6Im1lbWJlcnNoaXAifQ==\",\"lang\":\"vi\",\"signature\":\"209632508dd44405c30606f9f06aeba7df430be3c407f7109b088cfbdedaa105\"}', '{\"responseTime\":1780908570315,\"message\":\"Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.\",\"resultCode\":13}', NULL, '2026-06-08 15:49:30', '2026-06-08 15:49:30');
INSERT INTO `momo_payments` (`id`, `registration_id`, `order_id`, `request_id`, `amount`, `pay_url`, `deeplink`, `qr_code_url`, `result_code`, `message`, `status`, `raw_request`, `raw_response`, `raw_ipn`, `created_at`, `updated_at`) VALUES
(52, 101, 'GB101-1780908570259', 'REQ1011780908570259', 4500000, NULL, NULL, NULL, 13, 'Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.', 'failed', '{\"endpoint\":\"https://payment.momo.vn/v2/gateway/api/create\",\"partnerCode\":\"MOMOYJV220260604\",\"partnerName\":\"GYMBRO\",\"storeId\":\"GYMBRO\",\"requestId\":\"REQ1011780908570259\",\"amount\":4500000,\"orderId\":\"GB101-1780908570259\",\"orderInfo\":\"GYM BRO invoice 101\",\"redirectUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/membership/checkout/momo-return/101\",\"ipnUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/webhooks/momo\",\"requestType\":\"captureWallet\",\"extraData\":\"eyJyZWdpc3RyYXRpb25JZCI6MTAxLCJtZW1iZXJJZCI6MzIsInNvdXJjZSI6Im1lbWJlcnNoaXAifQ==\",\"lang\":\"vi\",\"signature\":\"7f407db8f8fe333671d72a5fe46e0837cac73792712b7bcd5e1c8cf70cb1e705\"}', '{\"responseTime\":1780908570360,\"message\":\"Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.\",\"resultCode\":13}', NULL, '2026-06-08 15:49:30', '2026-06-08 15:49:30'),
(53, 101, 'GB101-1780908833106', 'REQ1011780908833106', 4500000, NULL, NULL, NULL, 13, 'Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.', 'failed', '{\"endpoint\":\"https://payment.momo.vn/v2/gateway/api/create\",\"partnerCode\":\"MOMOYJV220260604\",\"partnerName\":\"GYMBRO\",\"storeId\":\"GYMBRO\",\"requestId\":\"REQ1011780908833106\",\"amount\":4500000,\"orderId\":\"GB101-1780908833106\",\"orderInfo\":\"GYM BRO invoice 101\",\"redirectUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/membership/checkout/momo-return/101\",\"ipnUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/webhooks/momo\",\"requestType\":\"captureWallet\",\"extraData\":\"eyJyZWdpc3RyYXRpb25JZCI6MTAxLCJtZW1iZXJJZCI6MzIsInNvdXJjZSI6Im1lbWJlcnNoaXAifQ==\",\"lang\":\"vi\",\"signature\":\"d2c654e612e467d721946bd707c83a423d002f6d2669cc53c9835ac0ff72140b\"}', '{\"responseTime\":1780908833302,\"message\":\"Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.\",\"resultCode\":13}', NULL, '2026-06-08 15:53:53', '2026-06-08 15:53:53'),
(54, 101, 'GB101-1780908834203', 'REQ1011780908834203', 4500000, NULL, NULL, NULL, 13, 'Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.', 'failed', '{\"endpoint\":\"https://payment.momo.vn/v2/gateway/api/create\",\"partnerCode\":\"MOMOYJV220260604\",\"partnerName\":\"GYMBRO\",\"storeId\":\"GYMBRO\",\"requestId\":\"REQ1011780908834203\",\"amount\":4500000,\"orderId\":\"GB101-1780908834203\",\"orderInfo\":\"GYM BRO invoice 101\",\"redirectUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/membership/checkout/momo-return/101\",\"ipnUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/webhooks/momo\",\"requestType\":\"captureWallet\",\"extraData\":\"eyJyZWdpc3RyYXRpb25JZCI6MTAxLCJtZW1iZXJJZCI6MzIsInNvdXJjZSI6Im1lbWJlcnNoaXAifQ==\",\"lang\":\"vi\",\"signature\":\"b096358a900993bf9afc67c9e8aeafe3a5321c7b651afb1b979f9dffbec54c3a\"}', '{\"responseTime\":1780908834294,\"message\":\"Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.\",\"resultCode\":13}', NULL, '2026-06-08 15:53:54', '2026-06-08 15:53:54'),
(55, 101, 'GB101-1780908834413', 'REQ1011780908834413', 4500000, NULL, NULL, NULL, 13, 'Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.', 'failed', '{\"endpoint\":\"https://payment.momo.vn/v2/gateway/api/create\",\"partnerCode\":\"MOMOYJV220260604\",\"partnerName\":\"GYMBRO\",\"storeId\":\"GYMBRO\",\"requestId\":\"REQ1011780908834413\",\"amount\":4500000,\"orderId\":\"GB101-1780908834413\",\"orderInfo\":\"GYM BRO invoice 101\",\"redirectUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/membership/checkout/momo-return/101\",\"ipnUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/webhooks/momo\",\"requestType\":\"captureWallet\",\"extraData\":\"eyJyZWdpc3RyYXRpb25JZCI6MTAxLCJtZW1iZXJJZCI6MzIsInNvdXJjZSI6Im1lbWJlcnNoaXAifQ==\",\"lang\":\"vi\",\"signature\":\"574d34514564ce19e7e72cba92cec41df97f6e7b8c62cb679463699803547342\"}', '{\"responseTime\":1780908834515,\"message\":\"Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.\",\"resultCode\":13}', NULL, '2026-06-08 15:53:54', '2026-06-08 15:53:54'),
(56, 101, 'GB101-1780908834631', 'REQ1011780908834631', 4500000, NULL, NULL, NULL, 13, 'Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.', 'failed', '{\"endpoint\":\"https://payment.momo.vn/v2/gateway/api/create\",\"partnerCode\":\"MOMOYJV220260604\",\"partnerName\":\"GYMBRO\",\"storeId\":\"GYMBRO\",\"requestId\":\"REQ1011780908834631\",\"amount\":4500000,\"orderId\":\"GB101-1780908834631\",\"orderInfo\":\"GYM BRO invoice 101\",\"redirectUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/membership/checkout/momo-return/101\",\"ipnUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/webhooks/momo\",\"requestType\":\"captureWallet\",\"extraData\":\"eyJyZWdpc3RyYXRpb25JZCI6MTAxLCJtZW1iZXJJZCI6MzIsInNvdXJjZSI6Im1lbWJlcnNoaXAifQ==\",\"lang\":\"vi\",\"signature\":\"d85bf225f42af491a084b85acd083ee49fbc7f3765d541751a745733e14a1045\"}', '{\"responseTime\":1780908834720,\"message\":\"Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.\",\"resultCode\":13}', NULL, '2026-06-08 15:53:54', '2026-06-08 15:53:54'),
(57, 101, 'GB101-1780908835372', 'REQ1011780908835372', 4500000, NULL, NULL, NULL, 13, 'Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.', 'failed', '{\"endpoint\":\"https://payment.momo.vn/v2/gateway/api/create\",\"partnerCode\":\"MOMOYJV220260604\",\"partnerName\":\"GYMBRO\",\"storeId\":\"GYMBRO\",\"requestId\":\"REQ1011780908835372\",\"amount\":4500000,\"orderId\":\"GB101-1780908835372\",\"orderInfo\":\"GYM BRO invoice 101\",\"redirectUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/membership/checkout/momo-return/101\",\"ipnUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/webhooks/momo\",\"requestType\":\"captureWallet\",\"extraData\":\"eyJyZWdpc3RyYXRpb25JZCI6MTAxLCJtZW1iZXJJZCI6MzIsInNvdXJjZSI6Im1lbWJlcnNoaXAifQ==\",\"lang\":\"vi\",\"signature\":\"95bbf9223671f86d934478a54e9b31e87ad050f020ea97e77bcb77f40fa797e2\"}', '{\"responseTime\":1780908835462,\"message\":\"Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.\",\"resultCode\":13}', NULL, '2026-06-08 15:53:55', '2026-06-08 15:53:55'),
(58, 101, 'GB101-1780909109410', 'REQ1011780909109410', 4500000, NULL, NULL, NULL, 13, 'Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.', 'failed', '{\"endpoint\":\"https://payment.momo.vn/v2/gateway/api/create\",\"partnerCode\":\"MOMOYJV220260604\",\"partnerName\":\"GYMBRO\",\"storeId\":\"GYMBRO\",\"requestId\":\"REQ1011780909109410\",\"amount\":4500000,\"orderId\":\"GB101-1780909109410\",\"orderInfo\":\"GYM BRO invoice 101\",\"redirectUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/membership/checkout/momo-return/101\",\"ipnUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/webhooks/momo\",\"requestType\":\"captureWallet\",\"extraData\":\"eyJyZWdpc3RyYXRpb25JZCI6MTAxLCJtZW1iZXJJZCI6MzIsInNvdXJjZSI6Im1lbWJlcnNoaXAifQ==\",\"lang\":\"vi\",\"signature\":\"d78d64cf04dd31724426e63682a17f80c881a32f9e755df7f00203752b2763d1\"}', '{\"responseTime\":1780909109564,\"message\":\"Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.\",\"resultCode\":13}', NULL, '2026-06-08 15:58:29', '2026-06-08 15:58:29'),
(59, 101, 'GB101-1780909109504', 'REQ1011780909109504', 4500000, NULL, NULL, NULL, 13, 'Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.', 'failed', '{\"endpoint\":\"https://payment.momo.vn/v2/gateway/api/create\",\"partnerCode\":\"MOMOYJV220260604\",\"partnerName\":\"GYMBRO\",\"storeId\":\"GYMBRO\",\"requestId\":\"REQ1011780909109504\",\"amount\":4500000,\"orderId\":\"GB101-1780909109504\",\"orderInfo\":\"GYM BRO invoice 101\",\"redirectUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/membership/checkout/momo-return/101\",\"ipnUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/webhooks/momo\",\"requestType\":\"captureWallet\",\"extraData\":\"eyJyZWdpc3RyYXRpb25JZCI6MTAxLCJtZW1iZXJJZCI6MzIsInNvdXJjZSI6Im1lbWJlcnNoaXAifQ==\",\"lang\":\"vi\",\"signature\":\"2baf665eba79526322a87afd15313d0b4c6b882cd918cb6ea5b2c650be66b0b7\"}', '{\"responseTime\":1780909109601,\"message\":\"Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.\",\"resultCode\":13}', NULL, '2026-06-08 15:58:29', '2026-06-08 15:58:29'),
(60, 101, 'GB101-1780909168271', 'REQ1011780909168271', 4500000, NULL, NULL, NULL, 13, 'Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.', 'failed', '{\"endpoint\":\"https://payment.momo.vn/v2/gateway/api/create\",\"partnerCode\":\"MOMOYJV220260604\",\"partnerName\":\"GYMBRO\",\"storeId\":\"GYMBRO\",\"requestId\":\"REQ1011780909168271\",\"amount\":4500000,\"orderId\":\"GB101-1780909168271\",\"orderInfo\":\"GYM BRO invoice 101\",\"redirectUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/membership/checkout/momo-return/101\",\"ipnUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/webhooks/momo\",\"requestType\":\"captureWallet\",\"extraData\":\"eyJyZWdpc3RyYXRpb25JZCI6MTAxLCJtZW1iZXJJZCI6MzIsInNvdXJjZSI6Im1lbWJlcnNoaXAifQ==\",\"lang\":\"vi\",\"signature\":\"d4d730e78e6992fa9b190f73da0b5fb5de3028209889dd49d930d0cff17df57c\"}', '{\"responseTime\":1780909168427,\"message\":\"Cấu hình doanh nghiệp không chính xác hoặc tài khoản không hoạt động.\",\"resultCode\":13}', NULL, '2026-06-08 15:59:28', '2026-06-08 15:59:28'),
(61, 101, 'GB101-1780910138820', 'REQ1011780910138820', 4500000, 'https://test-payment.momo.vn/v2/gateway/pay?t=TU9NT1lKVjIyMDI2MDYwNF9URVNUfEdCMTAxLTE3ODA5MTAxMzg4MjA&s=291a2b0b3ee94c7c8010ba68d3e37e718bfa0d15c061afd0d6d1def30a92261e', NULL, NULL, 0, 'Thành công.', 'pending', '{\"endpoint\":\"https://test-payment.momo.vn/v2/gateway/api/create\",\"partnerCode\":\"MOMOYJV220260604_TEST\",\"partnerName\":\"GYMBRO\",\"storeId\":\"GYMBRO\",\"requestId\":\"REQ1011780910138820\",\"amount\":4500000,\"orderId\":\"GB101-1780910138820\",\"orderInfo\":\"GYM BRO invoice 101\",\"redirectUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/membership/checkout/momo-return/101\",\"ipnUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/webhooks/momo\",\"requestType\":\"captureWallet\",\"extraData\":\"eyJyZWdpc3RyYXRpb25JZCI6MTAxLCJtZW1iZXJJZCI6MzIsInNvdXJjZSI6Im1lbWJlcnNoaXAifQ==\",\"lang\":\"vi\",\"signature\":\"0315daa36391a63f487fd53610d88f2f49a469aa2ac705df4399582715df0e09\"}', '{\"partnerCode\":\"MOMOYJV220260604_TEST\",\"orderId\":\"GB101-1780910138820\",\"requestId\":\"REQ1011780910138820\",\"amount\":4500000,\"responseTime\":1780910139000,\"message\":\"Thành công.\",\"resultCode\":0,\"payUrl\":\"https://test-payment.momo.vn/v2/gateway/pay?t=TU9NT1lKVjIyMDI2MDYwNF9URVNUfEdCMTAxLTE3ODA5MTAxMzg4MjA&s=291a2b0b3ee94c7c8010ba68d3e37e718bfa0d15c061afd0d6d1def30a92261e\"}', NULL, '2026-06-08 16:15:38', '2026-06-08 16:15:38'),
(62, 102, 'GB102-1780910170940', 'REQ1021780910170940', 1000, 'https://test-payment.momo.vn/v2/gateway/pay?t=TU9NT1lKVjIyMDI2MDYwNF9URVNUfEdCMTAyLTE3ODA5MTAxNzA5NDA&s=551f5aac8aa612f6ff2ce590d303b2bf38d549ffe82489ff05f71279afcee6dd', NULL, NULL, 0, 'Thành công.', 'pending', '{\"endpoint\":\"https://test-payment.momo.vn/v2/gateway/api/create\",\"partnerCode\":\"MOMOYJV220260604_TEST\",\"partnerName\":\"GYMBRO\",\"storeId\":\"GYMBRO\",\"requestId\":\"REQ1021780910170940\",\"amount\":1000,\"orderId\":\"GB102-1780910170940\",\"orderInfo\":\"GYM BRO invoice 102\",\"redirectUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/registrations/checkout/momo-return/102\",\"ipnUrl\":\"https://christene-squirearchical-repercussively.ngrok-free.dev/webhooks/momo\",\"requestType\":\"captureWallet\",\"extraData\":\"eyJyZWdpc3RyYXRpb25JZCI6MTAyLCJtZW1iZXJJZCI6bnVsbCwic291cmNlIjoicG9zIn0=\",\"lang\":\"vi\",\"signature\":\"855f940c91893179b888d70b08c91a602be2ca5292e373d136dc08a73abbf181\"}', '{\"partnerCode\":\"MOMOYJV220260604_TEST\",\"orderId\":\"GB102-1780910170940\",\"requestId\":\"REQ1021780910170940\",\"amount\":1000,\"responseTime\":1780910171054,\"message\":\"Thành công.\",\"resultCode\":0,\"payUrl\":\"https://test-payment.momo.vn/v2/gateway/pay?t=TU9NT1lKVjIyMDI2MDYwNF9URVNUfEdCMTAyLTE3ODA5MTAxNzA5NDA&s=551f5aac8aa612f6ff2ce590d303b2bf38d549ffe82489ff05f71279afcee6dd\"}', NULL, '2026-06-08 16:16:11', '2026-06-08 16:16:11');

-- --------------------------------------------------------

--
-- Table structure for table `packages`
--

CREATE TABLE `packages` (
  `id` int(11) NOT NULL,
  `package_name` varchar(100) NOT NULL,
  `duration_months` int(11) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `description` text DEFAULT NULL,
  `pt_sessions` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `packages`
--

INSERT INTO `packages` (`id`, `package_name`, `duration_months`, `price`, `description`, `pt_sessions`) VALUES
(1, 'Gói 1 Tháng Cơ Bản', 1, 500000.00, 'Tập luyện tự do không giới hạn\r\nSử dụng toàn bộ thiết bị hiện đại\r\nTủ đồ & Phòng tắm nóng lạnh', 0),
(2, 'Gói 3 Tháng Tiết Kiệm', 3, 1350000.00, 'Tập luyện tự do không giới hạn\r\nSử dụng toàn bộ thiết bị hiện đại\r\nTủ đồ & Phòng tắm nóng lạnh\r\nTặng kèm 10 buổi tập cùng PT định hướng\r\nMiễn phí đo chỉ số cơ thể (Inbody) hàng tháng\r\nGiảm 5% khi mua thực phẩm bổ sung tại quầy', 10),
(3, 'Gói 6 Tháng VIP', 6, 2500000.00, 'Tập luyện tự do không giới hạn\r\nSử dụng toàn bộ thiết bị hiện đại\r\nTủ đồ & Phòng tắm nóng lạnh\r\nTặng kèm 05 buổi tập PT kèm cặp riêng\r\nMiễn phí gửi xe & Khăn tắm sạch mỗi ngày\r\nĐược phép bảo lưu gói tập 30 ngày\r\nƯu tiên đặt lịch Huấn luyện viên', 40),
(5, 'Gói 12 tháng ', 12, 4500000.00, 'Tập luyện tự do không giới hạn\r\nSử dụng toàn bộ thiết bị hiện đại\r\nMức giá ưu đãi nhất hệ thống\r\nTặng kèm 60 buổi tập PT chuyên nghiệp\r\nTặng áo thun GymBro phiên bản giới hạn\r\nBảo lưu gói tập lên đến 45 ngày\r\nVoucher giảm giá 50% cho người thân đi cùng', 60),
(7, 'TEST', 1, 10000.00, '', 1);

-- --------------------------------------------------------

--
-- Table structure for table `password_reset_requests`
--

CREATE TABLE `password_reset_requests` (
  `id` int(11) NOT NULL,
  `member_id` int(11) NOT NULL,
  `requested_at` datetime NOT NULL DEFAULT current_timestamp(),
  `status` varchar(20) NOT NULL DEFAULT 'pending',
  `resolved_at` datetime DEFAULT NULL,
  `resolved_by` int(11) DEFAULT NULL,
  `note` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `password_reset_requests`
--

INSERT INTO `password_reset_requests` (`id`, `member_id`, `requested_at`, `status`, `resolved_at`, `resolved_by`, `note`) VALUES
(1, 3, '2026-04-30 22:44:24', 'resolved', '2026-04-30 22:45:21', 4, NULL),
(2, 3, '2026-05-05 13:31:21', 'resolved', '2026-05-05 13:31:45', 4, ',,'),
(3, 3, '2026-05-09 14:25:58', 'resolved', '2026-05-09 14:27:48', 4, NULL),
(4, 3, '2026-05-10 02:47:04', 'resolved', '2026-05-10 02:47:17', 4, NULL),
(5, 3, '2026-05-10 15:38:10', 'resolved', '2026-05-10 15:38:10', NULL, 'auto-reset (forgot-password)'),
(6, 28, '2026-05-11 14:28:51', 'resolved', '2026-05-11 14:28:51', NULL, 'auto-reset (forgot-password)'),
(7, 29, '2026-05-12 14:50:49', 'resolved', '2026-05-12 14:50:49', NULL, 'auto-reset (forgot-password)'),
(8, 3, '2026-05-26 15:48:34', 'resolved', '2026-05-26 15:48:34', NULL, 'auto-reset (forgot-password)');

-- --------------------------------------------------------

--
-- Table structure for table `payos_payments`
--

CREATE TABLE `payos_payments` (
  `id` int(11) NOT NULL,
  `registration_id` int(11) NOT NULL,
  `order_code` bigint(20) NOT NULL,
  `payment_link_id` varchar(80) DEFAULT NULL,
  `checkout_url` text DEFAULT NULL,
  `qr_code` text DEFAULT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'PENDING',
  `raw_response` longtext DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `payos_payments`
--

INSERT INTO `payos_payments` (`id`, `registration_id`, `order_code`, `payment_link_id`, `checkout_url`, `qr_code`, `status`, `raw_response`, `created_at`, `updated_at`) VALUES
(2, 106, 106, 'f93c7a46cf8842f69d0e420465574f7b', 'https://pay.payos.vn/web/f93c7a46cf8842f69d0e420465574f7b', '00020101021238540010A00000072701240006970422011008661086970208QRIBFTTA53037045405100005802VN62260822CSWO5AGZFH0 GYMBRO 10663045B5E', 'PAID', '{\"id\":\"f93c7a46cf8842f69d0e420465574f7b\",\"orderCode\":106,\"amount\":10000,\"amountPaid\":10000,\"amountRemaining\":0,\"status\":\"PAID\",\"createdAt\":\"2026-06-09T15:46:39+07:00\",\"transactions\":[{\"accountNumber\":\"0866108697\",\"amount\":10000,\"counterAccountBankId\":\"970422\",\"counterAccountBankName\":null,\"counterAccountName\":null,\"counterAccountNumber\":\"2281072020614\",\"description\":\"132715535020-CSWO5AGZFH0 GYMBRO 106-CHUYEN TIEN-OQCH000DAqZz-MOMO132715535020MOMO\",\"reference\":\"FT26160258930257\",\"transactionDateTime\":\"2026-06-09T15:47:00+07:00\",\"virtualAccountName\":null,\"virtualAccountNumber\":null}],\"canceledAt\":null,\"cancellationReason\":null}', '2026-06-09 15:46:39', '2026-06-09 15:59:35'),
(3, 107, 107, '12c22709190d45c58fdef4fa076ae4f7', 'https://pay.payos.vn/web/12c22709190d45c58fdef4fa076ae4f7', '00020101021238540010A00000072701240006970422011008661086970208QRIBFTTA53037045405100005802VN62260822CSQZ4V72977 GYMBRO 107630473AB', 'PAID', '{\"id\":\"12c22709190d45c58fdef4fa076ae4f7\",\"orderCode\":107,\"amount\":10000,\"amountPaid\":10000,\"amountRemaining\":0,\"status\":\"PAID\",\"createdAt\":\"2026-06-09T16:00:38+07:00\",\"transactions\":[{\"accountNumber\":\"0866108697\",\"amount\":10000,\"counterAccountBankId\":\"970422\",\"counterAccountBankName\":null,\"counterAccountName\":null,\"counterAccountNumber\":\"2281072020614\",\"description\":\"132717017206-CSQZ4V72977 GYMBRO 107-CHUYEN TIEN-OQCH000DAtQQ-MOMO132717017206MOMO\",\"reference\":\"FT26160477956530\",\"transactionDateTime\":\"2026-06-09T16:01:00+07:00\",\"virtualAccountName\":null,\"virtualAccountNumber\":null}],\"canceledAt\":null,\"cancellationReason\":null}', '2026-06-09 16:00:38', '2026-06-09 16:01:23'),
(4, 108, 108, '9ee23375a31641dcb3f1c573cccf0c98', 'https://pay.payos.vn/web/9ee23375a31641dcb3f1c573cccf0c98', '00020101021238540010A00000072701240006970422011008661086970208QRIBFTTA5303704540410005802VN62260822CSWLABWG3G5 GYMBRO 10863049868', 'PENDING', '{\"id\":\"9ee23375a31641dcb3f1c573cccf0c98\",\"orderCode\":108,\"amount\":1000,\"amountPaid\":0,\"amountRemaining\":1000,\"status\":\"PENDING\",\"createdAt\":\"2026-06-09T16:07:54+07:00\",\"transactions\":[],\"canceledAt\":null,\"cancellationReason\":null}', '2026-06-09 16:07:54', '2026-06-09 16:10:17'),
(6, 110, 110, '95c6844f26214bedac64b6667cdd4860', 'https://pay.payos.vn/web/95c6844f26214bedac64b6667cdd4860', '00020101021238540010A00000072701240006970422011008661086970208QRIBFTTA53037045405100005802VN62260822CSH4FXWJKY8 GYMBRO 11063040D79', 'PAID', '{\"id\":\"95c6844f26214bedac64b6667cdd4860\",\"orderCode\":110,\"amount\":10000,\"amountPaid\":10000,\"amountRemaining\":0,\"status\":\"PAID\",\"createdAt\":\"2026-06-09T16:18:06+07:00\",\"transactions\":[{\"accountNumber\":\"0866108697\",\"amount\":10000,\"counterAccountBankId\":\"970422\",\"counterAccountBankName\":null,\"counterAccountName\":null,\"counterAccountNumber\":\"2281072020614\",\"description\":\"132719038507-CSH4FXWJKY8 GYMBRO 110-CHUYEN TIEN-OQCH000DAxFV-MOMO132719038507MOMO\",\"reference\":\"FT26160329220059\",\"transactionDateTime\":\"2026-06-09T16:18:00+07:00\",\"virtualAccountName\":null,\"virtualAccountNumber\":null}],\"canceledAt\":null,\"cancellationReason\":null}', '2026-06-09 16:18:06', '2026-06-09 16:18:42'),
(7, 111, 111, 'a50f2c0caa234fdfa900092b26f328c9', 'https://pay.payos.vn/web/a50f2c0caa234fdfa900092b26f328c9', '00020101021238540010A00000072701240006970422011008661086970208QRIBFTTA53037045405100005802VN62260822CSEMYX4ESN8 GYMBRO 11163040AA0', 'PAID', '{\"id\":\"a50f2c0caa234fdfa900092b26f328c9\",\"orderCode\":111,\"amount\":10000,\"amountPaid\":10000,\"amountRemaining\":0,\"status\":\"PAID\",\"createdAt\":\"2026-06-09T16:19:40+07:00\",\"transactions\":[{\"accountNumber\":\"0866108697\",\"amount\":10000,\"counterAccountBankId\":\"970422\",\"counterAccountBankName\":null,\"counterAccountName\":null,\"counterAccountNumber\":\"2281072020614\",\"description\":\"132719105887-CSEMYX4ESN8 GYMBRO 111-CHUYEN TIEN-OQCH000DAxY7-MOMO132719105887MOMO\",\"reference\":\"FT26160256028753\",\"transactionDateTime\":\"2026-06-09T16:19:00+07:00\",\"virtualAccountName\":null,\"virtualAccountNumber\":null}],\"canceledAt\":null,\"cancellationReason\":null}', '2026-06-09 16:19:40', '2026-06-09 16:20:01'),
(8, 112, 112, '2299d5ba1ce84ad3a78af2ba91c2f731', 'https://pay.payos.vn/web/2299d5ba1ce84ad3a78af2ba91c2f731', '00020101021238540010A00000072701240006970422011008661086970208QRIBFTTA53037045405450005802VN62260822CSJMK0UKWX2 GYMBRO 11263047DFE', 'PENDING', '{\"bin\":\"970422\",\"accountNumber\":\"0866108697\",\"accountName\":\"TRAN VAN KHAI\",\"amount\":45000,\"description\":\"CSJMK0UKWX2 GYMBRO 112\",\"orderCode\":112,\"currency\":\"VND\",\"paymentLinkId\":\"2299d5ba1ce84ad3a78af2ba91c2f731\",\"status\":\"PENDING\",\"expiredAt\":null,\"checkoutUrl\":\"https://pay.payos.vn/web/2299d5ba1ce84ad3a78af2ba91c2f731\",\"qrCode\":\"00020101021238540010A00000072701240006970422011008661086970208QRIBFTTA53037045405450005802VN62260822CSJMK0UKWX2 GYMBRO 11263047DFE\"}', '2026-06-09 16:26:50', '2026-06-09 16:26:50'),
(9, 113, 113, 'aa66766716214de9a4fd043d34e95b78', 'https://pay.payos.vn/web/aa66766716214de9a4fd043d34e95b78', '00020101021238540010A00000072701240006970422011008661086970208QRIBFTTA53037045405450005802VN62260822CS9V4LZ9BV1 GYMBRO 113630452C0', 'PENDING', '{\"id\":\"aa66766716214de9a4fd043d34e95b78\",\"orderCode\":113,\"amount\":45000,\"amountPaid\":0,\"amountRemaining\":45000,\"status\":\"PENDING\",\"createdAt\":\"2026-06-09T16:26:50+07:00\",\"transactions\":[],\"canceledAt\":null,\"cancellationReason\":null}', '2026-06-09 16:26:50', '2026-06-09 16:26:53'),
(10, 114, 114, 'c81ae3bdec8e459d98b10d56f15ce11a', 'https://pay.payos.vn/web/c81ae3bdec8e459d98b10d56f15ce11a', '00020101021238540010A00000072701240006970422011008661086970208QRIBFTTA53037045405100005802VN62260822CS1W68FR8S5 GYMBRO 11463044D61', 'PENDING', '{\"id\":\"c81ae3bdec8e459d98b10d56f15ce11a\",\"orderCode\":114,\"amount\":10000,\"amountPaid\":0,\"amountRemaining\":10000,\"status\":\"PENDING\",\"createdAt\":\"2026-06-09T16:27:47+07:00\",\"transactions\":[],\"canceledAt\":null,\"cancellationReason\":null}', '2026-06-09 16:27:47', '2026-06-09 16:27:50'),
(11, 115, 115, '94c9e96f0e5a496c8b19f3fe9767f8a7', 'https://pay.payos.vn/web/94c9e96f0e5a496c8b19f3fe9767f8a7', '00020101021238540010A00000072701240006970422011008661086970208QRIBFTTA53037045405100005802VN62260822CSKQT4X48F1 GYMBRO 11563049131', 'PENDING', '{\"id\":\"94c9e96f0e5a496c8b19f3fe9767f8a7\",\"orderCode\":115,\"amount\":10000,\"amountPaid\":0,\"amountRemaining\":10000,\"status\":\"PENDING\",\"createdAt\":\"2026-06-09T16:45:44+07:00\",\"transactions\":[],\"canceledAt\":null,\"cancellationReason\":null}', '2026-06-09 16:45:44', '2026-06-09 16:45:47'),
(12, 117, 117, '1d70073624c64e64b5bd7d2b1f87896b', 'https://pay.payos.vn/web/1d70073624c64e64b5bd7d2b1f87896b', '00020101021238540010A00000072701240006970422011008661086970208QRIBFTTA53037045405100005802VN62260822CSHCDJOJUE4 GYMBRO 1176304A01F', 'PAID', '{\"id\":\"1d70073624c64e64b5bd7d2b1f87896b\",\"orderCode\":117,\"amount\":10000,\"amountPaid\":10000,\"amountRemaining\":0,\"status\":\"PAID\",\"createdAt\":\"2026-06-11T10:05:21+07:00\",\"transactions\":[{\"accountNumber\":\"0866108697\",\"amount\":10000,\"counterAccountBankId\":\"970422\",\"counterAccountBankName\":null,\"counterAccountName\":null,\"counterAccountNumber\":\"2281072020614\",\"description\":\"132972767339-CSHCDJOJUE4 GYMBRO 117-CHUYEN TIEN-OQCH000DHQRG-MOMO132972767339MOMO\",\"reference\":\"FT26162364054000\",\"transactionDateTime\":\"2026-06-11T10:07:00+07:00\",\"virtualAccountName\":null,\"virtualAccountNumber\":null}],\"canceledAt\":null,\"cancellationReason\":null}', '2026-06-11 10:05:22', '2026-06-11 10:07:31'),
(13, 118, 118, '6573f4774e944f8ea7d519df9ab4cbf9', 'https://pay.payos.vn/web/6573f4774e944f8ea7d519df9ab4cbf9', '00020101021238540010A00000072701240006970422011008661086970208QRIBFTTA53037045405100005802VN62260822CSZEP6T5FT4 GYMBRO 1186304C081', 'PAID', '{\"id\":\"6573f4774e944f8ea7d519df9ab4cbf9\",\"orderCode\":118,\"amount\":10000,\"amountPaid\":10000,\"amountRemaining\":0,\"status\":\"PAID\",\"createdAt\":\"2026-06-11T10:08:28+07:00\",\"transactions\":[{\"accountNumber\":\"0866108697\",\"amount\":10000,\"counterAccountBankId\":\"970422\",\"counterAccountBankName\":null,\"counterAccountName\":null,\"counterAccountNumber\":\"2281072020614\",\"description\":\"132973098175-CSZEP6T5FT4 GYMBRO 118-CHUYEN TIEN-OQCH000DHQgQ-MOMO132973098175MOMO\",\"reference\":\"FT26162694725175\",\"transactionDateTime\":\"2026-06-11T10:08:00+07:00\",\"virtualAccountName\":null,\"virtualAccountNumber\":null}],\"canceledAt\":null,\"cancellationReason\":null}', '2026-06-11 10:08:28', '2026-06-11 10:08:52'),
(18, 123, 123, 'e9e3bb1dfe82491fa90d749d7f92a0c0', 'https://pay.payos.vn/web/e9e3bb1dfe82491fa90d749d7f92a0c0', '00020101021238540010A00000072701240006970422011008661086970208QRIBFTTA5303704540713406675802VN62260822CSSP81Q9B88 GYMBRO 12363047361', 'PENDING', '{\"id\":\"e9e3bb1dfe82491fa90d749d7f92a0c0\",\"orderCode\":123,\"amount\":1340667,\"amountPaid\":0,\"amountRemaining\":1340667,\"status\":\"PENDING\",\"createdAt\":\"2026-06-11T11:31:03+07:00\",\"transactions\":[],\"canceledAt\":null,\"cancellationReason\":null}', '2026-06-11 11:31:03', '2026-06-11 11:31:06');

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` int(11) NOT NULL,
  `product_name` varchar(255) NOT NULL,
  `category` varchar(100) DEFAULT 'Khác',
  `price` decimal(15,2) NOT NULL,
  `stock_quantity` int(11) DEFAULT 0,
  `image_url` varchar(255) DEFAULT NULL,
  `status` enum('Active','Inactive') DEFAULT 'Active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `product_name`, `category`, `price`, `stock_quantity`, `image_url`, `status`) VALUES
(1, 'Nước suối Aquafina 500ml', 'Đồ uống', 10000.00, 89, 'https://cdn.famitaa.net/storage/uploads/noidung/aquafina-500ml-nuoc-tinh-khiet_00393.jpg', 'Active'),
(2, 'Nước tăng lực Monster', 'Đồ uống', 45000.00, 30, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSS0wa3e5ep66AOFnJbxR2sIHJoO-_bALsO4g&s', 'Active'),
(3, 'Whey Gold Standard 5lbs', 'Thực phẩm bổ sung', 1850000.00, 11, 'https://contents.mediadecathlon.com/p2576389/k$23c0b81f7415350d21a38dc5000dafc2/b%E1%BB%99t-whey-protein-optimum-nutrition-gold-standard-100-v%E1%BB%8B-vani-5lbs-2-27-kg-optimum-nutrition-8860441.jpg?f=1920x0&format=auto', 'Active'),
(4, 'Găng tay tập Gym cao cấp', 'Phụ kiện', 170000.00, 97, 'https://tuanvisport.com.vn/wp-content/uploads/2023/07/gang-tay-tap-gym-nam-aolieks-1.jpg', 'Active'),
(5, 'Test', 'Đồ uống', 10000.00, 3, 'https://cdn.eva.vn/upload/3-2019/images/2019-08-22/8-do-vat-tham-dam-hoa-chat-nha-nao-cung-co-it-nhat-3-thu-phai-vut-ngay-chao-tefal6-1566448440-247-width700height700.jpg', 'Active');

-- --------------------------------------------------------

--
-- Table structure for table `pt_sessions_log`
--

CREATE TABLE `pt_sessions_log` (
  `id` int(11) NOT NULL,
  `registration_id` int(11) NOT NULL,
  `member_id` int(11) NOT NULL,
  `trainer_id` int(11) DEFAULT NULL,
  `session_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `note` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `pt_sessions_log`
--

INSERT INTO `pt_sessions_log` (`id`, `registration_id`, `member_id`, `trainer_id`, `session_date`, `note`, `created_at`) VALUES
(1, 10, 3, 1, '2026-04-20 09:00:38', 'Hoàn thành buổi tập', '2026-05-11 21:02:45'),
(2, 55, 3, 3, '2026-05-05 08:20:09', 'Hoàn thành buổi tập', '2026-05-11 21:02:45'),
(3, 55, 3, 5, '2026-05-05 08:20:21', 'Hoàn thành buổi tập', '2026-05-11 21:02:45'),
(4, 55, 3, NULL, '2026-05-11 09:52:56', 'Hoàn thành buổi tập', '2026-05-11 21:02:45'),
(5, 55, 3, NULL, '2026-05-11 14:46:27', 'Hoàn thành buổi tập', '2026-05-11 21:46:27'),
(6, 55, 3, NULL, '2026-05-11 14:46:31', 'Hoàn thành buổi tập', '2026-05-11 21:46:31'),
(7, 55, 3, NULL, '2026-05-14 03:31:57', 'Hoàn thành buổi tập', '2026-05-14 10:31:57'),
(8, 55, 3, NULL, '2026-05-14 03:32:00', 'Hoàn thành buổi tập', '2026-05-14 10:32:00'),
(9, 55, 3, NULL, '2026-05-14 03:32:04', 'Hoàn thành buổi tập', '2026-05-14 10:32:04'),
(10, 55, 3, NULL, '2026-05-14 03:32:15', 'Hoàn thành buổi tập', '2026-05-14 10:32:15'),
(11, 55, 3, NULL, '2026-05-14 03:32:59', 'Hoàn thành buổi tập', '2026-05-14 10:32:59'),
(12, 58, 26, NULL, '2026-05-14 03:35:41', 'Hoàn thành buổi tập', '2026-05-14 10:35:41'),
(13, 58, 26, NULL, '2026-05-14 03:41:12', 'Hoàn thành buổi tập', '2026-05-14 10:41:12');

-- --------------------------------------------------------

--
-- Table structure for table `registrations`
--

CREATE TABLE `registrations` (
  `id` int(11) NOT NULL,
  `member_id` int(11) DEFAULT NULL,
  `package_id` int(11) DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `registration_date` date NOT NULL,
  `expiration_date` date NOT NULL,
  `status` enum('active','expired','cancelled') DEFAULT 'active',
  `upgrade_from_registration_id` int(11) DEFAULT NULL,
  `upgrade_credit_amount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `upgrade_total_days` int(11) DEFAULT NULL,
  `upgrade_days_remaining` int(11) DEFAULT NULL,
  `payment_status` enum('Pending','Success','Failed') DEFAULT 'Success',
  `payment_method` varchar(50) DEFAULT 'Tiền mặt',
  `total_sessions` int(11) DEFAULT 0,
  `used_sessions` int(11) DEFAULT 0,
  `discount_code_id` int(11) DEFAULT NULL,
  `discount_amount` decimal(12,2) NOT NULL DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `registrations`
--

INSERT INTO `registrations` (`id`, `member_id`, `package_id`, `price`, `registration_date`, `expiration_date`, `status`, `upgrade_from_registration_id`, `upgrade_credit_amount`, `upgrade_total_days`, `upgrade_days_remaining`, `payment_status`, `payment_method`, `total_sessions`, `used_sessions`, `discount_code_id`, `discount_amount`) VALUES
(49, NULL, NULL, 1895000.00, '2026-04-23', '2026-04-23', 'active', NULL, 0.00, NULL, NULL, 'Success', 'Chuyển khoản', 0, 0, NULL, 0.00),
(55, 3, 2, 1350000.00, '2026-04-23', '2026-07-23', 'active', NULL, 0.00, NULL, NULL, 'Success', 'Chuyển khoản', 10, 10, NULL, 0.00),
(56, NULL, NULL, 270000.00, '2026-04-28', '2026-04-28', 'active', NULL, 0.00, NULL, NULL, 'Success', 'Chuyển khoản', 0, 0, NULL, 0.00),
(58, 26, 5, 4500000.00, '2026-04-30', '2027-04-30', 'active', NULL, 0.00, NULL, NULL, 'Success', 'Chuyển khoản', 60, 2, NULL, 0.00),
(60, 21, 2, 1350000.00, '2026-05-05', '2026-08-05', 'active', NULL, 0.00, NULL, NULL, 'Success', 'Chuyển khoản', 10, 0, NULL, 0.00),
(63, 14, 2, 1350000.00, '2026-05-05', '2026-08-05', 'active', NULL, 0.00, NULL, NULL, 'Success', 'Chuyển khoản', 10, 0, NULL, 0.00),
(64, 21, 1, 2530000.00, '2026-05-09', '2026-06-09', 'active', NULL, 0.00, NULL, NULL, 'Success', 'Tiền mặt', 0, 0, NULL, 0.00),
(65, 8, 2, 2766750.00, '2026-05-10', '2026-08-10', 'active', NULL, 0.00, NULL, NULL, 'Success', 'Chuyển khoản', 10, 0, NULL, 488250.00),
(67, 15, NULL, 1850000.00, '2026-05-11', '2026-05-11', 'active', NULL, 0.00, NULL, NULL, 'Success', 'Chuyển khoản', 0, 0, NULL, 0.00),
(68, 26, 1, 500000.00, '2026-05-11', '2026-06-11', 'active', NULL, 0.00, NULL, NULL, 'Success', 'Chuyển khoản', 0, 0, NULL, 0.00),
(73, 29, 2, 1405000.00, '2026-05-26', '2026-08-26', 'active', NULL, 0.00, NULL, NULL, 'Success', 'Chuyển khoản', 10, 0, NULL, 0.00),
(75, 26, NULL, 10000.00, '2026-06-02', '2026-06-02', 'active', NULL, 0.00, NULL, NULL, 'Success', 'Chuyển khoản', 0, 0, NULL, 0.00),
(76, NULL, NULL, 1850000.00, '2026-06-02', '2026-06-02', 'active', NULL, 0.00, NULL, NULL, 'Success', 'Chuyển khoản tự động', 0, 0, NULL, 0.00),
(77, NULL, NULL, 170000.00, '2026-06-02', '2026-06-02', 'active', NULL, 0.00, NULL, NULL, 'Success', 'Chuyển khoản tự động', 0, 0, NULL, 0.00),
(80, 1, 2, 1350000.00, '2026-06-02', '2026-09-02', 'active', NULL, 0.00, NULL, NULL, 'Success', 'Chuyển khoản tự động', 10, 0, NULL, 0.00),
(81, 10, 2, 1350000.00, '2026-06-02', '2026-09-02', 'active', NULL, 0.00, NULL, NULL, 'Success', 'Chuyển khoản tự động', 10, 0, NULL, 0.00),
(82, 2, 2, 1350000.00, '2026-06-04', '2026-09-04', 'active', NULL, 0.00, NULL, NULL, 'Success', 'MoMo', 10, 0, NULL, 0.00),
(90, 13, 3, 2500000.00, '2026-06-04', '2026-12-04', 'active', NULL, 0.00, NULL, NULL, 'Success', 'MoMo', 40, 0, NULL, 0.00),
(94, 31, 1, 500000.00, '2026-06-08', '2026-07-08', 'active', NULL, 0.00, NULL, NULL, 'Pending', 'MoMo', 0, 0, NULL, 0.00),
(95, NULL, NULL, 45000.00, '2026-06-08', '2026-06-08', 'active', NULL, 0.00, NULL, NULL, 'Pending', 'Tiền mặt', 0, 0, NULL, 0.00),
(96, NULL, NULL, 1000.00, '2026-06-08', '2026-06-08', 'active', NULL, 0.00, NULL, NULL, 'Pending', 'Tiền mặt', 0, 0, NULL, 0.00),
(97, NULL, NULL, 1000.00, '2026-06-08', '2026-06-08', 'active', NULL, 0.00, NULL, NULL, 'Pending', 'Tiền mặt', 0, 0, NULL, 0.00),
(98, NULL, NULL, 1000.00, '2026-06-08', '2026-06-08', 'active', NULL, 0.00, NULL, NULL, 'Pending', 'Tiền mặt', 0, 0, NULL, 0.00),
(99, NULL, NULL, 1000.00, '2026-06-08', '2026-06-08', 'active', NULL, 0.00, NULL, NULL, 'Pending', 'Tiền mặt', 0, 0, NULL, 0.00),
(100, NULL, NULL, 1000.00, '2026-06-08', '2026-06-08', 'active', NULL, 0.00, NULL, NULL, 'Pending', 'Tiền mặt', 0, 0, NULL, 0.00),
(106, 32, 1, 10000.00, '2026-06-09', '2026-07-09', 'active', NULL, 0.00, NULL, NULL, 'Success', 'payOS', 0, 0, NULL, 0.00),
(107, 33, 1, 10000.00, '2026-06-09', '2026-07-09', 'active', NULL, 0.00, NULL, NULL, 'Success', 'payOS', 0, 0, NULL, 0.00),
(108, NULL, NULL, 1000.00, '2026-06-09', '2026-06-09', 'active', NULL, 0.00, NULL, NULL, 'Pending', 'Tiền mặt', 0, 0, NULL, 0.00),
(110, NULL, NULL, 10000.00, '2026-06-09', '2026-06-09', 'active', NULL, 0.00, NULL, NULL, 'Success', 'payOS', 0, 0, NULL, 0.00),
(111, 34, 1, 10000.00, '2026-06-09', '2026-07-09', 'active', NULL, 0.00, NULL, NULL, 'Success', 'payOS', 0, 0, NULL, 0.00),
(112, NULL, NULL, 45000.00, '2026-06-09', '2026-06-09', 'active', NULL, 0.00, NULL, NULL, 'Pending', 'Tiền mặt', 0, 0, NULL, 0.00),
(113, NULL, NULL, 45000.00, '2026-06-09', '2026-06-09', 'active', NULL, 0.00, NULL, NULL, 'Pending', 'Tiền mặt', 0, 0, NULL, 0.00),
(114, NULL, NULL, 10000.00, '2026-06-09', '2026-06-09', 'active', NULL, 0.00, NULL, NULL, 'Success', 'Tiền mặt', 0, 0, NULL, 0.00),
(115, NULL, NULL, 10000.00, '2026-06-09', '2026-06-09', 'active', NULL, 0.00, NULL, NULL, 'Pending', 'Tiền mặt', 0, 0, NULL, 0.00),
(116, NULL, NULL, 45000.00, '2026-06-09', '2026-06-09', 'active', NULL, 0.00, NULL, NULL, 'Pending', 'Tiền mặt', 0, 0, NULL, 0.00),
(117, NULL, NULL, 10000.00, '2026-06-11', '2026-06-11', 'active', NULL, 0.00, NULL, NULL, 'Success', 'payOS', 0, 0, NULL, 0.00),
(118, 36, 1, 10000.00, '2026-06-11', '2026-07-11', 'active', NULL, 0.00, NULL, NULL, 'Success', 'payOS', 0, 0, NULL, 0.00),
(123, 33, 2, 1340667.00, '2026-06-09', '2026-09-09', 'active', 107, 9333.00, 30, 28, 'Pending', 'payOS', 10, 0, NULL, 0.00);

-- --------------------------------------------------------

--
-- Table structure for table `registration_details`
--

CREATE TABLE `registration_details` (
  `id` int(11) NOT NULL,
  `registration_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `price` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `registration_details`
--

INSERT INTO `registration_details` (`id`, `registration_id`, `product_id`, `quantity`, `price`) VALUES
(1, 20, 4, 1, 170000),
(2, 21, 4, 1, 170000),
(3, 22, 2, 2, 45000),
(4, 22, 4, 1, 170000),
(5, 23, 4, 1, 170000),
(6, 24, 4, 1, 170000),
(7, 25, 4, 1, 170000),
(8, 26, 4, 1, 170000),
(9, 27, 4, 1, 170000),
(10, 28, 4, 1, 170000),
(11, 29, 2, 1, 45000),
(12, 30, 4, 1, 170000),
(13, 31, 4, 1, 170000),
(14, 32, 4, 2, 170000),
(15, 33, 2, 1, 45000),
(16, 33, 1, 1, 10000),
(17, 34, 2, 1, 45000),
(18, 35, 2, 3, 45000),
(19, 35, 3, 3, 1850000),
(20, 36, 2, 2, 45000),
(21, 37, 1, 3, 10000),
(22, 38, 1, 2, 10000),
(23, 39, 2, 2, 45000),
(24, 40, 1, 1, 10000),
(25, 41, 2, 1, 45000),
(26, 41, 1, 1, 10000),
(27, 42, 2, 1, 45000),
(28, 43, 2, 1, 45000),
(29, 44, 4, 1, 170000),
(30, 45, 2, 1, 45000),
(31, 46, 2, 1, 45000),
(32, 47, 2, 1, 45000),
(33, 47, 1, 1, 10000),
(34, 48, 4, 1, 170000),
(35, 48, 3, 1, 1850000),
(36, 49, 2, 1, 45000),
(37, 49, 3, 1, 1850000),
(43, 56, 2, 2, 45000),
(44, 56, 4, 1, 170000),
(45, 56, 1, 1, 10000),
(54, 64, 1, 1, 10000),
(55, 64, 4, 1, 170000),
(56, 64, 3, 1, 1850000),
(57, 65, 1, 1, 10000),
(58, 65, 2, 1, 45000),
(59, 65, 3, 1, 1850000),
(63, 67, 3, 1, 1850000),
(71, 73, 1, 1, 10000),
(72, 73, 2, 1, 45000),
(74, 75, 1, 1, 10000),
(75, 76, 3, 1, 1850000),
(76, 77, 4, 1, 170000),
(81, 95, 2, 1, 45000),
(82, 96, 5, 1, 1000),
(83, 97, 5, 1, 1000),
(84, 98, 5, 1, 1000),
(85, 99, 5, 1, 1000),
(86, 100, 5, 1, 1000),
(90, 108, 5, 1, 1000),
(91, 110, 1, 1, 10000),
(92, 112, 2, 1, 45000),
(93, 113, 2, 1, 45000),
(94, 114, 5, 1, 10000),
(95, 115, 1, 1, 10000),
(96, 116, 2, 1, 45000),
(97, 117, 1, 1, 10000);

-- --------------------------------------------------------

--
-- Table structure for table `sessions`
--

CREATE TABLE `sessions` (
  `session_id` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `expires` int(11) UNSIGNED NOT NULL,
  `data` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `sessions`
--

INSERT INTO `sessions` (`session_id`, `expires`, `data`) VALUES
('4M1miADM503H3dCdBY4HYWoRirDr0HGs', 1781540571, '{\"cookie\":{\"originalMaxAge\":28800000,\"expires\":\"2026-06-15T16:22:50.920Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"csrfToken\":\"7877b1b4e89cc022b6224da45f2a8c9a2ebb6c153e2ed81560bcfc8a2d1344378a782f6f99999fbd9ac852a5cb258ac26ec0be2c30ec6de4503e04a4f9c162a46e00dfa0d731770488ba15ca0be4ef75a217856f277181e225137785599bd0ac3da83ce922398dfc8b3c8442be6a5320b2ac9241293f2ef49ab648f2696aec04\"}');

-- --------------------------------------------------------

--
-- Table structure for table `system_settings`
--

CREATE TABLE `system_settings` (
  `setting_key` varchar(80) NOT NULL,
  `setting_value` text DEFAULT NULL,
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `system_settings`
--

INSERT INTO `system_settings` (`setting_key`, `setting_value`, `updated_at`) VALUES
('address', 'Thông Tây Hội, TP. Hồ Chí Minh', '2026-06-01 14:20:54'),
('bank_account', '0866108697', '2026-06-02 13:37:50'),
('bank_account_name', 'GYM BRO', '2026-06-02 13:32:54'),
('bank_bin', 'mbbank', '2026-06-09 14:35:48'),
('bank_code', 'mbbank', '2026-06-02 13:32:54'),
('email', 'hello@gymbro.vn', '2026-05-28 11:48:56'),
('gym_name', 'GYM BRO', '2026-06-01 14:20:54'),
('hotline', '0900 000 000', '2026-05-28 11:48:56'),
('map_embed_url', 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d32697.38628012811!2d106.66191697431638!3d10.827539600000001!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x317528f4a62fce9b%3A0xc99902aa1e26ef02!2zVHLGsOG7nW5nIMSQ4bqhaSBo4buNYyBWxINuIExhbmcgLSBDxqEgc-G7nyBjaMOtbmg!5e1!3m2!1svi!2s!4v1780298508293!5m2!1svi!2s', '2026-06-01 14:22:20'),
('opening_hours', '05:00 - 22:00 mỗi ngày', '2026-05-28 11:48:56'),
('zalo_phone', '0900000000', '2026-05-28 11:48:56');

-- --------------------------------------------------------

--
-- Table structure for table `trainers`
--

CREATE TABLE `trainers` (
  `id` int(11) NOT NULL,
  `fullname` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `specialty` varchar(100) DEFAULT NULL,
  `experience_years` int(11) DEFAULT 0,
  `image_url` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `trainers`
--

INSERT INTO `trainers` (`id`, `fullname`, `phone`, `specialty`, `experience_years`, `image_url`, `description`, `status`, `created_at`) VALUES
(1, 'Trần Lực', '0901234567', 'Tăng cơ giảm mỡ', 5, 'https://mbhfit.vn/wp-content/uploads/2019/05/huan-luyen-vien-the-hinh.jpg', 'qưertyuio', NULL, '2026-04-20 07:20:26'),
(2, 'Trần Thanh Thủy', '0987654321', 'Yoga, Cải thiện tư thế', 7, 'https://img.meta.com.vn/data/image/2023/01/28/lich-tap-gym-cho-nu-1.jpg', '', NULL, '2026-04-21 09:06:19'),
(4, 'Lê Hoàng Phong', '0909123456', 'Boxing, Thể lực', 4, 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=500&q=80', 'Cựu vận động viên Boxing thành phố. Bài tập cường độ cao giúp đốt mỡ cực nhanh, rèn luyện phản xạ và kỹ năng tự vệ thực chiến.', 'Active', '2026-04-21 09:10:58'),
(5, 'Phạm Mai Anh', '0933456789', 'Giảm cân, Pilates', 6, 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=500&q=80', 'Thấu hiểu cơ thể phụ nữ. Chuyên thiết kế lộ trình giảm cân an toàn không nhịn ăn, kết hợp các bài tập Pilates định hình đường cong.', 'Inactive', '2026-04-21 09:10:58');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_audit_actor_time` (`actor_id`,`created_at`),
  ADD KEY `idx_audit_entity_time` (`entity_type`,`entity_id`,`created_at`),
  ADD KEY `idx_audit_action_time` (`action`,`created_at`);

--
-- Indexes for table `bank_transactions`
--
ALTER TABLE `bank_transactions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_bank_transaction` (`provider`,`transaction_id`),
  ADD KEY `idx_bank_transaction_registration` (`registration_id`,`received_at`);

--
-- Indexes for table `bookings`
--
ALTER TABLE `bookings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_bk_member_time` (`member_id`,`start_time`),
  ADD KEY `idx_bk_trainer_time` (`trainer_id`,`start_time`),
  ADD KEY `idx_bk_status_time` (`status`,`start_time`);

--
-- Indexes for table `checkin_history`
--
ALTER TABLE `checkin_history`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `contact_messages`
--
ALTER TABLE `contact_messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_contact_messages_created` (`created_at`),
  ADD KEY `idx_contact_messages_unread` (`is_read`,`created_at`);

--
-- Indexes for table `discount_codes`
--
ALTER TABLE `discount_codes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`),
  ADD KEY `idx_dc_status_dates` (`status`,`valid_from`,`valid_to`),
  ADD KEY `idx_dc_member` (`member_id`);

--
-- Indexes for table `members`
--
ALTER TABLE `members`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_phone` (`phone`),
  ADD KEY `idx_members_email` (`email`);

--
-- Indexes for table `momo_payments`
--
ALTER TABLE `momo_payments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_momo_order` (`order_id`),
  ADD KEY `idx_momo_registration` (`registration_id`,`created_at`);

--
-- Indexes for table `packages`
--
ALTER TABLE `packages`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `password_reset_requests`
--
ALTER TABLE `password_reset_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_prr_member` (`member_id`),
  ADD KEY `fk_prr_resolver` (`resolved_by`),
  ADD KEY `idx_prr_status_time` (`status`,`requested_at`);

--
-- Indexes for table `payos_payments`
--
ALTER TABLE `payos_payments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `order_code` (`order_code`),
  ADD KEY `idx_payos_registration` (`registration_id`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `pt_sessions_log`
--
ALTER TABLE `pt_sessions_log`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `registrations`
--
ALTER TABLE `registrations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `member_id` (`member_id`),
  ADD KEY `package_id` (`package_id`),
  ADD KEY `fk_reg_discount` (`discount_code_id`);

--
-- Indexes for table `registration_details`
--
ALTER TABLE `registration_details`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`session_id`);

--
-- Indexes for table `system_settings`
--
ALTER TABLE `system_settings`
  ADD PRIMARY KEY (`setting_key`);

--
-- Indexes for table `trainers`
--
ALTER TABLE `trainers`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=93;

--
-- AUTO_INCREMENT for table `bank_transactions`
--
ALTER TABLE `bank_transactions`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `bookings`
--
ALTER TABLE `bookings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT for table `checkin_history`
--
ALTER TABLE `checkin_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=28;

--
-- AUTO_INCREMENT for table `contact_messages`
--
ALTER TABLE `contact_messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `discount_codes`
--
ALTER TABLE `discount_codes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=257;

--
-- AUTO_INCREMENT for table `members`
--
ALTER TABLE `members`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT for table `momo_payments`
--
ALTER TABLE `momo_payments`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=63;

--
-- AUTO_INCREMENT for table `packages`
--
ALTER TABLE `packages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `password_reset_requests`
--
ALTER TABLE `password_reset_requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `payos_payments`
--
ALTER TABLE `payos_payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `pt_sessions_log`
--
ALTER TABLE `pt_sessions_log`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `registrations`
--
ALTER TABLE `registrations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=127;

--
-- AUTO_INCREMENT for table `registration_details`
--
ALTER TABLE `registration_details`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=102;

--
-- AUTO_INCREMENT for table `trainers`
--
ALTER TABLE `trainers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `bookings`
--
ALTER TABLE `bookings`
  ADD CONSTRAINT `fk_bk_member` FOREIGN KEY (`member_id`) REFERENCES `members` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_bk_trainer` FOREIGN KEY (`trainer_id`) REFERENCES `trainers` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `discount_codes`
--
ALTER TABLE `discount_codes`
  ADD CONSTRAINT `fk_dc_member` FOREIGN KEY (`member_id`) REFERENCES `members` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `password_reset_requests`
--
ALTER TABLE `password_reset_requests`
  ADD CONSTRAINT `fk_prr_member` FOREIGN KEY (`member_id`) REFERENCES `members` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_prr_resolver` FOREIGN KEY (`resolved_by`) REFERENCES `members` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `payos_payments`
--
ALTER TABLE `payos_payments`
  ADD CONSTRAINT `fk_payos_registration` FOREIGN KEY (`registration_id`) REFERENCES `registrations` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `registrations`
--
ALTER TABLE `registrations`
  ADD CONSTRAINT `fk_reg_discount` FOREIGN KEY (`discount_code_id`) REFERENCES `discount_codes` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `registrations_ibfk_1` FOREIGN KEY (`member_id`) REFERENCES `members` (`id`),
  ADD CONSTRAINT `registrations_ibfk_2` FOREIGN KEY (`package_id`) REFERENCES `packages` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
