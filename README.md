# CarburApp

A mobile-first, open-source fuel tracking app for your vehicles. Log refuels, monitor consumption, track expenses, and stay on top of maintenance deadlines — all in one place.

Built as a Progressive Web App (PWA) so it works offline and can be installed on any device.

![CarburApp social preview](public/og-image.png)

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma)
![License](https://img.shields.io/badge/license-MIT-green)

## Features

- **Fuel log** — record refuels with date, fuel type, liters, price, and odometer
- **Dashboard** — monthly spend, average consumption, and a quick overview at a glance
- **History** — timeline of all refuels grouped by week or month
- **Statistics** — charts and trends for spend and consumption over time
- **Deadlines** — track insurance, road tax, MOT, oil changes, and any custom reminders
- **Multi-vehicle** — manage multiple vehicles from one account
- **Dark / Light theme** — respects system preference, switchable at any time
- **PWA** — installable, works offline with a Service Worker cache

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| UI | React 19 |
| Database ORM | Prisma 7 |
| Database | PostgreSQL |
| Styling | CSS Modules + CSS custom properties |
| PWA | Next.js native PWA (Service Worker) |

## Getting started

### Prerequisites

- Node.js 20+
- PostgreSQL database (local or hosted, e.g. [Neon](https://neon.tech), [Supabase](https://supabase.com))

### Installation

```bash
git clone https://github.com/your-username/carburapp.git
cd carburapp
npm install
```

### Environment variables

Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
```

### Database setup

```bash
# Apply the schema and generate the Prisma client
npx prisma migrate dev --name init
```

### Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server (Turbopack) |
| `npm run build` | Build for production |
| `npm run start` | Start the production server |
| `npx prisma studio` | Open Prisma Studio to inspect the database |

## Project structure

```
carburapp/
├── app/                  # Next.js App Router (pages, API routes, layout)
│   ├── api/              # REST API endpoints (vehicles, refuels, dashboard)
│   ├── layout.tsx        # Root layout with theme provider
│   └── page.tsx          # Entry point
├── components/           # Shared UI components
│   └── screens/          # Full-screen views (Dashboard, History, Stats, Deadlines)
├── contexts/             # React contexts (ThemeContext)
├── lib/                  # Shared utilities and TypeScript types
├── prisma/               # Database schema and migrations
├── public/               # Static assets and Service Worker
└── docs/                 # Design references and project background
```

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.

## License

This project is licensed under the [MIT License](LICENSE).
