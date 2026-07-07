# CIG Turf Booking System

Booking platform for **Chandna Indoor Ground** — customer booking, payments, and admin operations.

## Local development

```bash
cp .env.example .env
# Fill in Supabase, Razorpay, and Brevo values
npm install
npm run dev
```

App runs at [http://localhost:3001](http://localhost:3001).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run typecheck` | TypeScript |
| `npm run lint` | ESLint |
| `npm run test` | Unit tests |
| `npm run test:e2e` | Playwright e2e |

## Production deployment

See **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** for Vercel, Supabase, Razorpay, Brevo, OAuth, and custom domain setup.

- **Production URL:** `https://chandnaindoorground.in`
- **Health check:** `GET /api/health`
- **Checklist:** [docs/PRODUCTION_CHECKLIST.md](docs/PRODUCTION_CHECKLIST.md)
- **Backups:** [docs/BACKUP.md](docs/BACKUP.md)

## Environment variables

All configuration is via environment variables. See [.env.example](.env.example).

## CI

GitHub Actions runs typecheck, lint, tests, build, and Playwright on every push/PR.
