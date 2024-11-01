# MySQL Instance 리소스 구성

resource "google_sql_database_instance" "mysql_instance" {
  name             = var.dbName # instance name
  project          = var.project_id
  region           = var.region
  database_version = "MYSQL_8_0"

  settings {
    tier = "db-f1-micro" # instance reesource flavor
  }
  deletion_protection = false # Delete protection

}

resource "google_sql_database" "mysql_database" {
  name     = var.dbName # MySQL DBname
  instance = google_sql_database_instance.mysql_instance.name
  project  = var.project_id
}

resource "google_sql_user" "mysql_user" {
  name     = var.userName # DBuser
  password = var.password # DBpw
  instance = google_sql_database_instance.mysql_instance.name
  project  = var.project_id
}
