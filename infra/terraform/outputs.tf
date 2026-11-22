output "web_url" {
  description = "Public storefront and merchant console URL."
  value       = "https://demo.${var.domain}"
}

output "api_url" {
  description = "Public API base URL."
  value       = "https://api.demo.${var.domain}"
}

output "neon_project_id" {
  description = "Provisioned Neon Postgres project ID."
  value       = neon_project.bookstore.id
}

output "r2_bucket_name" {
  description = "Cloudflare R2 bucket for book covers and CSV exports."
  value       = cloudflare_r2_bucket.media.name
}

output "render_api_service_id" {
  description = "Render web service ID for apps/api."
  value       = render_web_service.api.id
}
