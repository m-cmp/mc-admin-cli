# Common

variable "project_id" {
  description = "GCP 프로젝트 ID"
  type        = string
  default     = "spatial-conduit-399006"
}

variable "region" {
  description = "GCP 리전"
  type        = string
  default     = "asia-northeast3"
}

## storage
variable "bucketName" {
  description = "버킷 명"
  type        = string
  default     = "mcdatamanager"
}

## rdb
variable "dbName" {
  description = "DB 이름"
  type        = string
  default     = "mcdatamanager"
}


variable "userName" {
  description = "DB 유저"
  type        = string
  default     = "mcdatamanager"
}

variable "password" {
  description = "DB PW"
  type        = string
  default     = "mcdatamanager"
}

variable "cidr_range" {
  description = "DB PW"
  type        = string
  default     = "0.0.0.0/0"
}

## nrdb
variable "nrdbName" {
  description = "DB 이름"
  type        = string
  default     = "(default)"
}
