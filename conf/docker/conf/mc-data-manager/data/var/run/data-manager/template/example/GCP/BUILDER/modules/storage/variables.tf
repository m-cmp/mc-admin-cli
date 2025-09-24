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
variable "bucketName" {
  description = "버킷 명"
  type        = string
}