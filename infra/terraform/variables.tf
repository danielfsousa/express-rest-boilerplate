variable "domain" {
  description = "Root Cloudflare zone domain (demo.<domain> and api.demo.<domain>)."
  type        = string
}

variable "cloudflare_account_id" {
  description = "Cloudflare account ID."
  type        = string
}

variable "cloudflare_zone_id" {
  description = "Cloudflare DNS zone ID for var.domain."
  type        = string
}

variable "neon_region" {
  description = "Neon Postgres region."
  type        = string
  default     = "aws-us-east-1"
}

variable "render_region" {
  description = "Render service region."
  type        = string
  default     = "oregon"
}

variable "api_image_url" {
  description = "Container image URL for apps/api (e.g. ghcr.io/owner/repo/api:latest)."
  type        = string
}

variable "worker_image_url" {
  description = "Container image URL for apps/worker (used when enable_separate_worker is true)."
  type        = string
  default     = ""
}

variable "enable_separate_worker" {
  description = "Deploy apps/worker as a dedicated Render background worker (paid plan). Defaults to false (WORKER_INLINE=true on Render Free)."
  type        = bool
  default     = false
}

variable "enable_cloudflare_kv" {
  description = "Provision an Always Free Cloudflare KV namespace for optional caching."
  type        = bool
  default     = true
}

variable "better_auth_secret" {
  description = "Secret key for better-auth session signing."
  type        = string
  sensitive   = true
}

variable "bird_api_key" {
  description = "Bird.com API key for transactional email delivery."
  type        = string
  sensitive   = true
}

variable "bird_from_email" {
  description = "Verified sender address for transactional emails."
  type        = string
  default     = "noreply@example.com"
}

variable "stripe_secret_key" {
  description = "Optional Stripe secret key when billing is enabled."
  type        = string
  sensitive   = true
  default     = ""
}

variable "stripe_webhook_secret" {
  description = "Optional Stripe webhook signing secret."
  type        = string
  sensitive   = true
  default     = ""
}

variable "feature_billing_enabled" {
  description = "Enable Stripe billing module in production."
  type        = bool
  default     = false
}
