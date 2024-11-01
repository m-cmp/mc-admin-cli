# modules/mongodb/variables.tf
variable "access_key" {
  description = "NCP Access Key"
  type        = string
}

variable "secret_key" {
  description = "NCP Secret Key"
  type        = string
}

variable "region" {
  description = "NCP Region (ex: KR)"
  type        = string
}

variable "vpc_name" {
  description = "vpc_name"
  type        = string
}

variable "vpc_id" {
  description = "vpc_id"
  type        = string
}

variable "subnet_id" {
  description = "subnet_id"
  type        = string
}

variable "acg_id" {
  description = "acg_id"
  type        = string
}

variable "private_subnet_name" {
  description = "private_subnet_name"
  type        = string

}
variable "public_subnet_name" {
  description = "public_subnet_name"
  type        = string

}

variable "db_user" {
  description = "DB user"
  type        = string
}

variable "db_name" {
  description = "DB name"
  type        = string
}

variable "db_pswd" {
  description = "db_pswd"
  type        = string
}

