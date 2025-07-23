# moddule / rdb

terraform {
  required_providers {
    ncloud = {
      source  = "NaverCloudPlatform/ncloud"
      version = "~>3.2.1" # sdk version
    }
  }
}


resource "ncloud_mysql" "mysql" {
  subnet_no = var.subnet_id
  service_name = var.db_name
  server_name_prefix = var.db_name
  database_name = var.db_name
  user_name = var.db_user
  user_password = var.db_pswd
  host_ip = "%"
  is_ha = false  // stanby server false


  
}

output "mysql_acg_list"  {
  depends_on = [ ncloud_mysql.mysql ]
  value = ncloud_mysql.mysql.mysql_server_list
}