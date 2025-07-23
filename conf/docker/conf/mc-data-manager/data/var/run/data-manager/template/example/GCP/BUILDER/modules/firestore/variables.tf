# module
variable "project_id" {
  description = "GCP 프로젝트 ID"
  type        = string
}

variable "region" {
  description = "GCP 리전"
  type        = string
}

variable "nrdbName" {
  description = "DB 이름"
  type        = string
}
