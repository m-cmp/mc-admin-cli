# main.tf
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.73.0"
    }
  }
}

# AWS Provider set
provider "aws" {
  region     = var.region
  access_key = var.access_key
  secret_key = var.secret_key

}

resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
}

resource "aws_subnet" "main" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = var.zone  
}


resource "aws_security_group" "allow_all" {
  name        = "allow_all_traffic"
  description = "Allow all inbound and outbound traffic"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"    
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"    
    cidr_blocks = ["0.0.0.0/0"]
  }
}



# S3 module call
module "s3" {
  source      = "./modules/storage"
  bucket_name = var.bucket_name
}

# mysql module call
module "mysql" {
  source  = "./modules/mysql"
  db_name = var.db_name
  db_user = var.db_user
  db_pswd = var.db_pswd
}

# DynamoDB module call
module "dynamodb" {
  source     = "./modules/dynamodb"
  table_name = var.table_name
}
