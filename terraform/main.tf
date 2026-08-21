terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }

  required_version = ">= 1.5.0"
}

provider "aws" {
  region = "ap-south-1"
}

resource "aws_security_group" "telemed" {
  name        = "telemed-security-group"
  description = "Security group for TeleMed application"

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "TeleMed backend"
    from_port   = 5000
    to_port     = 5000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "TeleMed frontend"
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "telemed-security-group"
  }
}

resource "aws_iam_role" "telemed_ec2" {
  name = "telemed-ec2-s3-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"

    Statement = [
      {
        Effect = "Allow"

        Principal = {
          Service = "ec2.amazonaws.com"
        }

        Action = "sts:AssumeRole"
      }
    ]
  })
}

resource "aws_iam_role_policy" "telemed_s3" {
  name = "telemed-s3-access"
  role = aws_iam_role.telemed_ec2.id

  policy = jsonencode({
    Version = "2012-10-17"

    Statement = [
      {
        Effect = "Allow"

        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]

        Resource = "arn:aws:s3:::telemed-uploads-ranjit-2026/*"
      },
      {
        Effect = "Allow"

        Action = [
          "s3:ListBucket"
        ]

        Resource = "arn:aws:s3:::telemed-uploads-ranjit-2026"
      }
    ]
  })
}

resource "aws_iam_instance_profile" "telemed_ec2" {
  name = "telemed-ec2-instance-profile"
  role = aws_iam_role.telemed_ec2.name
}

resource "aws_instance" "telemed" {
  ami           = "ami-07e5ce642bbc48c0d"
  instance_type = "t3.micro"

  key_name = "telemed-key"

  iam_instance_profile = aws_iam_instance_profile.telemed_ec2.name

  vpc_security_group_ids = [
    aws_security_group.telemed.id
  ]

  tags = {
    Name = "TeleMed-Server"
  }
}