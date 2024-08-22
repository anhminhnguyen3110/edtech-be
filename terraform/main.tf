resource "aws_s3_bucket" "edtech_assistant" {
  bucket = var.s3_bucket_name

  tags = {
    Name        = var.s3_bucket_name
    Environment = var.environment
  }
}

resource "aws_s3_bucket_ownership_controls" "s3_edtech_assistant_acl_ownership" {
  bucket = aws_s3_bucket.edtech_assistant.id
  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

resource "aws_s3_bucket_public_access_block" "s3_edtech_assistant_public_access_block" {
  bucket = aws_s3_bucket.edtech_assistant.id

  block_public_acls       = false
  block_public_policy     = false
}

resource "aws_s3_bucket_acl" "edtech_assistant_acl" {
  depends_on = [
	aws_s3_bucket_ownership_controls.s3_edtech_assistant_acl_ownership,
	aws_s3_bucket_public_access_block.s3_edtech_assistant_public_access_block
  ]

  bucket = aws_s3_bucket.edtech_assistant.id
  acl    = "public-read"
}
