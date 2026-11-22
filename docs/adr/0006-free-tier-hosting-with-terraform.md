---
date: 2026-11-22
status: Accepted
scope: Fixes the live demo hosting topology and infrastructure-as-code tool; leaves local development on host processes, portless, and Docker Compose
---

# ADR-0006: Always Free demo hosting on Render, Cloudflare, and Neon with Terraform

## Context

The v2 starter must deploy a working public demo on a subdomain of the author's Cloudflare DNS zone, provisioned and updated via infrastructure as code and GitHub Actions. The deployment must run the `platformatic/node-caged:26-slim` production container, support WebSockets, store uploaded book covers, and stay within permanent Always Free tiers.

What constrains the choice:

- Official maintained Terraform Registry providers exist for Render (`render-oss/render`), Cloudflare (`cloudflare/cloudflare` v5), and Neon (`neondatabase/neon`).
- Terraform is already installed via `mise`, and Cloudflare R2 includes 10 GB of permanent Always Free S3-compatible storage (usable for both book covers and Terraform remote state).
- AWS ECS and Fargate lack a permanent Always Free tier, and AWS API Gateway WebSockets are not permanently free.
- DigitalOcean App Platform free tier covers static sites only.

## Considered options

- **AWS Always Free (Lambda, SQS, CloudFront) with Neon**. Rejected: AWS Lambda does not host long-lived WebSocket connections natively without paid API Gateway usage, and ECS or Fargate have no permanent Always Free tier.
- **DigitalOcean App Platform**. Rejected: excludes dynamic API container hosting from its free tier.
- **Pulumi in TypeScript instead of Terraform**. Rejected: requires adding the Pulumi CLI and a state backend account, whereas Terraform is already installed via `mise` and has official providers for all three hosts.
- **Render Free (`platformatic/node-caged:26-slim`), Cloudflare Workers and R2 and DNS, and Neon Free provisioned via Terraform**. Chosen. Distributes infrastructure across three providers and accepts Render Free cold-start spin-down after idle periods.

## Decision

Provision the live demo using Terraform under `infra/terraform/` with `render-oss/render`, `cloudflare/cloudflare`, and `neondatabase/neon`, storing remote state in a Cloudflare R2 bucket via the S3-compatible backend. Run `apps/api` (including WebSockets and optional in-process `pg-boss` worker on the free demo) as a Render Free Docker web service built from `platformatic/node-caged:26-slim`.

Deploy `apps/web` (TanStack Start) to Cloudflare Workers with Static Assets, provision PostgreSQL on Neon Free, store book cover images in Cloudflare R2 (emulated locally by Floci), and route custom subdomains through Cloudflare DNS.

## Consequences

### Positive

- Runs the entire live demo (API, WebSockets, web SSR, PostgreSQL, object storage, DNS, and Terraform state) at zero monthly cost.
- Uses the exact `platformatic/node-caged:26-slim` Docker image in production rather than a platform-specific serverless build.
- Official Terraform providers keep infrastructure reproducible for template adopters.

### Negative

- Render Free web services spin down after 15 minutes of inactivity, adding a cold-start delay to the first demo request.
- Running `pg-boss` in-process on the free API instance (rather than a separate paid worker container) stops background polling while the free instance is spun down; the Dockerfile and Terraform include an optional separate worker service variable for paid deployments.
