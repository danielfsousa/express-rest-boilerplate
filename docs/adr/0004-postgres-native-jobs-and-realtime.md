---
date: 2026-11-22
status: Accepted
scope: Fixes the default backing mechanisms for the opt-in background jobs and realtime modules; leaves both swappable behind port interfaces
---

# ADR-0004: PostgreSQL-native background jobs and realtime fan-out

## Context

The v2 starter includes opt-in modules for background jobs (order receipt emails via React Email and Bird.com, low-stock alerts, CSV catalog exports) and WebSockets (live order status updates and merchant order notifications). Both modules must run locally with minimal Docker memory and deploy within permanent Always Free tiers.

What constrains the choice:

- PostgreSQL is already required locally (Docker Compose and Testcontainers) and in production (Neon Free).
- Live demo hosting stays within Always Free tiers, where managed Redis or Valkey services are paid or heavily capped.
- Both modules must be toggleable via `FEATURE_JOBS_ENABLED` and `FEATURE_REALTIME_ENABLED` and cleanly removable from the repository.

## Considered options

- **BullMQ and Redis Pub/Sub on Redis or Valkey**. Rejected: requires running and provisioning a separate stateful broker locally and in production.
- **AWS SQS for background jobs**. Rejected: adds an AWS production dependency alongside Render, Cloudflare, and Neon.
- **`pg-boss` for background jobs and PostgreSQL `LISTEN/NOTIFY` for realtime behind port interfaces**. Chosen. Shares PostgreSQL connection limits and IOPS with application traffic until scale warrants swapping in a dedicated broker.

## Decision

Implement the opt-in `jobs` module with `pg-boss` behind a `JobQueue` port interface, storing job tables in a dedicated PostgreSQL schema (`pgboss`). Implement the opt-in `realtime` module with Hono's WebSocket helper behind a `RealtimeBroker` port interface, shipping an in-memory broker for single-process development and a PostgreSQL `LISTEN/NOTIFY` broker for multi-instance fan-out.

Keep both modules disabled cleanly when `FEATURE_JOBS_ENABLED=false` or `FEATURE_REALTIME_ENABLED=false`, falling back to synchronous inline execution or no-op publishers where appropriate.

## Consequences

### Positive

- Eliminates Redis, Valkey, and external queue services from local Docker Compose, CI Testcontainers, and production Terraform.
- Retries, scheduled jobs, dead-letter queues, and transactional enqueueing work out of the box on PostgreSQL and Neon.
- Port interfaces allow swapping to BullMQ, SQS, or Redis Pub/Sub later without touching feature business logic.

### Negative

- High-throughput job polling or heavy WebSocket broadcast traffic shares connections with the primary PostgreSQL database.
- `LISTEN/NOTIFY` requires a dedicated non-pooled session connection on Neon rather than a transaction-pooled endpoint.
