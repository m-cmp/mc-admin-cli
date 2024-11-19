CREATE DATABASE IF NOT EXISTS cost;

USE cost;

-- cost.alarm_history definition

CREATE TABLE `alarm_history` (
                                 `event_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NOT NULL,
                                 `resource_id` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NOT NULL,
                                 `resource_type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NOT NULL,
                                 `occure_dt` timestamp NOT NULL,
                                 `account_id` varchar(100) DEFAULT NULL,
                                 `urgency` varchar(20) DEFAULT NULL,
                                 `plan` varchar(20) DEFAULT NULL,
                                 `note` varchar(200) DEFAULT NULL,
                                 `occure_date` timestamp NOT NULL,
                                 `csp_type` varchar(10) NOT NULL,
                                 `alarm_impl` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NOT NULL,
                                 `project_cd` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'BLANK_00_',
                                 PRIMARY KEY (`event_type`,`resource_id`,`resource_type`,`occure_date`,`csp_type`,`alarm_impl`,`project_cd`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- cost.asset_compute_metric definition

CREATE TABLE `asset_compute_metric` (
                                        `csp_type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NOT NULL,
                                        `csp_account` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
                                        `csp_instanceid` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NOT NULL,
                                        `collect_dt` timestamp NOT NULL,
                                        `metric_type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NOT NULL COMMENT 'CPU/NETWORK',
                                        `metric_amount` double DEFAULT NULL,
                                        `resource_status` varchar(100) DEFAULT NULL,
                                        `resource_spot_yn` varchar(1) DEFAULT 'N',
                                        PRIMARY KEY (`csp_type`,`csp_instanceid`,`collect_dt`,`metric_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- cost.asset_rsopt_settings definition

CREATE TABLE `asset_rsopt_settings` (
                                        `csp_type` varchar(100) DEFAULT NULL,
                                        `metric_type` varchar(100) DEFAULT NULL,
                                        `regress_duration` int DEFAULT NULL,
                                        `criteria_value` double DEFAULT NULL,
                                        `cmp_user_id` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- cost.cur_origin definition

CREATE TABLE `cur_origin` (
                              `lineitem_usageaccountid` varchar(100) NOT NULL COMMENT 'AWS 서브계정 구분 ID',
                              `lineitem_productcode` varchar(100) NOT NULL COMMENT '서비스구분코드',
                              `lineitem_resourceid` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci DEFAULT NULL COMMENT '인스턴스 구분 코드',
                              `lineitem_lineitemtype` varchar(100) DEFAULT NULL COMMENT '비용구분',
                              `product_instancetype` varchar(100) DEFAULT NULL COMMENT '서비스 상세 구분',
                              `pricing_unit` varchar(100) DEFAULT NULL COMMENT '사용량 단위',
                              `lineitem_usageamount` varchar(100) DEFAULT NULL COMMENT '사용량',
                              `lineitem_unblendedcost` varchar(100) DEFAULT NULL COMMENT 'on-demand 비용',
                              `lineitem_blendedcost` varchar(100) DEFAULT NULL COMMENT '할인 청구 비용',
                              `lineitem_usagestartdate` timestamp NULL DEFAULT NULL COMMENT '인스턴스 사용 시작 일시',
                              `lineitem_usageenddate` timestamp NULL DEFAULT NULL COMMENT '인스턴스 사용 끝 일시',
                              `pricing_publicondemandcost` varchar(100) DEFAULT NULL COMMENT 'on-demand 총비용',
                              `pricing_publicondemandrate` varchar(100) DEFAULT NULL COMMENT 'on-demand 단가',
                              `lineitem_currencycode` varchar(20) DEFAULT NULL COMMENT '화폐단위',
                              `data_collect_date` timestamp NULL DEFAULT NULL,
                              `data_collect_seq` varchar(100) DEFAULT NULL,
                              `product_sku` varchar(100) DEFAULT NULL,
                              `product_region` varchar(50) DEFAULT NULL,
                              `product_instanceFamily` varchar(100) DEFAULT NULL,
                              `product_location` varchar(100) DEFAULT NULL,
                              `lineitem_operation` varchar(100) DEFAULT NULL,
                              `product_instancetypefamily` varchar(20) DEFAULT NULL,
                              `lineitem_usagetype` varchar(100) DEFAULT NULL,
                              `product_vcpu` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
                              `product_memory` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- cost.cur_process_info definition

CREATE TABLE `cur_process_info` (
                                    `csp` varchar(10) NOT NULL,
                                    `payer_account` varchar(100) NOT NULL,
                                    `collect_date` varchar(10) NOT NULL,
                                    `object_key` varchar(200) DEFAULT NULL,
                                    `certifed_fixed_yn` varchar(1) DEFAULT NULL,
                                    `certifed_fixed_date` timestamp NULL DEFAULT NULL,
                                    PRIMARY KEY (`csp`,`payer_account`,`collect_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

INSERT INTO cur_process_info (csp, payer_account, collect_date, object_key, certifed_fixed_yn, certifed_fixed_date)
VALUES ('AWS', 'mcmpcostopti', DATE_FORMAT(NOW() , '%Y%m'), NULL, 'N', NULL)
    ON DUPLICATE KEY UPDATE collect_date = VALUES(collect_date);

-- cost.daily_abnormal_by_product definition

CREATE TABLE `daily_abnormal_by_product` (
                                             `collect_dt` date NOT NULL,
                                             `product_cd` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NOT NULL,
                                             `abnormal_rating` varchar(100) DEFAULT NULL,
                                             `percentage_point` varchar(100) DEFAULT NULL,
                                             `standard_cost` varchar(100) DEFAULT NULL,
                                             `subject_cost` varchar(100) DEFAULT NULL,
                                             `project_cd` varchar(100) NOT NULL,
                                             `workspace_cd` varchar(100) DEFAULT NULL,
                                             `csp_type` varchar(10) DEFAULT NULL,
                                             PRIMARY KEY (`collect_dt`,`product_cd`,`project_cd`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- cost.daily_summation_by_product definition

CREATE TABLE `daily_summation_by_product` (
                                              `date` date NOT NULL,
                                              `product` varchar(100) NOT NULL,
                                              `total_cost` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
                                              `project_cd` varchar(100) NOT NULL,
                                              `workspace_cd` varchar(100) DEFAULT NULL,
                                              `csp_type` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
                                              PRIMARY KEY (`date`,`product`,`project_cd`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- cost.inst_opti_rcmd_rst definition

CREATE TABLE `inst_opti_rcmd_rst` (
                                      `create_dt` timestamp NOT NULL,
                                      `resource_id` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NOT NULL,
                                      `csp_type` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NOT NULL,
                                      `csp_account` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
                                      `origin_type` varchar(100) DEFAULT NULL,
                                      `rcmd_type` varchar(100) DEFAULT NULL,
                                      `plan_type` varchar(20) DEFAULT NULL,
                                      `origin_usd` varchar(100) DEFAULT NULL,
                                      `rcmd_usd` varchar(100) DEFAULT NULL,
                                      PRIMARY KEY (`create_dt`,`resource_id`,`csp_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- cost.monthly_summation definition

CREATE TABLE `monthly_summation` (
                                     `year_month` varchar(6) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NOT NULL,
                                     `project_cd` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NOT NULL,
                                     `csp` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NOT NULL,
                                     `total_cost` varchar(100) DEFAULT NULL,
                                     `workspace_cd` varchar(100) DEFAULT NULL,
                                     PRIMARY KEY (`year_month`,`project_cd`,`csp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- cost.service_category definition

CREATE TABLE `service_category` (
                                    `service_cd` varchar(100) NOT NULL COMMENT '서비스 코드',
                                    `service_nm` varchar(100) NOT NULL COMMENT '서비스 명',
                                    `service_type` varchar(100) NOT NULL COMMENT '서비스 타입',
                                    PRIMARY KEY (`service_cd`,`service_nm`,`service_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- cost.servicegroup_meta definition

CREATE TABLE `servicegroup_meta` (
                                     `csp_type` varchar(100) NOT NULL COMMENT 'CSP 종류',
                                     `csp_account` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci DEFAULT 'mcmpcostopti' COMMENT 'CSP 계정 ID',
                                     `csp_instanceid` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'common' COMMENT ' 인스턴스 구분코드',
                                     `service_cd` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NOT NULL COMMENT '서비스 코드',
                                     `service_nm` varchar(100) DEFAULT NULL COMMENT '서비스 명',
                                     `service_type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci DEFAULT 'project' COMMENT '서비스 타입',
                                     `workspace_cd` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci DEFAULT 'undefined' COMMENT 'WorkSpace 코드',
                                     `service_uid` varchar(100) DEFAULT NULL,
                                     `vm_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'undefined',
                                     `vm_uid` varchar(100) DEFAULT NULL,
                                     `vm_nm` varchar(100) DEFAULT NULL,
                                     `mci_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'undefined',
                                     `mci_uid` varchar(100) DEFAULT NULL,
                                     `mci_nm` varchar(100) DEFAULT NULL,
                                     `instance_running_status` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci DEFAULT 'N',
                                     PRIMARY KEY (`csp_type`,`csp_instanceid`,`service_cd`,`vm_id`,`mci_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- cost.tbl_table_billing_detail_202409 definition

CREATE TABLE `tbl_table_billing_detail_202409` (
                                                   `lineitem_usageaccountid` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
                                                   `lineitem_productcode` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
                                                   `lineitem_resourceid` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
                                                   `lineitem_lineitemtype` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
                                                   `product_instancetype` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
                                                   `pricing_unit` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
                                                   `lineitem_usageamount` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
                                                   `lineitem_unblendedcost` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
                                                   `lineitem_blendedcost` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
                                                   `lineitem_usagestartdate` timestamp NULL DEFAULT NULL,
                                                   `lineitem_usageenddate` timestamp NULL DEFAULT NULL,
                                                   `pricing_publicondemandcost` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
                                                   `pricing_publicondemandrate` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
                                                   `lineitem_currencycode` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
                                                   `product_sku` varchar(100) DEFAULT NULL,
                                                   `product_region` varchar(50) DEFAULT NULL,
                                                   `product_instanceFamily` varchar(100) DEFAULT NULL,
                                                   `product_location` varchar(100) DEFAULT NULL,
                                                   `lineitem_operation` varchar(100) DEFAULT NULL,
                                                   `product_instancetypefamily` varchar(20) DEFAULT NULL,
                                                   `lineitem_usagetype` varchar(100) DEFAULT NULL,
                                                   `product_vcpu` varchar(30) DEFAULT NULL,
                                                   `product_memory` varchar(30) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- cost.temp_cmp_user_info definition

CREATE TABLE `temp_cmp_user_info` (
                                      `mcmp_user_id` varchar(100) DEFAULT NULL,
                                      `csp_type` varchar(10) DEFAULT NULL,
                                      `csp_account_id` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

INSERT INTO cost.temp_cmp_user_info(mcmp_user_id, csp_type, csp_account_id)
VALUES('mcmpcostopti', 'AWS', 'mcmpcostopti');

-- cost.temp_cmp_user_mail_receiver definition

CREATE TABLE `temp_cmp_user_mail_receiver` (
                                               `mcmp_user_id` varchar(100) DEFAULT NULL,
                                               `mcmp_mail_receiver` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- cost.temp_cmp_user_role_arn definition

CREATE TABLE `temp_cmp_user_role_arn` (
                                          `mcmp_user_id` varchar(100) DEFAULT NULL,
                                          `csp` varchar(20) DEFAULT NULL,
                                          `bucket_nm` varchar(100) DEFAULT NULL,
                                          `role_arn` varchar(200) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- cost.unused_batch_rst definition

CREATE TABLE `unused_batch_rst` (
                                    `create_dt` timestamp NOT NULL,
                                    `csp_type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NOT NULL,
                                    `csp_account` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NOT NULL,
                                    `csp_instanceid` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NOT NULL,
                                    `plan_type` varchar(100) DEFAULT NULL,
                                    PRIMARY KEY (`create_dt`,`csp_type`,`csp_account`,`csp_instanceid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- cost.unused_collector definition

CREATE TABLE `unused_collector` (
                                    `csp_resourceid` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NOT NULL,
                                    `create_dt` timestamp NOT NULL,
                                    `instance_type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
                                    `rsrc_type` varchar(10) DEFAULT NULL,
                                    `region_id` varchar(50) DEFAULT NULL,
                                    `region_nm` varchar(100) DEFAULT NULL,
                                    `operation` varchar(100) DEFAULT NULL,
                                    `instance_family_type` varchar(20) DEFAULT NULL,
                                    `product_sku` varchar(100) DEFAULT NULL,
                                    `instance_family` varchar(100) DEFAULT NULL,
                                    PRIMARY KEY (`csp_resourceid`,`create_dt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- cost.unused_process_mart definition

CREATE TABLE `unused_process_mart` (
                                       `create_dt` timestamp NOT NULL,
                                       `resource_id` varchar(200) NOT NULL,
                                       `collect_dt` timestamp NOT NULL,
                                       `metric_type` varchar(100) NOT NULL,
                                       `metric_avg_amount` double DEFAULT NULL,
                                       PRIMARY KEY (`resource_id`,`collect_dt`,`metric_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;
