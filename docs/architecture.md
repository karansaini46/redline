# Redline Platform Architecture

This document provides a high-level overview of the Redline Platform's technical architecture, including our data model, authentication flow, and key engineering decisions.

## 1. Data Model Overview

The Redline Platform utilizes PostgreSQL via Prisma ORM. The core domain models are:

- **Users & Organizations:** A `User` can belong to multiple `Organizations` through a `Membership` junction model. Roles (Owner, Admin, Member) are enforced at the membership level.
- **Contracts:** The central entity. Contracts belong to an Organization and have multiple `ContractVersions` (to track history and redlines).
- **Clauses:** Extracted from Contracts, these represent specific legal provisions. Each `Clause` has a type (e.g., Indemnification, Termination), a risk score (0-100), and AI-generated analysis.
- **Obligations:** Actionable items extracted from Contracts, such as payment deadlines or renewal notices. They have a `due_date` and a `status` (OPEN, FULFILLED).

## 2. Authentication & Authorization

Authentication is handled via **NextAuth.js (Auth.js)**. 

- **Session Management:** We use JWT-based sessions for stateless horizontal scaling. 
- **Providers:** Users authenticate via Google OAuth or Magic Links.
- **Row-Level Security (RLS) / Multi-tenancy:** Authorization is enforced at the server action and data access layers. Every Prisma query requires filtering by `organization_id`, and a middleware/RBAC layer ensures the authenticated user has a valid membership to that organization before granting access.

## 3. Engineering Decisions & Trade-offs

### Decision 1: Background Job Queues with Redis (Upstash)
**Context:** Contract processing (PDF text extraction, semantic chunking, Gemini API calls) is slow and prone to timeouts if done synchronously in an HTTP request.
**Decision:** We implemented an asynchronous background worker pipeline using Redis queues.
**Trade-off:** Adds infrastructure complexity (managing Redis, separate worker processes) but dramatically improves user experience by freeing up the UI and providing real-time progress updates.

### Decision 2: Server Actions vs API Routes
**Context:** Next.js App Router supports both standard API routes and Server Actions.
**Decision:** We heavily utilize Server Actions for data mutations (e.g., uploading contracts, updating obligations) coupled with Zod validation.
**Trade-off:** Server Actions provide excellent type safety and reduce boilerplate, but they can make complex error handling and rate-limiting slightly more challenging compared to traditional REST API endpoints.

### Decision 3: "Vanilla CSS" & Tailwind for Premium UI
**Context:** The platform requires an enterprise-grade, highly polished UI.
**Decision:** We use Tailwind CSS for utility styling alongside custom CSS (`index.css`) for complex animations, glassmorphism, and precise typographic control.
**Trade-off:** Mixing Tailwind with custom CSS requires careful organization to avoid specificity clashes, but it allows us to achieve a bespoke, premium aesthetic (e.g., sophisticated micro-animations) that would be difficult with standard UI component libraries alone.

### Decision 4: Using Prisma as the ORM
**Context:** We need a type-safe way to interact with PostgreSQL.
**Decision:** Prisma provides an excellent developer experience with auto-generated types.
**Trade-off:** Prisma can sometimes be a bottleneck for extremely complex analytical queries, and its bundle size is non-trivial in serverless environments, but the development speed and type safety benefits currently outweigh these concerns.
