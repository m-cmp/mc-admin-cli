resource "aws_dynamodb_table" "dynamodb_table" {
  name           = var.table_name
  read_capacity  = 1
  write_capacity = 1
  hash_key       = "UserId"

  attribute {
    name = "UserId"
    type = "S"
  }
    deletion_protection_enabled = false
}
