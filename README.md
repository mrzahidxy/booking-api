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

- `DATABASE_URL` and `DIRECT_URL` - Prisma database connections
- `PORT` and `JWT_SECRET` - API runtime values
- Stripe, Cloudinary, and Firebase keys - used by payments, uploads, and notifications
- `FRONTEND_URL` - redirect origin for client flows

## Database / Prisma

- `npm run prisma:generate` - generate the Prisma client
- `npm run prisma:migrate` - run local migrations
- `npm run prisma:deploy` - apply migrations in production
- `npm run prisma:push` - sync the schema without migrations
- `npm run seed` - seed the database

## Scripts

- `npm run dev` - start the API in dev mode
- `npm run build` - compile TypeScript to `dist/`
- `npm run start` - start the compiled server
