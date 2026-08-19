# ShopAI

ShopAI is an AI-first e-commerce monorepo that combines a modern storefront, an admin dashboard, and a document-aware support chatbot in one codebase.

It includes:

- a customer-facing store built with Next.js
- an internal admin panel for products, documents, analytics, and AI tools
- a FastAPI backend for products, uploads, chat, and AI workflows
- a RAG chatbot powered by LangGraph, Gemini, and pgvector

## What This Project Does

### Storefront

- Home page with hero carousel, promo content, category sections, and product rows
- Product listing, category pages, and product detail pages
- Cart drawer with persistent state
- Quick view, related products, and recently viewed products
- Responsive navigation with polished UX touches

### Admin Dashboard

- Product CRUD with Cloudinary image upload
- AI-assisted product copy improvement
- Document upload and indexing for RAG
- Chatbot testing interface with streaming answers and citations
- Analytics and settings pages

### AI and RAG

- Document parsing, chunking, embedding, and vector indexing
- Multi-agent chat routing with LangGraph
- Support answers grounded in uploaded documents
- Product-specific query handling through a separate agent
- SSE-based real-time chatbot streaming

## Chatbot Agent Roles

The chatbot currently has three roles:

- `supervisor` - routes each user query to the right specialist
- `support` - handles policy, shipping, returns, order tracking, and other document-backed questions using RAG
- `product` - handles product-related shopping and catalog questions

## Tech Stack

| Category | Technology |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS v4 |
| UI Components | shadcn/ui on `@base-ui/react` |
| State | TanStack Query v5 |
| Forms | react-hook-form + Zod |
| Motion | Framer Motion |
| Smooth Scroll | Lenis |
| Icons | Phosphor Icons |
| Backend | FastAPI, Python 3.12 |
| ORM | SQLAlchemy 2.0 async |
| Database | PostgreSQL + pgvector |
| Validation | Pydantic v2 |
| AI Models | Gemini 2.5 Flash, `embedding-001` |
| AI Framework | LangChain + LangGraph |
| Image Storage | Cloudinary |
| Monorepo Tooling | pnpm + Turborepo |

## Getting Started

### Prerequisites

- Node.js `>= 20`
- pnpm `>= 10.33`
- Python `>= 3.12`
- PostgreSQL with the [pgvector](https://github.com/pgvector/pgvector) extension enabled

### Install

```bash
pnpm install
```

### Environment Variables

Create `apps/client/.env.local`:

```env
NEXT_PUBLIC_API_URL="http://localhost:8000/api/v1"
```

Create `apps/server/.env`:

```env
DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"
APP_NAME=ShopAI
APP_DEBUG=false
GEMINI_API_KEY="your-gemini-api-key"
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_UPLOAD_PRESET="your-upload-preset"
CLOUDINARY_API_SECRET="your-api-secret"
FRONTEND_URL="http://localhost:3000"
KEEP_ALIVE_URLS="http://localhost:8000/health"
KEEP_ALIVE_INTERVAL_SECONDS="600"
```

### Develop

Run both apps from the repo root:

```bash
pnpm dev
```

This starts:

- client on `http://localhost:3000`
- server on `http://localhost:8000`

Or run them individually:

```bash
cd apps/client && pnpm dev
cd apps/server && pnpm dev
```

## Project Structure

```text
shop-ai/
├── apps/
│   ├── client/
│   │   ├── app/
│   │   │   ├── (admin)/admin/        admin pages: dashboard, products, documents, chatbot, analytics, settings
│   │   │   ├── (store)/store/        storefront pages
│   │   │   ├── error.tsx             route-level error UI
│   │   │   ├── global-error.tsx      global error UI
│   │   │   ├── not-found.tsx         404 page
│   │   │   ├── robots.ts             SEO robots
│   │   │   └── sitemap.ts            SEO sitemap
│   │   ├── components/
│   │   │   ├── chatbot/              floating storefront chatbot
│   │   │   ├── layout/               admin shell UI
│   │   │   ├── shared/               reusable client utilities and UI
│   │   │   ├── store/                storefront components
│   │   │   └── store/home/           home page sections
│   │   ├── hooks/                    admin and store hooks
│   │   ├── lib/                      client utilities
│   │   ├── server/                   API fetchers
│   │   └── types/                    frontend types
│   └── server/
│       ├── agents/                   LangGraph supervisor and specialists
│       ├── api/                      FastAPI routes
│       ├── controllers/              business logic
│       ├── core/                     config, database, dependencies
│       ├── db/                       repositories
│       ├── models/                   SQLAlchemy models
│       ├── schemas/                  Pydantic schemas
│       ├── scripts/                  import and utility scripts
│       ├── uploads/documents/        uploaded RAG files
│       └── utils/                    parsing, chunking, embedding, AI helpers
├── packages/
│   ├── ui/
│   ├── eslint-config/
│   └── typescript-config/
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

## Key Features

### Admin Features

| Area | Description |
|---|---|
| Products | Full CRUD with Cloudinary image upload and AI-assisted copy improvement |
| Documents | Upload, parse, chunk, embed, and index documents for RAG |
| Chatbot | Streaming multi-agent chat with citations |
| Analytics | Dashboard metrics and charts |
| Settings | App-level configuration UI |

### Store Features

- Product browsing with category-based navigation
- Product detail experience with cart actions
- Related and recently viewed products
- Responsive layout with store-specific navigation
- Smooth scrolling, loading skeletons, and UX polish

### Platform Features

- SEO via `robots.ts` and `sitemap.ts`
- Error boundaries and custom 404 flows
- Keep-alive support for hosted backend uptime
- Import and batch-processing scripts for product data

## How the RAG Pipeline Works

1. A document is uploaded from the admin dashboard.
2. The backend parses the file into text.
3. The text is split into smaller chunks.
4. Embeddings are generated with Gemini `embedding-001`.
5. Chunks and vectors are stored in PostgreSQL using pgvector.
6. During chat, the user query is embedded and matched against stored chunks.
7. Retrieved context is passed into the support agent.
8. The final answer is streamed to the UI over SSE with source citations.

## API Reference

All endpoints are prefixed with `/api/v1`. The server runs on `http://localhost:8000`.

### Admin

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/products` | Create a product |
| `GET` | `/products` | List products |
| `GET` | `/products/:id` | Get product by UUID |
| `PUT` | `/products/:id` | Update a product |
| `DELETE` | `/products/:id` | Delete a product |
| `POST` | `/upload/image` | Upload an image to Cloudinary |
| `POST` | `/ai/improve` | Improve product name or description with AI |
| `POST` | `/documents/upload` | Upload a document for RAG ingestion |
| `GET` | `/documents` | List uploaded documents |
| `DELETE` | `/documents/:id` | Delete a document and its chunks |
| `POST` | `/chat/message` | Stream chatbot response via SSE |

### Store

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/store/products` | List published products |
| `GET` | `/store/products/:slug` | Get product by slug |
| `GET` | `/store/categories` | List distinct product categories |

### Health

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check |

## Quality Gates

Run from the repo root:

```bash
pnpm typecheck
pnpm lint
pnpm format
```

Or run per app:

```bash
cd apps/client && pnpm typecheck
cd apps/server && pnpm typecheck
```

## UI Components

The shared UI package contains 33 shadcn/ui components built on `@base-ui/react`.

Import components like this:

```tsx
import { Button } from "@workspace/ui/components/button"
```

Add a new component with:

```bash
pnpm dlx shadcn@latest add <component> -c packages/ui
```

## Design Notes

- Semantic OKLCH color tokens with the Mira/taupe theme
- Lora for headings, Raleway for body text, Geist Mono for code
- Framer Motion for transitions and interaction polish
- Lenis for smooth scrolling
- A clean, modern, card-driven visual style

## License

MIT
