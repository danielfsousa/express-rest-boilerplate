# How to deploy with Terraform and cut over from v1

This guide covers building the production `platformatic/node-caged` container images, provisioning the cloud stack with HCP Terraform, verifying the live demo, and cutting the repository over from `v1` to `v2`.

## Build and test production containers locally

The root `Dockerfile` defines two slim targets (`api` and `worker`) on top of `platformatic/node-caged:26-slim`. Both stages read the exact `pnpm` version from the `packageManager` field in `package.json`, install dependencies with a BuildKit cache mount, prune dev dependencies with `pnpm deploy --prod --legacy`, and run as the non-root `node` user.

Build both targets locally to verify the container images:

```bash
docker build --target api -t bookstore-api:local .
docker build --target worker -t bookstore-worker:local .
```

Start the API container against your database:

```bash
docker run --rm -p 3001:3001 --env-file .env bookstore-api:local
```

Verify the liveness and readiness probes:

```bash
curl -fsS http://127.0.0.1:3001/health/live
curl -fsS http://127.0.0.1:3001/health/ready
```

## Provision cloud infrastructure with HCP Terraform

`infra/terraform/` declaratively provisions the free-tier production stack:

- **Neon serverless PostgreSQL.** Creates the project, branch, `app_user` role, and `bookstore` database.
- **Cloudflare R2 and DNS.** Creates the media bucket for book covers and CSV exports, plus DNS records for `demo.<domain>` and `api.demo.<domain>`.
- **Render Web Service.** Deploys the `api` container image with `WORKER_INLINE=true` so background jobs run inside the single free-tier container without paying for a second service.

### 1. Authenticate with HCP Terraform

`infra/terraform/versions.tf` includes a `cloud {}` block that connects Terraform to HCP Terraform for remote state and remote execution.

```bash
terraform login
export TF_CLOUD_ORGANIZATION="your-org"
export TF_WORKSPACE="nodejs-fullstack-starter-prod"
```

### 2. Initialize and apply the Terraform configuration

Copy the example variable file and populate your provider credentials (or configure them as sensitive workspace variables in HCP Terraform):

```bash
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars
terraform init
terraform validate
terraform plan
terraform apply
```

### 3. Run database migrations and seed data

Use the admin connection string output by Terraform to apply the Drizzle schema, RLS policies, and seed data:

```bash
DATABASE_ADMIN_URL="$(cd infra/terraform && terraform output -raw database_admin_url)" \
  pnpm --filter @starter/db db:migrate

DATABASE_ADMIN_URL="$(cd infra/terraform && terraform output -raw database_admin_url)" \
  pnpm --filter @starter/db db:seed
```

## Verify the live demo deployment

After the `.github/workflows/release.yaml` workflow pushes the container image to GHCR, deploys `apps/web` to Cloudflare Workers, and triggers the Render deploy hook, run these checks against your domain:

1. Check API liveness, readiness, and OpenAPI docs:

```bash
curl -fsS https://api.demo.<domain>/health/live
curl -fsS https://api.demo.<domain>/health/ready
curl -fsS https://api.demo.<domain>/openapi.json | head -c 200
```

2. Open `https://api.demo.<domain>/docs` in a browser and verify that the Scalar API Reference renders all endpoints.
3. Open `https://demo.<domain>` in a browser, browse the seeded `acme-books` catalog, add a book to the cart, complete checkout, and verify that cover images load from Cloudflare R2 and orders persist in Neon PostgreSQL.

## Cut over the repository from v1 to v2

Before merging `v2` into `main` and renaming the GitHub repository from `express-rest-boilerplate` to `nodejs-fullstack-starter`, archive the final `v1` state on its own tag and branch so existing users still have working links.

1. Tag and branch the final `v1` commit on `origin/main`:

```bash
git fetch origin
git tag -a v1.0.0-final origin/main -m "Final release of v1 (Express + MongoDB)"
git branch v1 origin/main
git push origin v1.0.0-final v1
```

2. Merge `v2` into `main` and push:

```bash
git checkout main
git merge --ff-only v2
git push origin main
```

3. Rename the GitHub repository to `nodejs-fullstack-starter` (GitHub automatically redirects git clones and web traffic from `express-rest-boilerplate`):

```bash
gh repo rename nodejs-fullstack-starter --yes
```
