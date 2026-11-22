resource "neon_project" "bookstore" {
  name       = "nodejs-fullstack-starter"
  region_id  = var.neon_region
  pg_version = 17
}

resource "neon_role" "app_user" {
  project_id = neon_project.bookstore.id
  branch_id  = neon_project.bookstore.default_branch_id
  name       = "app_user"
}

resource "neon_database" "bookstore" {
  project_id = neon_project.bookstore.id
  branch_id  = neon_project.bookstore.default_branch_id
  name       = "bookstore"
  owner_name = neon_project.bookstore.database_user
}

resource "cloudflare_r2_bucket" "media" {
  account_id = var.cloudflare_account_id
  name       = "bookstore-media"
  location   = "WNAM"
}

resource "cloudflare_workers_kv_namespace" "cache" {
  count      = var.enable_cloudflare_kv ? 1 : 0
  account_id = var.cloudflare_account_id
  title      = "bookstore-cache"
}

locals {
  web_origin       = "https://demo.${var.domain}"
  api_origin       = "https://api.demo.${var.domain}"
  app_database_url = "postgres://${neon_role.app_user.name}:${neon_role.app_user.password}@${neon_project.bookstore.database_host}/${neon_database.bookstore.name}?sslmode=require"
  common_env_vars = {
    NODE_ENV = {
      value = "production"
    }
    LOG_FORMAT = {
      value = "json"
    }
    DATABASE_URL = {
      value = local.app_database_url
    }
    DATABASE_DIRECT_URL = {
      value = local.app_database_url
    }
    BETTER_AUTH_SECRET = {
      value = var.better_auth_secret
    }
    BETTER_AUTH_URL = {
      value = local.api_origin
    }
    WEB_ORIGIN = {
      value = local.web_origin
    }
    S3_BUCKET = {
      value = cloudflare_r2_bucket.media.name
    }
    S3_REGION = {
      value = "auto"
    }
    S3_ENDPOINT = {
      value = "https://${var.cloudflare_account_id}.r2.cloudflarestorage.com"
    }
    BIRD_API_KEY = {
      value = var.bird_api_key
    }
    BIRD_FROM_EMAIL = {
      value = var.bird_from_email
    }
    FEATURE_BILLING_ENABLED = {
      value = var.feature_billing_enabled ? "true" : "false"
    }
    WORKER_INLINE = {
      value = var.enable_separate_worker ? "false" : "true"
    }
  }
}

resource "render_web_service" "api" {
  name   = "bookstore-api"
  plan   = "free"
  region = var.render_region

  runtime_source = {
    image = {
      image_url = var.api_image_url
    }
  }

  health_check_path = "/health/live"
  env_vars          = local.common_env_vars
}

resource "render_background_worker" "worker" {
  count  = var.enable_separate_worker ? 1 : 0
  name   = "bookstore-worker"
  plan   = "starter"
  region = var.render_region

  runtime_source = {
    image = {
      image_url = var.worker_image_url
    }
  }

  env_vars = local.common_env_vars
}

resource "cloudflare_dns_record" "api_demo" {
  zone_id = var.cloudflare_zone_id
  name    = "api.demo.${var.domain}"
  type    = "CNAME"
  content = replace(render_web_service.api.url, "https://", "")
  ttl     = 1
  proxied = true
}

resource "cloudflare_dns_record" "web_demo" {
  zone_id = var.cloudflare_zone_id
  name    = "demo.${var.domain}"
  type    = "CNAME"
  content = "bookstore-web.${var.cloudflare_account_id}.workers.dev"
  ttl     = 1
  proxied = true
}
