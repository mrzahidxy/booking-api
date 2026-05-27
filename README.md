# Gontobbo Booking API

Backend API for the Gontobbo booking app. It serves the client with booking, payment, auth, notification, and admin endpoints.

## Run

```bash
npm install
cp .env.example .env
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

PowerShell:

```powershell
Copy-Item .env.example .env
```

For production:

```bash
npm run build
npm run start
```

## Env

Copy [`.env.example`](./.env.example) to `.env`.

- `DATABASE_URL`
- `JWT_SECRET`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `STRIPE_PAYMENT_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `FRONTEND_URL`

## Database / Prisma

- `npm run prisma:generate` - generate the Prisma client
- `npm run prisma:migrate` - run local migrations
- `npx prisma migrate deploy` - apply migrations in production
- `npm run prisma:push` - sync the schema without migrations
- `npm run seed` - seed the database

## Scripts

- `npm run dev` - start the API in dev mode
- `npm run build` - compile TypeScript to `dist/`
- `npm run start` - start the compiled server

## Deploy

- Build the production image with `docker build -t <dockerhub-user>/booking-api:latest .`
- Run Prisma migrations in production with `npx prisma migrate deploy`
- Health check endpoint: `/health`
- GitHub Actions builds and pushes `booking-api` on `main`, then deploys it to the VPS over SSH
