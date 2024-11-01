

terraform {
  required_providers {
    ncloud = {
      source  = "NaverCloudPlatform/ncloud"
      version = "~>3.2.1" # sdk version
    }
  }
}


resource "ncloud_objectstorage_bucket" "storage_bucket" {
  bucket_name   = var.bucket_name
}
