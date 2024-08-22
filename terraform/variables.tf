variable "s3_bucket_name" {
  description = "The name of the S3 bucket"
  type        = string
  default     = "edtech-assistant"
}

variable "s3_acl" {
  description = "The ACL for the S3 bucket"
  type        = string
  default     = "public-read"
}

variable "environment" {
  description = "The environment"
  type        = string
  default     = "dev"
}