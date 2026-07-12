# redline

Redline is a modern web application built using Next.js 14 App Router and TypeScript. It is configured with strict linting, Tailwind CSS, shadcn/ui for beautiful and accessible components, and Prisma ORM connected to a PostgreSQL database for robust data management. Code quality is maintained through a combination of ESLint, Prettier, Husky pre-commit hooks, and an automated GitHub Actions CI pipeline.

## Quick Start

For local development, you need to run two separate processes in two different terminals:
1. `npm run dev` (starts the Next.js web application)
2. `npm run worker` (starts the background workers for extracting text and reminders)
