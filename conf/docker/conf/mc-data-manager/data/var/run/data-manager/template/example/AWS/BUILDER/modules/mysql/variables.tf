# variables.tf

# variable "access_key" {
#   description = "AWS Access Key"
#   type        = string
# }

# variable "secret_key" {
#   description = "AWS Secret Key"
#   type        = string
# }

# variable "region" {
#   description = "AWS Region"
#   type        = string
#   default     = "KR"
# }

# variable "vpc_name" {
#   description = "vpc_name"
#   type        = string
#   default     = "mcmp-vpc"

# }

# variable "private_subnet_name" {
#   description = "private_subnet_name"
#   type        = string

# }
# variable "public_subnet_name" {
#   description = "public_subnet_name"
#   type        = string

# }

# variable "bucket_name" {
#   description = "bucket_name"
#   type        = string
# }

variable "db_name" {
  description = "DB name"
  type        = string
}


variable "db_user" {
  description = "DB user"
  type        = string
}

variable "db_pswd" {
  description = "DB PW"
  type        = string
}




