# modules/mongodb/main.tf

terraform {
  required_providers {
    ncloud = {
      source  = "NaverCloudPlatform/ncloud"
      version = "~>3.2.1" # sdk version
    }
  }
}

resource "ncloud_mongodb" "mongodb" {
  vpc_no             = var.vpc_id
  subnet_no          = var.subnet_id
  service_name       = var.db_name
  server_name_prefix = "tf-svr"
  user_name          = var.db_user
  user_password      = var.db_pswd
  cluster_type_code  = "STAND_ALONE"  
}