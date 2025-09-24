# variables.tf

variable "access_key" {
  description = "AWS Access Key"
  type        = string
  sensitive = true
}

variable "secret_key" {
  description = "AWS Secret Key"
  type        = string
  sensitive = true
}

variable "region" {
  description = "AWS Region"
  type        = string
  default     = "ap-northeast-2"
}

variable "zone" {
  description = "AWS zone"
  type        = string
  default     = "ap-northeast-2d"
}

variable "vpc_name" {
  description = "vpc_name"
  type        = string
  default     = "mcmp-vpc"

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
  default     = "mcdatamanager"
}

variable "table_name" {
  description = "table_name"
  type        = string
  default     = "mcdatamanager"
}


variable "db_name" {
  description = "DB name"
  type        = string
  default     = "mcdatamanager"
}


variable "db_user" {
  description = "DB user"
  type        = string
  default     = "mcdatamanager"
}

variable "db_pswd" {
  description = "DB PW"
  type        = string
  default     = "mcdatamanager"
}


# variable "aws_region" {
#   description = "AWS 리전"
#   type        = string
#   default     = "us-east-1"
# }

# variable "aws_access_key" {
#   description = "AWS 액세스 키"
#   type        = string
# }

# variable "aws_secret_key" {
#   description = "AWS 시크릿 키"
#   type        = string
# }

# # S3 변수
# variable "s3_bucket_name" {
#   description = "S3 버킷 이름"
#   type        = string
# }

# # RDS 변수
# variable "db_instance_identifier" {
#   description = "RDS 인스턴스 식별자"
#   type        = string
# }

# variable "db_name" {
#   description = "데이터베이스 이름"
#   type        = string
# }

# variable "db_username" {
#   description = "데이터베이스 마스터 사용자 이름"
#   type        = string
# }

# variable "db_password" {
#   description = "데이터베이스 마스터 비밀번호"
#   type        = string
#   sensitive   = true
# }

# variable "db_allocated_storage" {
#   description = "할당된 스토리지 (GB)"
#   type        = number
#   default     = 20
# }

# variable "db_instance_class" {
#   description = "RDS 인스턴스 클래스"
#   type        = string
#   default     = "db.t3.micro"
# }

# variable "subnet_ids" {
#   description = "서브넷 IDs (RDS 배포용)"
#   type        = list(string)
# }

# # DynamoDB 변수
# variable "dynamodb_table_name" {
#   description = "DynamoDB 테이블 이름"
#   type        = string
# }

# variable "dynamodb_read_capacity" {
#   description = "DynamoDB 읽기 용량 단위"
#   type        = number
#   default     = 5
# }

# variable "dynamodb_write_capacity" {
#   description = "DynamoDB 쓰기 용량 단위"
#   type        = number
#   default     = 5
# }

# variable "dynamodb_hash_key" {
#   description = "DynamoDB 해시 키 속성 이름"
#   type        = string
# }



