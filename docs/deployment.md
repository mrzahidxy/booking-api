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
- Expected VPS port mapping: `127.0.0.1:8081:8080`

## Deployment Flow

The GitHub Actions workflow:

1. Builds and pushes the Docker image.
2. SSHes into the VPS.
3. Runs `docker compose pull`.
4. Runs `docker compose run --rm api npx prisma migrate deploy`.
5. Runs `docker compose up -d api`.
6. Runs `docker image prune -f`.
7. Checks:
   - `http://127.0.0.1:8081/health`
   - `https://menu-api.flowstacker.xyz/health`

## Rollback

To roll back, update the Compose image tag to a previous Git SHA image tag and redeploy.
