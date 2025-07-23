# common

variable "project_id" {
  description = "GCP 프로젝트 ID"
  type        = string
}

variable "region" {
  description = "GCP 리전"
  type        = string
}


# local
variable "dbName" {
  description = "DB 이름"
  type        = string
}


variable "userName" {
  description = "DB 유저"
  type        = string
}

variable "password" {
  description = "DB PW"
  type        = string
}

variable "cidr_range" {
  description = "DB PW"
  type        = string
}
