variable "access_key" {
  description = "NCP Access Key"
  type        = string
  sensitive   = true
}

variable "secret_key" {
  description = "NCP Secret Key"
  type        = string
  sensitive   = true
}

variable "region" {
  description = "NCP Region (ex: KR)"
  type        = string
  default     = "KR"
}

variable "vpc_name" {
  description = "vpc_name"
  type        = string
  default     = "mcmp-vpc"

}

variable "acl_name" {
  description = "acl_name"
  type        = string
  default     = "mcmp-acl"

}

variable "private_subnet_name" {
  description = "private_subnet_name"
  type        = string
  default     = "mcmp-pi-subnet"

}
variable "public_subnet_name" {
  description = "public_subnet_name"
  type        = string
  default     = "mcmp-pu-subnet"

}

variable "bucket_name" {
  description = "bucket_name"
  type        = string
  default     = "mc-data-manager"
}

variable "db_name" {
  description = "DB name"
  type        = string
  default     = "mc-data-manager"
}


variable "db_user" {
  description = "DB user"
  type        = string
  default     = "datamanager"
}

variable "db_pswd" {
  description = "DB PW"
  type        = string
  default     = "N@mutech7^^7"
}
