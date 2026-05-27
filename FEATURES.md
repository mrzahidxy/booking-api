# API Feature Notes

This file describes API-specific feature behavior for the booking backend.
Use it with `api/AGENT.md`.

## Scope

- Express routes under `/api`
- Auth, tenant access, bookings, payments, notifications, reviews, images, and admin endpoints
- Prisma schema, migrations, and seed behavior

## Main Route Groups

- `/api/auth`
- `/api/properties/hotels`
- `/api/properties/restaurants`
- `/api/bookings`
- `/api/payments`
- `/api/payments/webhook`
- `/api/notifications`
- `/api/reviews`
- `/api/images`
- `/api/users`
- `/api/admin`
- `/api/role-permission`
- `/api/docs` and `/api/docs.json`
- `/health` and `/live`

## Feature Rules

- Keep request and response shapes stable unless the client is updated in the same change.
- Check Prisma models and migrations before changing booking, tenant, or payment logic.
- Treat tenant-aware access as part of auth, booking, admin, and list queries.
- Keep webhook handling separate from the normal JSON middleware path.
- Preserve platform-admin-only behavior where it already exists.

## What To Record For Each Change

- Route or controller touched
- Related service and schema files
- Database migration or seed impact
- Required env vars or third-party services
- Access control or tenant access rules
- Webhook, callback, or idempotency behavior
- Manual test steps

## Good Update Examples

- New endpoint or route parameter
- Schema field added or renamed
- Access check changed for tenant or admin users
- Payment or notification flow changed
- Contract change that affects the client

## Notes To Keep In Sync

- Update the client at the same time if a DTO or response shape changes.
- Update Swagger docs if the public API surface changes.
- Keep migration history intact unless you are intentionally rebuilding it.
