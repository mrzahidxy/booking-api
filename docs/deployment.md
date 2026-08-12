# API Deployment

This API is deployed from GitHub Actions by building and pushing Docker images to Docker Hub, then restarting the VPS Docker Compose service.

## GitHub Secrets

- `DOCKERHUB_USERNAME`
- `DOCKERHUB_TOKEN`
- `VPS_HOST`
- `VPS_USER`
- `VPS_SSH_KEY`

## Docker Hub Image

- Repository: `zayedsagor/booking-api`
- Tags pushed on each `main` deploy:
  - `zayedsagor/booking-api:latest`
  - `zayedsagor/booking-api:<git-sha>`

## VPS Requirements

- App directory: `/opt/apps/booking-api`
- Docker Compose service name: `api`
- Container runtime port: `PORT=8080`
- Expected VPS port mapping: `127.0.0.1:8082:8080`

Recommended Compose healthcheck:

```yaml
services:
  api:
    ports:
      - "127.0.0.1:8082:8080"
    healthcheck:
      test: ["CMD-SHELL", "wget -q -O /dev/null http://127.0.0.1:8080/health || exit 1"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 20s
```

Use `docker exec -it booking-api sh` for shell access inside the running Alpine container.

## Deployment Flow

The GitHub Actions workflow:

1. Builds and pushes the Docker image.
2. SSHes into the VPS.
3. Runs `docker compose pull`.
4. Runs `docker compose run --rm api npx prisma migrate deploy`.
5. Runs `docker compose up -d api`.
6. Runs `docker image prune -f`.
7. Checks:
   - `http://127.0.0.1:8082/health`
   - `https://menu-api.flowstacker.xyz/health`

## Rollback

To roll back, update the Compose image tag to a previous Git SHA image tag and redeploy.
