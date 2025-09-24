terraform {
  required_providers {
    ncloud = {
      source  = "NaverCloudPlatform/ncloud"
      version = "~>3.2.1" # ncloud SDK
    }
  }
}

provider "ncloud" {
  support_vpc = true
  access_key  = var.access_key    # NCP Access Key
  secret_key  = var.secret_key    # NCP Secret Key
  region      = var.region        # NCP Region
}

resource "ncloud_vpc" "vpc" {
  name            = var.vpc_name
  ipv4_cidr_block = "10.0.0.0/16"
}

resource "ncloud_network_acl" "acl" {
  vpc_no      = ncloud_vpc.vpc.id
  name        = var.acl_name
  description = "M-CMP"
}

resource "ncloud_network_acl_rule" "acl_rule" {
  network_acl_no = ncloud_network_acl.acl.id

  inbound {
    priority    = 100
    protocol    = "TCP"
    rule_action = "ALLOW"
    ip_block    = "0.0.0.0/0"
    port_range  = "1-65535"
  }

  outbound {
    priority    = 110
    protocol    = "TCP"
    rule_action = "ALLOW"
    ip_block    = "0.0.0.0/0"
    port_range  = "1-65535"
  }
}

# Define Access Control Group
resource "ncloud_access_control_group" "db_acg" {
  vpc_no = ncloud_vpc.vpc.id
  name        = var.acg_name
  description = "Database Access Control Group"
}

# Define Access Control Group Rule (Inbound Rule for MySQL)
resource "ncloud_access_control_group_rule" "acg_rule" {
  access_control_group_no = ncloud_access_control_group.db_acg.id
  # Inbound rules
  inbound {
    protocol    = "TCP"
    ip_block    = "0.0.0.0/0"
    port_range  = "22"
    description = "Accept SSH connections on port 22"
  }

  inbound {
    protocol    = "TCP"
    ip_block    = "0.0.0.0/0"
    port_range  = "80"
    description = "Accept HTTP traffic on port 80"
  }
  # Inbound rule (all ports allowed)
  inbound {
    protocol    = "TCP"
    ip_block    = "0.0.0.0/0"
    port_range  = "1-65535"
    description = "Accept MySQL traffic on port 3306"
  }

  # Outbound rule (all ports allowed)
  outbound {
    protocol    = "TCP"
    ip_block    = "0.0.0.0/0"
    port_range  = "1-65535"
    description = "Allow outbound traffic on all ports"
  }
}

## subnet
resource "ncloud_subnet" "subnet" {
  depends_on       = [ncloud_vpc.vpc, ncloud_network_acl.acl]
  vpc_no           = ncloud_vpc.vpc.id
  subnet           = "10.0.1.0/24"
  zone             = "KR-1"
  network_acl_no   = ncloud_network_acl.acl.id
  subnet_type      = "PRIVATE"
  name             = var.private_subnet_name
  usage_type       = "GEN"
}

resource "ncloud_subnet" "public_subnet" {
  depends_on       = [ncloud_vpc.vpc, ncloud_network_acl.acl]
  vpc_no           = ncloud_vpc.vpc.id
  subnet           = "10.0.2.0/24"
  zone             = "KR-1"
  network_acl_no   = ncloud_network_acl.acl.id
  subnet_type      = "PUBLIC"
  name             = var.public_subnet_name
  usage_type       = "GEN"
}

## nic
resource "ncloud_network_interface" "nic" {
  depends_on = [ ncloud_subnet.public_subnet, ncloud_access_control_group_rule.acg_rule ]
  name = "mcmp-nic"
  subnet_no = ncloud_subnet.public_subnet.id
  access_control_groups = [ncloud_access_control_group.db_acg.id]
}



# Object Storage Module
module "storage" {
  source      = "./modules/storage"
  bucket_name = var.bucket_name
  access_key  = var.access_key
  secret_key  = var.secret_key
  region      = var.region
}

# RDB Module
module "rdb" {
  depends_on = [ ncloud_network_interface.nic ]
  source      = "./modules/rdb"
  access_key  = var.access_key
  secret_key  = var.secret_key
  region      = var.region
  subnet_id   = ncloud_subnet.public_subnet.id
  db_name     = var.db_name
  db_user     = var.db_user
  db_pswd     = var.db_pswd
  acg_id      = ncloud_access_control_group.db_acg.id
}


# MongoDB Module
module "mongodb" {
  depends_on = [ ncloud_network_interface.nic ]
  source               = "./modules/mongodb"
  access_key           = var.access_key
  secret_key           = var.secret_key
  region               = var.region
  vpc_id               = ncloud_vpc.vpc.id
  subnet_id            = ncloud_subnet.public_subnet.id
  acg_id               = ncloud_network_acl.acl.id
  private_subnet_name  = var.private_subnet_name
  public_subnet_name   = var.public_subnet_name
  vpc_name             = var.vpc_name
  db_name              = var.db_name
  db_user              = var.db_user
  db_pswd              = var.db_pswd
}

# NCP  rdb and mongodb as DB instance, not supported network interface settings.
