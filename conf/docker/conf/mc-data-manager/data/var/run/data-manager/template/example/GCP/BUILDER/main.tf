terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 6.9.0"
    }
  }
}

provider "google" {
  credentials = file("secrets.json") # secrete.json path
  project     = var.project_id
  region      = var.region
}

# Firestore Gen
module "firestore_database" {
  source     = "./modules/firestore"
  project_id = var.project_id
  region     = var.region
  nrdbName   = var.nrdbName

}

# MySQL RDB Gen
module "mysql" {
  source     = "./modules/mysql"
  project_id = var.project_id
  region     = var.region
  cidr_range = var.cidr_range
  dbName     = var.dbName
  userName   = var.dbName
  password   = var.password

}

# Google Cloud Storage Gen
module "storage" {
  source     = "./modules/storage"
  project_id = var.project_id
  region     = var.region
  bucketName = var.bucketName
}
