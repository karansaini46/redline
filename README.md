<div align="center">
  <h1>Redline Platform</h1>
  <p><strong>Contract analysis, elevated.</strong></p>
  
  <p>
    <a href="https://github.com/karansaini46/redline/actions"><img src="https://img.shields.io/github/actions/workflow/status/karansaini46/redline/ci.yml?branch=main" alt="Build Status"></a>
    <a href="https://github.com/karansaini46/redline/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License"></a>
    <img src="https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white" alt="TypeScript">
    <img src="https://img.shields.io/badge/Next.js-000000?logo=nextdotjs&logoColor=white" alt="Next.js">
  </p>
</div>

Redline transforms complex legal documents into structured intelligence. Experience superhuman accuracy without sacrificing the nuance of human craft.

> ⚠️ **Note:** This project is in active development.

## 🚀 Features

- **Semantic Parsing:** Documents are instantly torn down into structured clauses, maintaining the exact intent and context of the original author.
- **Risk Detection:** Subtle deviations from standard playbooks are flagged immediately, calculating exposure before negotiations begin.
- **Obligation Tracking:** Hidden renewals and buried payment terms are extracted into actionable, forward-looking timelines.
- **Enterprise UI:** A premium, monochromatic design system built for professional legal operations.

## 🛠 Tech Stack

- **Framework:** [Next.js 14 App Router](https://nextjs.org/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Database:** [PostgreSQL](https://www.postgresql.org/) & [Prisma ORM](https://www.prisma.io/)
- **Styling:** Custom CSS + [Tailwind CSS](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/)
- **AI Processing:** Google Gemini API
- **Background Jobs:** Redis (via Upstash)
- **Auth:** NextAuth (Auth.js)

## 🏁 Quick Start

To run the application locally, you'll need Node.js and a PostgreSQL instance.

### 1. Clone & Install
```bash
git clone https://github.com/karansaini46/redline.git
cd redline
npm install
```

### 2. Environment Variables
Copy `.env.example` to `.env` and fill in the required keys (Database, Redis, Auth, Gemini API):
```bash
cp .env.example .env
```

### 3. Database Setup
```bash
npx prisma generate
npx prisma db push
```

### 4. Run Development Servers
You must run both the web application and the background worker. Open two terminals:

**Terminal 1 (Web App):**
```bash
npm run dev
```

**Terminal 2 (Background Worker):**
```bash
npm run worker
```

Navigate to `http://localhost:3000` to access the platform.

## 📖 Documentation

- [Architecture Overview](docs/architecture.md)
- [Contributing Guidelines](CONTRIBUTING.md)
- [Changelog](CHANGELOG.md)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
