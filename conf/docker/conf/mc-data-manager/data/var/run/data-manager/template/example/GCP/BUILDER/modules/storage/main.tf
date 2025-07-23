# GCS Bucket 리소스 구성

resource "google_storage_bucket" "data_storage" {
  name          = var.bucketName # BuecketName
  location      = var.region
  storage_class = "STANDARD"

  versioning {
    enabled = true
  }
  force_destroy = true
}
