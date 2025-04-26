-- MySQL dump 10.13  Distrib 8.0.41, for Linux (x86_64)
--
-- Host: localhost    Database: rental_app
-- ------------------------------------------------------
-- Server version	8.0.41-0ubuntu0.24.04.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `banks`
--

DROP TABLE IF EXISTS `banks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `banks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `branch` varchar(255) NOT NULL,
  `accountNumber` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `buildings`
--

DROP TABLE IF EXISTS `buildings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `buildings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `address` varchar(255) DEFAULT NULL,
  `noOfFloors` int NOT NULL,
  `noOfBasements` int NOT NULL,
  `floors` json NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `leases`
--

DROP TABLE IF EXISTS `leases`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `leases` (
  `id` int NOT NULL AUTO_INCREMENT,
  `startDate` datetime DEFAULT NULL,
  `endDate` datetime DEFAULT NULL,
  `tenantId` int DEFAULT NULL,
  `roomIds` text,
  `paymentType` enum('PREPAID','POSTPAID') DEFAULT 'PREPAID',
  `paymentAmountPerMonth` json DEFAULT NULL,
  `deposit` decimal(10,0) DEFAULT NULL,
  `paymentIntervalInMonths` int DEFAULT NULL,
  `initialPayment` json DEFAULT NULL,
  `lateFee` decimal(10,0) DEFAULT NULL,
  `lateFeeType` enum('FIXED','PERCENTAGE') DEFAULT 'PERCENTAGE',
  `lateFeeGracePeriodInDays` int DEFAULT NULL,
  `files` json DEFAULT NULL,
  `active` tinyint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_175030e58c0d1accdb888a431d8` (`tenantId`),
  CONSTRAINT `FK_175030e58c0d1accdb888a431d8` FOREIGN KEY (`tenantId`) REFERENCES `tenants` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=375 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `notification`
--

DROP TABLE IF EXISTS `notification`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenantId` int NOT NULL,
  `phoneNumber` varchar(255) NOT NULL,
  `message` varchar(255) NOT NULL,
  `status` enum('PENDING','SENT','FAILED') NOT NULL DEFAULT 'PENDING',
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `FK_734235b45e4310eb80816139bcf` (`tenantId`),
  CONSTRAINT `FK_734235b45e4310eb80816139bcf` FOREIGN KEY (`tenantId`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `payment_schedules`
--

DROP TABLE IF EXISTS `payment_schedules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment_schedules` (
  `id` int NOT NULL AUTO_INCREMENT,
  `payableAmount` decimal(10,0) NOT NULL,
  `paidAmount` decimal(10,0) NOT NULL,
  `dueDate` datetime NOT NULL,
  `leaseId` int NOT NULL,
  `paymentDate` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_8480d1f8be35d04691d64f5a2a5` (`leaseId`),
  CONSTRAINT `FK_8480d1f8be35d04691d64f5a2a5` FOREIGN KEY (`leaseId`) REFERENCES `leases` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10777 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `leaseId` int NOT NULL,
  `paidAmount` decimal(10,0) NOT NULL,
  `paymentDate` datetime NOT NULL,
  `paymentMethod` enum('BANK_TRANSFER') NOT NULL DEFAULT 'BANK_TRANSFER',
  `bankId` int NOT NULL,
  `referenceNumber` varchar(255) NOT NULL,
  `notes` varchar(255) DEFAULT NULL,
  `isVerified` tinyint NOT NULL DEFAULT '0',
  `verifiedAt` datetime DEFAULT NULL,
  `bankSlipPath` varchar(255) DEFAULT NULL,
  `invoicePath` varchar(255) DEFAULT NULL,
  `invoiceNumber` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_bank_reference` (`bankId`,`referenceNumber`),
  KEY `FK_d0e156af6bcda64dc420f44ae1c` (`leaseId`),
  CONSTRAINT `FK_3fd84252c648e18b10784137ca4` FOREIGN KEY (`bankId`) REFERENCES `banks` (`id`),
  CONSTRAINT `FK_d0e156af6bcda64dc420f44ae1c` FOREIGN KEY (`leaseId`) REFERENCES `leases` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `rooms`
--

DROP TABLE IF EXISTS `rooms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rooms` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `floorNumber` varchar(255) NOT NULL,
  `buildingId` int NOT NULL,
  `occupied` tinyint NOT NULL,
  `purpose` varchar(255) DEFAULT NULL,
  `sizeInSquareMeters` float DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_7d8ada3d79941a34d1c276872b` (`name`,`buildingId`),
  KEY `FK_0390a2fda90b13e8f578ff920c1` (`buildingId`),
  CONSTRAINT `FK_0390a2fda90b13e8f578ff920c1` FOREIGN KEY (`buildingId`) REFERENCES `buildings` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=384 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `session`
--

DROP TABLE IF EXISTS `session`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `session` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `expiresAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tenants`
--

DROP TABLE IF EXISTS `tenants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tenants` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `tinNumber` varchar(255) DEFAULT NULL,
  `isShareholder` tinyint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_af4c21c23f645268f888363014` (`name`,`phone`)
) ENGINE=InnoDB AUTO_INCREMENT=354 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `phone` varchar(255) NOT NULL,
  `role` enum('SUPERADMIN','ADMIN','BUILDING_ADMIN','TENANT','BOARD_MEMBER','FINANCE_ADMIN','EMPTY') NOT NULL DEFAULT 'EMPTY',
  `password` varchar(255) NOT NULL,
  `buildingId` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_a000cca60bcf04454e72769949` (`phone`),
  KEY `FK_eef1b7919fb5c7b217df6f0b855` (`buildingId`),
  CONSTRAINT `FK_eef1b7919fb5c7b217df6f0b855` FOREIGN KEY (`buildingId`) REFERENCES `buildings` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=46 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-04-25  9:11:36
