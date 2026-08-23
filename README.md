This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Database

The product menu and orders are stored in PostgreSQL. For local development:

```bash
docker compose up -d db          # start Postgres on localhost:5433
cp .env.local.example .env.local # then fill in TELEGRAM_* and DATABASE_URL
npm run db:migrate               # create tables
npm run db:seed                  # load the menu
```

## Deploy with Docker

`docker compose up -d app` builds and runs the app container, reading config straight from `.env.local`
(TELEGRAM_*, DATABASE_URL, ADMIN_USERNAME, ADMIN_PASSWORD) — no separate `.env` file needed. Point
`DATABASE_URL` at whichever Postgres you're using (the bundled `db` service or an external one); the `db`
service here is only for local development and isn't required by `app`.

## Admin

`/admin` (order-by-day view + revenue stats) is protected by HTTP Basic Auth. Set `ADMIN_USERNAME` and
`ADMIN_PASSWORD` in your env — required in every environment, or the admin routes reject all requests.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
