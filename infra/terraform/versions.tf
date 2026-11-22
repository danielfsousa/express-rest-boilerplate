terraform {
  required_version = ">= 1.10.0"

  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.0"
    }
    neon = {
      source  = "kislerdm/neon"
      version = "~> 0.6"
    }
    render = {
      source  = "render-oss/render"
      version = "~> 1.4"
    }
  }

  # HCP Terraform remote state and runs. The organization and workspace come from
  # the TF_CLOUD_ORGANIZATION and TF_WORKSPACE environment variables, so no
  # account names are committed. Authenticate once with `terraform login`.
  cloud {}
}

provider "cloudflare" {}

provider "neon" {}

provider "render" {}
