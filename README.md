# Personal Assistant Thing

A minimal web-based personal assistant that connects to local Ollama models for chat conversations. Built with Next.js, TypeScript, and TailwindCSS.

## Features

- Chat interface with conversation threads
- Local LLM integration via Ollama
- Persistent conversation history (PostgreSQL)
- Markdown rendering with syntax highlighting
- Dark/light mode support
- Keyboard shortcuts for message history

## Prerequisites

- Node.js 20+ and npm
- Docker and Docker Compose (for database)
- [Ollama](https://ollama.ai/) installed and running locally
- At least one Ollama model pulled (default: `gpt-oss`)

## Installation

```bash
npm install
```

## Setup

1. Create a `.env` file with the following variables:

```bash
# PostgreSQL Database
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/personal_assistant
POSTGRES_PASSWORD=your_password
POSTGRES_USER=postgres
POSTGRES_DB=personal_assistant
POSTGRES_PORT=5432

# Valkey (Redis-compatible cache)
VALKEY_PASSWORD=your_valkey_password
```

2. Start Docker containers (PostgreSQL and Valkey):

```bash
npm run start:docker
```

3. Run database migrations:

```bash
npm run db:migrate
```

## Development

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run db:generate` - Generate database migrations
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Drizzle Studio

## Usage

1. Create a new thread or select an existing one from the sidebar
2. Type your message and press Enter (or click Send)
3. Use Arrow Up/Down keys to navigate through message history
4. Toggle theme using the theme selector in the sidebar

## Project Structure

- `app/` - Next.js App Router pages and API routes
- `src/components/` - React components
- `src/lib/` - Utility functions (Ollama client, database)
- `src/types.ts` - TypeScript type definitions
- `scripts/` - Docker startup scripts

## Tech Stack

- **Framework**: Next.js 16
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Database**: PostgreSQL with Drizzle ORM
- **LLM**: Ollama
