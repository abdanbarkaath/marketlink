🌐 MarketLink

MarketLink is a local marketing marketplace that connects small businesses (like salons, restaurants, gyms, etc.) with verified local marketing professionals and agencies.
Think “Yelp × Upwork” — hyper-local, marketing-focused, and proximity-powered.

🚀 Tech Stack
Layer	Technology	Purpose
Frontend	Next.js 14 + TypeScript + TailwindCSS	Responsive, SEO-friendly UI
Backend	Fastify (Node.js)	Lightweight, fast REST API
ORM	Prisma	Type-safe database access
Database	PostgreSQL (Neon)	Cloud-hosted relational database
Auth	Magic Link (Passwordless)	Easy, secure login (planned)
Storage	Cloudinary / AWS S3	For media uploads
Email	Resend / SendGrid	For inquiries and notifications
Hosting	Vercel (frontend), Render (backend)	Cloud deployment
🧩 Core Features (MVP)

📍 Marketplace Search

Search by city, suburb, or ZIP

Filter by service, rating, and distance

Sort by proximity (Haversine formula)

👤 Provider Profiles

Business info, Google rating, verified badge

Portfolio and services offered

Direct contact form (email relay)

📊 Provider Dashboard

Profile editing

Inquiry tracking

Analytics (views, leads, avg. distance)

🛡️ Admin Panel

Approve, verify, and manage providers

Monitor reported listings

🗄️ Folder Structure
marketlink/
│
├── marketlink-frontend/   # Next.js 14 app
│   ├── src/app/           # App Router pages
│   ├── src/components/    # Reusable components
│   └── ...
│
└── marketlink-backend/    # Fastify + Prisma API
    ├── src/server.ts      # Fastify entry point
    ├── prisma/schema.prisma
    ├── .env               # Database URL (Neon)
    └── ...

🧱 Local Development
1. Clone the repo
git clone https://github.com/abdanbarkaath/marketlink.git
cd marketlink

2. Install frontend dependencies
cd marketlink-frontend
npm install
npm run dev


Runs on http://localhost:3000

3. Install backend dependencies
cd ../marketlink-backend
npm install
npm run dev


API runs on http://localhost:4000

🧮 Database Setup (Neon + Prisma)

Create a Neon Postgres project and copy its connection string

Paste it into .env:

DATABASE_URL="postgresql://user:password@host.neon.tech/db?sslmode=require"


Run the first migration:

npx prisma migrate dev --name init

📈 Roadmap

✅ MVP — Marketplace + Proximity Search

🔜 Phase 2 — Provider Dashboard + Analytics

🔜 Phase 3 — Admin Panel + Verification System

🔜 Phase 4 — Stripe Payments + Subscription Tiers

🔜 Phase 5 — AI Chat Assistant (Provider Recommendations)

🧑‍💻 Author

Abdan Zafar Barkaath
Senior Front-End Developer
📧 abdanbarkaath10@gmail.com

🔗 LinkedIn

🪪 License

This project is licensed under the MIT License — feel free to use and modify with attribution.
